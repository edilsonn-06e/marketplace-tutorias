import { useEffect } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { markerIcon, TILE_ATTRIBUTION, TILE_URL, type LatLng } from './leaflet';
import styles from './RouteMap.module.scss';

interface RouteMapProps {
  from: LatLng;
  to: LatLng;
  path: [number, number][];
  fromLabel?: string;
  toLabel?: string;
}

function FitToRoute({ path }: { path: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (path.length > 0) map.fitBounds(path, { padding: [40, 40] });
  }, [path, map]);
  return null;
}

export function RouteMap({ from, to, path, fromLabel = 'Tutor', toLabel = 'Tú' }: RouteMapProps) {
  return (
    <MapContainer center={from} zoom={13} className={styles.map}>
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <Polyline positions={path} pathOptions={{ color: '#4f46e5', weight: 5, opacity: 0.8 }} />
      <Marker position={from} icon={markerIcon}>
        <Tooltip permanent direction="top">{fromLabel}</Tooltip>
      </Marker>
      <Marker position={to} icon={markerIcon}>
        <Tooltip permanent direction="top">{toLabel}</Tooltip>
      </Marker>
      <FitToRoute path={path} />
    </MapContainer>
  );
}
