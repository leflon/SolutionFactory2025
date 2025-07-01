import { MapContainer, TileLayer, Marker, Polyline, GeoJSON, useMapEvents, useMap } from 'react-leaflet';
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

export default function MapInteractive() {
  const [points, setPoints] = useState<[number, number][]>([]);
  const [geojson, setGeojson] = useState<any>(null);

  // Load GeoJSON on mount
  useEffect(() => {
    fetch('/data/raw/traces-du-reseau-ferre-idf.geojson')
      .then((res) => res.json())
      .then(setGeojson)
      .catch(console.error);
  }, []);

  function ClickHandler() {
    useMapEvents({
      click(e: LeafletMouseEvent) {
        setPoints((pts) => [...pts, [e.latlng.lat, e.latlng.lng]]);
      },
    });
    return null;
  }

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
        )}
      </MapContainer>
    </div>
  );
}
