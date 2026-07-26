'use client';
// ─────────────────────────────────────────────────────────────────────────────
// AddressPicker — controlled address input with geocoding search and geolocation.
// Uses useForwardGeocode / useReverseGeocode from @kshuri/api-client (hooks pull
// the Axios client from ApiClientProvider context — no prop needed).
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Search, Navigation, Loader2 } from 'lucide-react';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { MapPreview } from './MapPreview';
import {
  useForwardGeocode,
  useReverseGeocode,
} from '@kshuri/api-client';
import type { GeocodeResultDto } from '@kshuri/api-client';

export interface AddressPickerValue {
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
}

interface Props {
  value?: AddressPickerValue;
  onChange: (v: AddressPickerValue) => void;
  /** Country hint for forward geocoding (ISO-2). Defaults to 'in'. */
  countryHint?: string;
  /** If true and no lat/lng is already set, the component will request
   *  the browser's current location on mount and use it as the initial
   *  pin (plus reverse-geocode to pre-fill the address fields). Set to
   *  `false` if the parent doesn't want the geolocation prompt to fire
   *  automatically. Defaults to `true`. */
  autoDetectOnMount?: boolean;
}

export function AddressPicker({
  value = {},
  onChange,
  countryHint = 'in',
  autoDetectOnMount = true,
}: Props) {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<GeocodeResultDto[]>([]);
  // Tracks the last query string we actually fired off — used so the
  // "No matches found" copy only appears after a real search attempt,
  // not on the initial empty render.
  const [lastQuery, setLastQuery] = useState<string>('');
  const [geoError, setGeoError] = useState<string | null>(null);

  const forwardGeocode = useForwardGeocode();
  const reverseGeocode = useReverseGeocode();

  function handleSearch() {
    const q = searchText.trim();
    if (!q) return;
    setResults([]);
    setLastQuery(q);
    forwardGeocode.mutate(
      { text: q, country_hint: countryHint },
      {
        onSuccess: (data) => setResults(data),
      },
    );
  }

  function applyResult(r: GeocodeResultDto) {
    setResults([]);
    setLastQuery('');
    setSearchText('');
    onChange({
      ...value,
      address_line1: r.components.address_line1 ?? value.address_line1,
      city: r.components.city ?? value.city,
      state: r.components.state ?? value.state,
      postal_code: r.components.postal_code ?? value.postal_code,
      country_code: r.components.country_code ?? value.country_code ?? countryHint,
      latitude: r.lat,
      longitude: r.lng,
    });
  }

  // Shared "set lat/lng + reverse-geocode to fill address fields" handler.
  // Used by:
  //   • the "Use my location" button
  //   • clicking on the map
  //   • dragging the marker
  //   • the auto-detect-on-mount effect
  // We read the latest `value` via a ref so this callback is stable and
  // doesn't capture a stale closure — important because the map's
  // `onPick` is wired up on the first render of the Leaflet container.
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  const pickCoords = useCallback(
    (latitude: number, longitude: number) => {
      const current = valueRef.current;
      onChange({ ...current, latitude, longitude });
      reverseGeocode.mutate(
        { lat: latitude, lng: longitude },
        {
          onSuccess: (components) => {
            if (!components) return;
            const latest = valueRef.current;
            onChange({
              ...latest,
              latitude,
              longitude,
              address_line1: components.address_line1 ?? latest.address_line1,
              city: components.city ?? latest.city,
              state: components.state ?? latest.state,
              postal_code: components.postal_code ?? latest.postal_code,
              country_code: components.country_code ?? latest.country_code,
            });
          },
        },
      );
    },
    [onChange, reverseGeocode],
  );

  function handleUseMyLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => pickCoords(pos.coords.latitude, pos.coords.longitude),
      (err) => setGeoError(err.message),
    );
  }

  // Auto-detect on first mount when the vendor hasn't saved a pin yet.
  // We only ever fire this once per mount (guard ref) so re-renders from
  // parent state don't re-prompt the user.
  const autoDetectFired = useRef(false);
  useEffect(() => {
    if (!autoDetectOnMount) return;
    if (autoDetectFired.current) return;
    if (value.latitude != null && value.longitude != null) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    autoDetectFired.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => pickCoords(pos.coords.latitude, pos.coords.longitude),
      // Silent on denied/timeout — geolocation is a convenience, not a
      // requirement; the vendor can still search or type manually.
      () => { /* noop */ },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }, [autoDetectOnMount, value.latitude, value.longitude, pickCoords]);

  const hasCoords =
    value.latitude != null && value.longitude != null;

  return (
    <div className="space-y-4">
      {/* Search row */}
      <div className="flex gap-2">
        <Input
          placeholder="Search address…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleSearch}
          disabled={forwardGeocode.isPending || !searchText.trim()}
          aria-label={forwardGeocode.isPending ? 'Searching' : 'Search'}
        >
          {forwardGeocode.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleUseMyLocation}
          disabled={reverseGeocode.isPending}
          aria-label="Use my location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Searching… status row */}
      {forwardGeocode.isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Searching for "{searchText.trim() || lastQuery}"…
        </div>
      )}

      {/* Geocode results dropdown */}
      {!forwardGeocode.isPending && results.length > 0 && (
        <ul className="border border-border rounded-md bg-background shadow-md divide-y divide-border max-h-48 overflow-y-auto text-sm">
          {results.map((r, i) => (
            <li key={i}>
              <button
                className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                onClick={() => applyResult(r)}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* No-matches empty state — only shown after a search actually
          completed (`forwardGeocode.isSuccess`) and produced zero rows. */}
      {!forwardGeocode.isPending &&
        forwardGeocode.isSuccess &&
        results.length === 0 &&
        lastQuery && (
          <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p>
                No matches for <span className="font-medium">"{lastQuery}"</span>.
              </p>
              <p className="text-xs mt-0.5">
                Try a more specific address, a nearby landmark, or use the
                location button to drop a pin where you are.
              </p>
            </div>
          </div>
        )}

      {/* Error state */}
      {(geoError || forwardGeocode.isError) && (
        <p className="text-sm text-destructive">
          {geoError ?? 'Geocoding failed. Please try again.'}
        </p>
      )}

      {/* Manual fields */}
      <div className="grid gap-3">
        <Input
          placeholder="Address line 1"
          value={value.address_line1 ?? ''}
          onChange={(e) => onChange({ ...value, address_line1: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="City"
            value={value.city ?? ''}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
          />
          <Input
            placeholder="State"
            value={value.state ?? ''}
            onChange={(e) => onChange({ ...value, state: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Postal code"
            value={value.postal_code ?? ''}
            onChange={(e) => onChange({ ...value, postal_code: e.target.value })}
          />
          <Input
            placeholder="Country code"
            value={value.country_code ?? ''}
            onChange={(e) => onChange({ ...value, country_code: e.target.value })}
          />
        </div>
      </div>

      {/* Interactive map — always rendered. Click the map or drag the
          marker to set the pin; we then reverse-geocode to back-fill
          the manual fields. */}
      <div className="space-y-1.5">
        <MapPreview
          lat={value.latitude}
          lng={value.longitude}
          onPick={pickCoords}
        />
        <p className="text-[11px] text-muted-foreground">
          {hasCoords
            ? 'Drag the marker or tap the map to fine-tune your location.'
            : 'Tap anywhere on the map to drop a pin, or use the Locate button above.'}
        </p>
      </div>
    </div>
  );
}
