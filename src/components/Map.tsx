import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L, { LeafletMouseEvent } from 'leaflet';

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522]; // Paris

// Correction icônes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
  iconUrl: '/leaflet/images/marker-icon.png',
  shadowUrl: '/leaflet/images/marker-shadow.png',
});

function ForceResize() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);
  return null;
}

export default function MapInteractive() {
  const [points, setPoints] = useState<[number, number][]>([]);

  function ClickHandler() {
    useMapEvents({
      click(e: LeafletMouseEvent) {
        setPoints((pts) => [...pts, [e.latlng.lat, e.latlng.lng]]);
      },
    });
    return null;
  }

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={12}
      style={{ height: '600px', width: '100%' }}
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
    </MapContainer>
  );
}