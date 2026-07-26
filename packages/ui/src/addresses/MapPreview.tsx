'use client';
// ─────────────────────────────────────────────────────────────────────────────
// MapPreview — Leaflet/OSM map with an optional draggable marker and a
// click-to-set-pin handler.
//
// Always rendered. When `lat`/`lng` are undefined the marker is hidden and
// the map centers on `fallbackCenter` (India centroid by default). Clicking
// anywhere on the map fires `onPick(lat, lng)`; dragging the marker fires
// the same callback on drag-end.
//
// 'use client' is required: react-leaflet touches `window` on import and
// will SSR-fail in the Next.js portal without this directive.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's broken default marker icon under bundlers (Vite / webpack).
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

interface Props {
  lat?: number;
  lng?: number;
  zoom?: number;
  height?: number | string;
  /** Fallback center used when lat/lng are undefined. Defaults to roughly
   *  the geographic centre of India so first-mount renders without coords
   *  still show a recognisable map. */
  fallbackCenter?: [number, number];
  /** Called when the user clicks the map or finishes dragging the marker. */
  onPick?: (lat: number, lng: number) => void;
}

const INDIA_CENTROID: [number, number] = [22.9734, 78.6569];

// Tiny helper that re-centres an already-mounted map when lat/lng change
// (Leaflet doesn't react to `center` prop changes after mount).
function ReCenter({ lat, lng, zoom }: { lat?: number; lng?: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], zoom ?? map.getZoom(), { animate: true });
    }
  }, [lat, lng, zoom, map]);
  return null;
}

// Internal click listener — has to live inside <MapContainer> to access
// the Leaflet context via `useMapEvents`.
function ClickHandler({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapPreview({
  lat,
  lng,
  zoom = 14,
  height = 260,
  fallbackCenter = INDIA_CENTROID,
  onPick,
}: Props) {
  const hasCoords = lat != null && lng != null;
  const center: [number, number] = hasCoords ? [lat!, lng!] : fallbackCenter;

  return (
    <div
      style={{ height, width: '100%', borderRadius: 12, overflow: 'hidden' }}
      className="border border-border/60"
    >
      <MapContainer
        center={center}
        zoom={hasCoords ? zoom : 5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ReCenter lat={lat} lng={lng} zoom={zoom} />
        <ClickHandler onPick={onPick} />
        {hasCoords && (
          <Marker
            position={[lat!, lng!]}
            draggable={!!onPick}
            eventHandlers={
              onPick
                ? {
                    dragend: (event) => {
                      const m = event.target as L.Marker;
                      const ll = m.getLatLng();
                      onPick(ll.lat, ll.lng);
                    },
                  }
                : undefined
            }
          />
        )}
      </MapContainer>
    </div>
  );
}
