import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { Marker as LeafletMarker } from 'leaflet';
import { GUATEMALA_CENTER, markerIcon, TILE_ATTRIBUTION, TILE_URL, type LatLng } from './leaflet';
import styles from './MapPicker.module.scss';

interface MapPickerProps {
  value: LatLng | null;
  onChange: (point: LatLng) => void;
}

function ClickHandler({ onChange }: { onChange: (point: LatLng) => void }) {
  useMapEvents({
    click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

function FlyTo({ point }: { point: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo(point, 16);
  }, [point, map]);
  return null;
}

export function MapPicker({ value, onChange }: MapPickerProps) {
  const [focus, setFocus] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onChange(point);
        setFocus(point);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div className={styles.wrapper}>
      <MapContainer center={value ?? GUATEMALA_CENTER} zoom={value ? 15 : 12} className={styles.map}>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <ClickHandler onChange={onChange} />
        <FlyTo point={focus} />
        {value && (
          <Marker
            position={value}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const { lat, lng } = (e.target as LeafletMarker).getLatLng();
                onChange({ lat, lng });
              },
            }}
          />
        )}
      </MapContainer>

      <div className={styles.footer}>
        <button type="button" className="btn btn--outline" onClick={locateMe} disabled={locating}>
          {locating ? 'Buscando…' : 'Usar mi ubicación'}
        </button>
        <span className={styles.coords}>
          {value ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : 'Haz clic en el mapa para marcar tu ubicación'}
        </span>
      </div>
    </div>
  );
}