import 'leaflet/dist/leaflet.css';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { BsBoxArrowInRight, BsBoxArrowRight } from 'react-icons/bs';
import {
	CircleMarker,
	GeoJSON,
	MapContainer,
	Polyline,
	Popup,
	TileLayer,
	useMapEvents,
	ZoomControl
} from 'react-leaflet';
import { Itinerary, MetroNetwork } from '@/lib/types';
import next from 'next';

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522]; // Paris

type Stop = {
	stop_id: string;
	name: string;
	latitude: number;
	longitude: number;
	route_names: string[];
	route_colors: string[];
	route_text_colors: string[];
};

type InteractiveMapProps = {
	customGraph?: MetroNetwork;
	itinerary?: Itinerary;
	displayGraph: boolean;
	onDepartureSelected?: (stopId: string) => any;
	onDestinationSelected?: (stopId: string) => any;
	stationToZoom?: string | null;
	onZoomEnd?: () => void;
};

export default function InteractiveMap({
	customGraph,
	itinerary,
	onDepartureSelected,
	onDestinationSelected,
	displayGraph,
	stationToZoom,
	onZoomEnd
}: InteractiveMapProps) {
	const BASE_ZOOM_LEVEL = 12;
	const [routePaths, setRoutePaths] = useState<any>(null);
	const [stops, setStops] = useState<Stop[]>([]);
	const [currentZoom, setCurrentZoom] = useState(12);
	const mapRef = useRef<L.Map | null>(null);

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
				setStops(data.stops);
			});
	}, []);

	const stopsById = new Map<string, Stop>();
	for (const stop of stops) {
		if (!stopsById.has(stop.stop_id)) {
			stopsById.set(stop.stop_id, { ...stop });
		} else {
			const existing = stopsById.get(stop.stop_id)!;
			const allLines = new Set([...existing.route_names, ...stop.route_names]);
			existing.route_names = Array.from(allLines);
		}
	}
	const uniqueStops = Array.from(stopsById.values());

	useEffect(() => {
		if (stationToZoom && mapRef.current) {
			const stop = uniqueStops.find((s) => s.name === stationToZoom);
			if (stop) {
				mapRef.current.setView([stop.latitude, stop.longitude], 16, {
					animate: true
				});
			}
		}
	}, [stationToZoom, uniqueStops]);

	useEffect(() => {
		if (stationToZoom && mapRef.current) {
			// ...zoom...
			onZoomEnd?.();
		}
	}, [stationToZoom, uniqueStops]);

	// Calculate radius based on zoom level
	const calculateRadius = useCallback((zoom: number) => {
		const minRadius = 1;
		const maxRadius = 8;
		const baseRadiusAtReference = 4; // Desired radius at reference zoom

		// Exponential scaling to match map zoom behavior
		const scaledRadius =
			baseRadiusAtReference * Math.pow(2, zoom - BASE_ZOOM_LEVEL);

		// Apply min/max constraints
		const finalRadius = Math.max(minRadius, Math.min(maxRadius, scaledRadius));

		return finalRadius;
	}, []);

	// Component to handle zoom events
	const ZoomHandler = () => {
		useMapEvents({
			zoomend: (e) => {
				setCurrentZoom(e.target.getZoom());
			}
		});
		return null;
	};

	const currentRadius = calculateRadius(currentZoom);
	if (displayGraph && customGraph && !itinerary) {
		return (
			<div className='relative h-full z-0'>
				<MapContainer
					center={DEFAULT_CENTER}
					zoom={BASE_ZOOM_LEVEL}
					zoomControl={false}
					style={{ zIndex: -500, width: '100%', height: '100%' }}
				>
					<ZoomControl position='bottomright' />
					<ZoomHandler />
					<TileLayer
						url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
						attribution='&copy; OpenStreetMap contributors | &copy; IDFM'
					/>
					{Object.values(customGraph.nodes).map((stop) => (
						<CircleMarker
							key={stop.id + Math.random()}
							center={[stop.latitude, stop.longitude]}
							radius={5}
							pathOptions={{
								color: '#' + stop.line.color,
								fillColor: '#' + stop.line.color,
								fillOpacity: 1
							}}
						>
							<Popup>
								<h1>{stop.id}</h1>
								<h2>{stop.name}</h2>
							</Popup>
						</CircleMarker>
					))}
					{Object.values(customGraph.edges).map((edges) =>
						edges.map((edge) => {
							const from = customGraph.nodes[edge.fromId];
							const to = customGraph.nodes[edge.toId];
							if (!from || !to) return <React.Fragment></React.Fragment>;
							return (
								<Polyline
									key={from.id + to.id + Math.random()}
									positions={[
										[from.latitude, from.longitude],
										[to.latitude, to.longitude]
									]}
									pathOptions={{
										color: edge.isTransfer ? '#000' : '#' + from.line.color
									}}
								>
									<Popup>
										<div>Duration: {String(edge.duration)}s</div>
										<div>Transfer: {String(edge.isTransfer)}</div>
									</Popup>
								</Polyline>
							);
						})
					)}
				</MapContainer>
			</div>
		);
	}

	let itineraryLines: React.ReactNode[] = [];
	let itineraryMarkers: React.ReactNode[] = [];
	if (itinerary) {
		itinerary.segments.forEach((segment) =>
			segment.stops.forEach((stop, i) => {
				const currentStop = stops.find((s) => s.name === stop.name);
				let line;
				if (i < segment.stops.length - 1) {
					const nextStop = stops.find(
						(s) => s.name === segment.stops[i + 1].name
					);
					if (currentStop && nextStop)
						itineraryLines.push(
							<Polyline
								key={currentStop.stop_id + nextStop.stop_id}
								positions={[
									[currentStop.latitude, currentStop.longitude],
									[nextStop.latitude, nextStop.longitude]
								]}
								pathOptions={{
									color: '#' + segment.line.color,
									weight: 10
								}}
							/>
						);
				}
				const isBig = i === 0 || i === segment.stops.length - 1;
				if (!currentStop) return;
				itineraryMarkers.push(
					<CircleMarker
						key={currentStop.stop_id + Math.random()}
						center={[currentStop.latitude, currentStop.longitude]}
						radius={isBig ? currentRadius : 3}
						pathOptions={{
							fillColor: isBig ? '#fff' : '#000',
							fillOpacity: 1,
							color: '#000',
							weight: isBig ? currentRadius / 2 : 0
						}}
					/>
				);
			})
		);
	}
	return (
		<div className='relative h-full z-0'>
			<MapContainer
				center={DEFAULT_CENTER}
				zoom={BASE_ZOOM_LEVEL}
				zoomControl={false}
				style={{ width: '100%', height: '100%' }}
			>
				<ZoomControl position='bottomright' />
				<ZoomHandler />
				<TileLayer
					url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
					attribution='&copy; OpenStreetMap contributors | &copy; IDFM'
				/>
				{itinerary && (
					<>
						{itineraryLines}
						{itineraryMarkers}
					</>
				)}
				{routePaths && !itinerary && (
					<GeoJSON
						data={routePaths}
						style={(feature) => ({
							weight: 2 + currentRadius / 2,
							color: '#' + feature!.properties.colourweb_hexa,
							lineJoin: 'round'
						})}
					/>
				)}
				{currentZoom > 10 &&
					!itinerary &&
					uniqueStops.map((stop) => {
						const lines = stop.route_names;
						const colors = stop.route_colors.map((color) =>
							color.startsWith('#') ? color : `#${color}`
						);
						const textColors = stop.route_text_colors.map((color) =>
							color.startsWith('#') ? color : `#${color}`
						);
						const mainColor = colors[0] || '#3388ff';
						const isMultipleRoutes = stop.route_names.length > 1;
						return (
							<React.Fragment key={stop.stop_id}>
								<CircleMarker
									center={[stop.latitude, stop.longitude]}
									radius={currentRadius}
									pathOptions={{
										color: isMultipleRoutes ? '#000' : mainColor, // border color
										weight: currentRadius / 3,
										fillColor: isMultipleRoutes ? '#fff' : mainColor, // fill color
										fillOpacity: 1
									}}
								>
									<Popup className='relative'>
										<b>{stop.name}</b>
										<br />
										<div className='pb-3'>
											{lines
												.sort((a, b) => parseInt(a) - parseInt(b))
												.map((line, i) => (
													<Image
														className='inline mr-1'
														key={line}
														alt={line}
														src={`/metros/${line}.png`}
														width={16}
														height={16}
													/>
												))}
										</div>
										<div
											className='w-full text-center flex justify-center items-center gap-3
											*:cursor-pointer *:hover:bg-blue-400 *:rounded-xs *:hover:text-white
											*:flex *:justify-center *:items-center *:gap-2 *:px-2 *:active:translate-y-0.5'
										>
											<button
												onClick={() =>
													onDepartureSelected &&
													onDepartureSelected(stop.stop_id)
												}
											>
												<BsBoxArrowRight />
												<span>Départ</span>
											</button>
											<span className='!w-px h-3 bg-black !p-0 pointer-events-none'></span>
											<button
												onClick={() =>
													onDestinationSelected &&
													onDestinationSelected(stop.stop_id)
												}
											>
												<BsBoxArrowInRight />
												<span>Arrivée</span>
											</button>
										</div>
									</Popup>
								</CircleMarker>
							</React.Fragment>
						);
					})}
			</MapContainer>
		</div>
	);
}
