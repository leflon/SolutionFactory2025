import { MapContainer, TileLayer, Marker, Polyline, GeoJSON, useMapEvents, useMap, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L, { LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  iconSize: [18, 28], // width, height (default is [25, 41])
  iconAnchor: [9, 28], // point of the icon which will correspond to marker's location
  popupAnchor: [1, -24],
  shadowSize: [10, 10]
});

type Stop = {
  stop_id: string;
  name: string;
  latitude: number;
  longitude: number;
  route_names: string;
};

export default function MapInteractive() {
  const [points, setPoints] = useState<[number, number][]>([]);
  const [geojson, setGeojson] = useState<any>(null);
  const [stops, setStops] = useState<Stop[]>([]);

  // Load GeoJSON on mount
  useEffect(() => {
    fetch('/data/raw/traces-du-reseau-ferre-idf.geojson')
      .then((res) => res.json())
      .then(setGeojson)
      .catch(console.error);
  }, []);

  // Fetch stops on mount
  useEffect(() => {
    fetch('/api/stops')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched stops:', data.stops);
        setStops(data.stops);
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

  function ClickHandler() {
    useMapEvents({
      click(e: LeafletMouseEvent) {
        setPoints((pts) => [...pts, [e.latlng.lat, e.latlng.lng]]);
      },
    });
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
    <div className="map-wrapper">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <ForceResize />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <ClickHandler />
        {points.map((pos, idx) => (
          <Marker key={idx} position={pos} />
        ))}
        {points.length >= 2 && <Polyline positions={points} />}
        {geojson && (
          <GeoJSON
            data={geojson}
            pointToLayer={(_, latlng) =>
              L.circleMarker(latlng, {
                radius: 6,
                fillColor: '#3388ff',
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8,
              })
            }
            onEachFeature={(feature, layer) => {
              if (feature.properties) {
                layer.bindPopup(
                  `<b>${feature.properties.reseau || ''}</b><br>ID: ${feature.properties.idrefliga || ''}`
                );
              }
            }}
          />
        )}{uniqueStops.map(stop => (
				<Marker
					key={stop.stop_id}
					position={[stop.latitude, stop.longitude]}
					icon={smallIcon}
				>
					<Popup>
						<b>{stop.name}</b>
						<br />
						{stop.route_names
							? <>Lines: {stop.route_names}</>
							: <>No line info</>}
					</Popup>
				</Marker>
        ))}
      </MapContainer>
    </div>
  );
}
