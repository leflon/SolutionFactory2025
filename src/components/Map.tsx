import { MapContainer, TileLayer, Marker, Polyline, GeoJSON, useMapEvents, useMap, Popup, CircleMarker } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L, { LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Feature } from 'geojson';
import { renderToStaticMarkup } from "react-dom/server";
import { VscDebugBreakpointData } from "react-icons/vsc";
import { BiSolidPolygon } from "react-icons/bi";
import { FaRegCircle } from "react-icons/fa";
import React from 'react';

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
  shadowSize: [20, 20]
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
  const [points, setPoints] = useState<[number, number][]>([]);
  const [geojson, setGeojson] = useState<any>(null);
  const [colorMap, setColorMap] = useState<{ [key: string]: string }>({});
  const [coloredGeojson, setColoredGeojson] = useState<any>(null);
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

  // Fetch route colors from the database
  useEffect(() => {
    fetch('/api/routes-colors')
      .then(res => res.text())
      .then(text => {
        console.log('routes-colors response:', text);
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

  // After fetching geojson and routeColors
  useEffect(() => {
    if (geojson && geojson.features && colorMap && Object.keys(colorMap).length > 0) {
      const newGeojson = {
        ...geojson,
        features: geojson.features.map((feature: Feature) => {
          const routeId = (feature.properties as any)?.colourweb_hexa;
          if (routeId && colorMap[routeId]) {
            return {
              ...feature,
              properties: {
                ...feature.properties,
                color: '#' + colorMap[routeId].replace(/^#/, ''),
              },
            };
          }
          return feature;
        }),
      };
      setColoredGeojson(newGeojson);
    }
  }, [geojson, colorMap]);

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

  function ClickHandler() {/*
    useMapEvents({
      click(e: LeafletMouseEvent) {
        setPoints((pts) => [...pts, [e.latlng.lat, e.latlng.lng]]);
      },
    });*/
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

  function getStopIcon(color: string = "#e06c75", size: number = 18) {
    // Render the icon as SVG string with the desired color and size
    const svgString = encodeURIComponent(
      renderToStaticMarkup(
        <FaRegCircle color={color} size={size}/>
      )
    );
    return L.divIcon({
      className: '',
      html: `<img src="data:image/svg+xml,${svgString}" style="display:block;" />`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  }

  return (
    <div className="map-wrapper">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        minZoom={13}   //  minimum zoom level
        maxZoom={18}   //  maximum zoom level
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
        {coloredGeojson && (
          <GeoJSON
            data={coloredGeojson}
            style={feature => {
              // Example: choose color based on a property
              switch (feature?.properties?.res_com) {
								case 'METRO 1': return { color: '#FFBE00', weight: 4, opacity: 1 };
                case 'METRO 2': return { color: '#0055C8', weight: 4, opacity: 1 };
								case 'METRO 3': return { color: '#6E6E00', weight: 4, opacity: 1 };
								case 'METRO 4': return { color: '#A0006E', weight: 4, opacity: 1 };
								case 'METRO 5': return { color: '#FF7E2E', weight: 4, opacity: 1 };
								case 'METRO 6': return { color: '#6ECA97', weight: 4, opacity: 1 };
								case 'METRO 7': return { color: '#F49FB3', weight: 4, opacity: 1 };
								case 'METRO 8': return { color: '#D282BE', weight: 4, opacity: 1 };
								case 'METRO 9': return { color: '#B6BD00', weight: 4, opacity: 1 };
								case 'METRO 10': return { color: '#C9910D', weight: 4, opacity: 1 };
								case 'METRO 11': return { color: '#704B1C', weight: 4, opacity: 1 };
								case 'METRO 12': return { color: '#007852', weight: 4, opacity: 1 };
								case 'METRO 13': return { color: '#6EC4E8', weight: 4, opacity: 1 };
								case 'METRO 14': return { color: '#62259D', weight: 4, opacity: 1 };
								case 'METRO 7b': return { color: '#6ECA97', weight: 4, opacity: 1 };
								case 'METRO 3b': return { color: '#6EC4E8', weight: 4, opacity: 1 };
                default: return { color: '#3388ff', weight: 4, opacity: 1 }; // fallback
              }
            }}
          />
        )}
        {uniqueStops.map(stop => {
          const lines = stop.route_names.split(',');
          const colors = stop.route_colors.split(',')
					.map(color => color.startsWith('#') ? color : `#${color}`);
          const textColors = stop.route_text_colors.split(',')
					.map(color => color.startsWith('#') ? color : `#${color}`);
          const mainColor = colors[0] || '#3388ff'; // Default color is blue if no color is specified
					console.log('Stop:', stop, 'Lines:', lines, 'Colors:', colors, 'Text Colors:', textColors);
          return (
            <React.Fragment key={stop.stop_id}>
              <CircleMarker
                center={[stop.latitude, stop.longitude]}
                radius={8}
                pathOptions={{
                  color: mainColor,        // border color
                  fillColor: mainColor,    // fill color
                  fillOpacity: 0.5,
                }}
              />
              <Marker
                position={[stop.latitude, stop.longitude]}
                icon={getStopIcon(mainColor)}
              >
                <Popup>
                  <b>{stop.name}</b>
                  <br />
                  Lines:
                  <ul style={{margin: 0, paddingLeft: 16}}>
                    {lines.map((line, i) => (
                      <li key={line}>
                        <span
                          style={{
                            background: colors[i] || '#ccc',
                            color: textColors[i] || '#000',
                            padding: '2px 6px',
                            borderRadius: 4,
                            marginRight: 4,
                            fontWeight: 600,
                            display: 'inline-block'
                          }}
                        >
                          {line}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
