import {
	MapContainer,
	TileLayer,
	Marker,
	Polyline,
	GeoJSON,
	useMapEvents,
	useMap,
	Popup,
	CircleMarker,
} from 'react-leaflet';
import { useEffect, useState } from 'react';
import L, { geoJson, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Feature } from 'geojson';
import { renderToStaticMarkup } from 'react-dom/server';
import { VscDebugBreakpointData } from 'react-icons/vsc';
import { BiSolidPolygon } from 'react-icons/bi';
import { FaRegCircle } from 'react-icons/fa';
import React from 'react';
import { t } from '@/lib/i18n';

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522]; // Paris

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
	iconUrl: '/leaflet/images/marker-icon.png',
	shadowUrl: '/leaflet/images/marker-shadow.png',
});

// Define a smaller icon
const smallIcon = L.icon({
	iconUrl: '/leaflet/images/marker-icon.png',
	iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
	shadowUrl: '/leaflet/images/marker-shadow.png',
	iconSize: [100, 280], // width, height (default is [25, 41])
	iconAnchor: [9, 28], // point of the icon which will correspond to marker's location
	popupAnchor: [0, 0],
	shadowSize: [20, 20],
});

type Stop = {
	stop_id: string;
	name: string;
	latitude: number;
	longitude: number;
	route_names: string;
	route_colors: string;
	route_text_colors: string;
};

export default function MapInteractive() {
	const [routePaths, setRoutePaths] = useState<any>(null);
	const [colorMap, setColorMap] = useState<{ [key: string]: string }>({});
	const [stops, setStops] = useState<Stop[]>([]);

	// Load GeoJSON on mount
	useEffect(() => {
		fetch('/data/routes-map.geojson')
			.then((res) => res.json())
			.then(setRoutePaths)
			.catch(console.error);
	}, []);

	// Fetch stops on mount
	useEffect(() => {
		fetch('/api/stops')
			.then((res) => res.json())
			.then((data) => {
				console.log('Fetched stops:', data.stops);
				setStops(data.stops);
			});
	}, []);

	// Fetch route colors from the database
	useEffect(() => {
		fetch('/api/routes-colors')
			.then((res) => res.text())
			.then((text) => {
				// Try parsing
				try {
					const data = JSON.parse(text);
					const map: { [key: string]: string } = {};
					for (const row of data) {
						map[row.route_id] = row.background_color;
					}
					setColorMap(map);
				} catch (e) {
					console.error('Failed to parse routes-colors JSON:', e);
				}
			});
	}, []);

	function ForceResize() {
		const map = useMap();
		useEffect(() => {
			function handleResize() {
				map.invalidateSize();
			}
			// Invalidate size several times after mount
			const timeouts = [
				setTimeout(handleResize, 100),
				setTimeout(handleResize, 500),
				setTimeout(handleResize, 1000),
			];
			window.addEventListener('resize', handleResize);
			return () => {
				timeouts.forEach(clearTimeout);
				window.removeEventListener('resize', handleResize);
			};
		}, [map]);
		return null;
	}

	const stopsById = new Map<string, Stop>();

	for (const stop of stops) {
		if (!stopsById.has(stop.stop_id)) {
			stopsById.set(stop.stop_id, { ...stop });
		} else {
			const existing = stopsById.get(stop.stop_id)!;
			const allLines = new Set([
				...existing.route_names.split(','),
				...stop.route_names.split(','),
			]);
			existing.route_names = Array.from(allLines).join(',');
		}
	}
	const uniqueStops = Array.from(stopsById.values());

	return (
		<div className='map-wrapper'>
			<MapContainer
				center={DEFAULT_CENTER}
				zoom={12}
				style={{ height: '100%', width: '100%', zIndex: 0 }}
			>
				<ForceResize />
				<TileLayer
					url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
					attribution='&copy; OpenStreetMap contributors | &copy; IDFM'
				/>
				{routePaths && (
					<GeoJSON
						data={routePaths}
						style={(feature) => ({
							color: '#' + feature!.properties.colourweb_hexa,
						})}
					/>
				)}
				{uniqueStops.map((stop) => {
					const lines = stop.route_names.split(',');
					const colors = stop.route_colors
						.split(',')
						.map((color) => (color.startsWith('#') ? color : `#${color}`));
					const textColors = stop.route_text_colors
						.split(',')
						.map((color) => (color.startsWith('#') ? color : `#${color}`));
					const mainColor = colors[0] || '#3388ff'; // Default color is blue if no color is specified
					const isMultipleRoutes = stop.route_names.indexOf(',') !== -1;
					return (
						<React.Fragment key={stop.stop_id}>
							<CircleMarker
								center={[stop.latitude, stop.longitude]}
								radius={8}
								pathOptions={{
									color: isMultipleRoutes ? '#000' : mainColor, // border color
									fillColor: isMultipleRoutes ? '#fff' : mainColor, // fill color
									fillOpacity: 1,
								}}
							>
								<Popup>
									<b>{stop.name}</b>
									<br />
									<span className='mr-1'>{t('Map.lines')}</span>
									{lines.map((line, i) => (
										<span
											key={i}
											style={{
												background: colors[i] || '#ccc',
												color: textColors[i] || '#000',
												padding: '2px 6px',
												borderRadius: 4,
												marginRight: 4,
												fontWeight: 600,
												display: 'inline-block',
											}}
										>
											{line}
										</span>
									))}
								</Popup>
							</CircleMarker>
						</React.Fragment>
					);
				})}
			</MapContainer>
		</div>
	);
}
