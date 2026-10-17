export interface Point {
  lat: number;
  lng: number;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
const toRad = (deg: number) => (deg * Math.PI) / 180;

// Distancia en línea recta sobre la Tierra (fórmula de Haversine)
export function haversineKm(a: Point, b: Point): number {
  const R = 6371; // radio de la Tierra en km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

interface OsrmResponse {
  code: string;
  routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
}

export interface RouteResult {
  distanceKm: number;
  durationMin: number | null;
  geometry: [number, number][]; // [lat, lng] listo para Leaflet
  source: 'osrm' | 'estimate';
}

// Ruta real por calles usando el servidor público de OSRM (datos de OpenStreetMap)
export async function getRoute(from: Point, to: Point): Promise<RouteResult> {
  // ¡OJO! OSRM usa el orden lng,lat (al revés que Leaflet)
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`OSRM respondió ${res.status}`);
    const data = (await res.json()) as OsrmResponse;
    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route) throw new Error('OSRM no encontró ruta');
    return {
      distanceKm: round2(route.distance / 1000),
      durationMin: Math.round(route.duration / 60),
      geometry: route.geometry.coordinates.map(([lng, lat]): [number, number] => [lat, lng]),
      source: 'osrm',
    };
  } catch (err) {
    // Plan B: si OSRM cae, estimamos con línea recta × 1.3 (factor típico de desvío urbano)
    console.warn('OSRM falló, usando estimación:', (err as Error).message);
    return {
      distanceKm: round2(haversineKm(from, to) * 1.3),
      durationMin: null,
      geometry: [[from.lat, from.lng], [to.lat, to.lng]],
      source: 'estimate',
    };
  }
}