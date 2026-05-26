/**
 * South Africa address search — multiple providers for towns, rural areas, and streets.
 * Best coverage: set VITE_GOOGLE_PLACES_API_KEY (Google Places Autocomplete).
 */

import type { AddressSuggestion } from "@/lib/location";

export type { AddressSuggestion };

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY as string | undefined;
const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY as string | undefined;

const DEFAULT_BIAS = { lat: -29.0, lon: 24.0 };
const SA_BBOX = "16.45,-34.84,32.89,-22.13";
const SA_LAT_MIN = -35;
const SA_LAT_MAX = -22;
const SA_LON_MIN = 16;
const SA_LON_MAX = 33;

interface PhotonFeature {
  properties: {
    osm_type?: string;
    osm_id?: number;
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    postcode?: string;
  };
  geometry: { coordinates: [number, number] };
}

function isInSouthAfrica(lat: number, lon: number, countrycode?: string): boolean {
  if (countrycode?.toUpperCase() === "ZA") return true;
  return lat >= SA_LAT_MIN && lat <= SA_LAT_MAX && lon >= SA_LON_MIN && lon <= SA_LON_MAX;
}

function formatPhotonAddress(props: PhotonFeature["properties"]): string {
  const street = props.housenumber
    ? `${props.housenumber} ${props.street || ""}`.trim()
    : props.street;
  const parts = [
    props.name,
    street,
    props.city || props.district,
    props.state,
    props.postcode,
    props.country,
  ].filter((p) => p && String(p).trim());
  return [...new Set(parts.map((p) => String(p).trim()))].join(", ") || props.name || "Unknown";
}

export function mergeSuggestions(
  batches: AddressSuggestion[][],
  max: number
): AddressSuggestion[] {
  const seen = new Set<string>();
  const merged: AddressSuggestion[] = [];
  for (const batch of batches) {
    for (const item of batch) {
      const key = `${item.latitude.toFixed(5)}_${item.longitude.toFixed(5)}_${item.displayName}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
      if (merged.length >= max) return merged;
    }
  }
  return merged;
}

/** Google needs a follow-up call for coordinates */
export function needsPlaceResolution(suggestion: AddressSuggestion): boolean {
  return (
    suggestion.placeId.startsWith("google_") &&
    suggestion.latitude === 0 &&
    suggestion.longitude === 0
  );
}

async function searchGooglePlaces(query: string): Promise<AddressSuggestion[]> {
  if (!GOOGLE_KEY?.trim()) return [];

  const params = new URLSearchParams({
    input: query,
    components: "country:za",
    language: "en",
    key: GOOGLE_KEY,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
  );
  const data = await response.json();

  if (data.status === "ZERO_RESULTS") return [];
  if (data.status !== "OK") {
    console.warn("Google Places:", data.status, data.error_message);
    return [];
  }

  return (data.predictions || []).map(
    (p: { place_id: string; description: string }) => ({
      placeId: `google_${p.place_id}`,
      displayName: p.description,
      address: p.description,
      latitude: 0,
      longitude: 0,
    })
  );
}

export async function resolveGooglePlace(
  googlePlaceId: string
): Promise<{ latitude: number; longitude: number; address: string } | null> {
  if (!GOOGLE_KEY?.trim()) return null;

  const params = new URLSearchParams({
    place_id: googlePlaceId,
    fields: "geometry,formatted_address",
    key: GOOGLE_KEY,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params}`
  );
  const data = await response.json();
  if (data.status !== "OK" || !data.result?.geometry?.location) return null;

  const { lat, lng } = data.result.geometry.location;
  if (!isInSouthAfrica(lat, lng, "ZA")) return null;

  return {
    latitude: lat,
    longitude: lng,
    address: data.result.formatted_address || "",
  };
}

async function searchGeoapify(query: string, limit: number): Promise<AddressSuggestion[]> {
  if (!GEOAPIFY_KEY?.trim()) return [];

  const params = new URLSearchParams({
    text: query,
    format: "json",
    limit: String(limit),
    filter: "countrycode:za",
    apiKey: GEOAPIFY_KEY,
  });

  const response = await fetch(
    `https://api.geoapify.com/v1/geocode/autocomplete?${params}`
  );
  if (!response.ok) return [];

  const data = await response.json();
  const features = data?.features;
  if (!Array.isArray(features)) return [];

  return features
    .map((f: { properties: Record<string, string>; geometry: { coordinates: [number, number] } }) => {
      const [lon, lat] = f.geometry.coordinates;
      if (!isInSouthAfrica(lat, lon, f.properties?.country_code)) return null;
      const displayName =
        f.properties?.formatted ||
        [f.properties?.address_line1, f.properties?.city, f.properties?.state]
          .filter(Boolean)
          .join(", ");
      return {
        placeId: `geoapify_${f.properties?.place_id || `${lat}_${lon}`}`,
        displayName,
        address: displayName,
        latitude: lat,
        longitude: lon,
      };
    })
    .filter((s): s is AddressSuggestion => s !== null);
}

async function searchPhoton(
  query: string,
  limit: number,
  bias: { lat: number; lon: number }
): Promise<AddressSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    lang: "en",
    countrycode: "za",
    bbox: SA_BBOX,
    lat: String(bias.lat),
    lon: String(bias.lon),
    location_bias_scale: "0.6",
  });

  const response = await fetch(`https://photon.komoot.io/api/?${params}`);
  if (!response.ok) return [];

  const data = await response.json();
  const features = data?.features as PhotonFeature[] | undefined;
  if (!Array.isArray(features)) return [];

  return features
    .map((f) => {
      const [lon, lat] = f.geometry.coordinates;
      if (!isInSouthAfrica(lat, lon, f.properties.countrycode)) return null;
      const displayName = formatPhotonAddress(f.properties);
      return {
        placeId: `photon_${f.properties.osm_type}_${f.properties.osm_id || `${lat}_${lon}`}`,
        displayName,
        address: displayName,
        latitude: lat,
        longitude: lon,
      };
    })
    .filter((s): s is AddressSuggestion => s !== null);
}

async function searchNominatim(query: string, limit: number): Promise<AddressSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: String(limit),
    countrycodes: "za",
  });

  const response = await fetch(`/api/nominatim/search?${params}`, {
    headers: { "Accept-Language": "en" },
  });
  if (!response.ok) return [];

  const data = await response.json();
  if (!Array.isArray(data)) return [];

  return data
    .map(
      (item: { place_id: number; display_name: string; lat: string; lon: string }) => {
        const latitude = parseFloat(item.lat);
        const longitude = parseFloat(item.lon);
        if (!isInSouthAfrica(latitude, longitude, "ZA")) return null;
        return {
          placeId: `nominatim_${item.place_id}`,
          displayName: item.display_name,
          address: item.display_name,
          latitude,
          longitude,
        };
      }
    )
    .filter((s): s is AddressSuggestion => s !== null);
}

async function geocodeWithGoogle(text: string): Promise<AddressSuggestion | null> {
  if (!GOOGLE_KEY?.trim()) return null;

  const params = new URLSearchParams({
    address: text.includes("South Africa") ? text : `${text}, South Africa`,
    components: "country:ZA",
    key: GOOGLE_KEY,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params}`
  );
  const data = await response.json();
  if (data.status !== "OK" || !data.results?.[0]) return null;

  const r = data.results[0];
  const lat = r.geometry.location.lat;
  const lon = r.geometry.location.lng;
  if (!isInSouthAfrica(lat, lon, "ZA")) return null;

  return {
    placeId: `google_geo_${r.place_id}`,
    displayName: r.formatted_address,
    address: r.formatted_address,
    latitude: lat,
    longitude: lon,
  };
}

/**
 * Autocomplete — merges Google, Geoapify, Photon, and Nominatim (ZA only).
 */
export async function searchAddressSuggestions(
  query: string,
  limit = 20,
  bias?: { lat: number; lon: number }
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const searchBias = bias ?? DEFAULT_BIAS;
  const perSource = Math.max(limit, 15);
  const withSa = /south\s*africa|\bza\b/i.test(trimmed)
    ? null
    : `${trimmed}, South Africa`;

  const queries = [trimmed, withSa].filter(Boolean) as string[];

  const batches = await Promise.all(
    queries.flatMap((q) => [
      searchGooglePlaces(q).catch(() => [] as AddressSuggestion[]),
      searchGeoapify(q, perSource).catch(() => [] as AddressSuggestion[]),
      searchPhoton(q, perSource, searchBias).catch(() => [] as AddressSuggestion[]),
      searchNominatim(q, perSource).catch(() => [] as AddressSuggestion[]),
    ])
  );

  return mergeSuggestions(batches, limit);
}

/**
 * Forward-geocode typed text (rural farm, village, plot, etc.) when not in autocomplete list.
 */
export async function geocodeTypedAddress(
  text: string,
  bias?: { lat: number; lon: number }
): Promise<AddressSuggestion> {
  const trimmed = text.trim();
  if (trimmed.length < 4) {
    throw new Error("Enter at least 4 characters for your destination.");
  }

  const variants = [
    trimmed,
    trimmed.includes("South Africa") ? null : `${trimmed}, South Africa`,
  ].filter(Boolean) as string[];

  for (const q of variants) {
    const google = await geocodeWithGoogle(q).catch(() => null);
    if (google) return google;

    if (GEOAPIFY_KEY) {
      const geo = await searchGeoapify(q, 1).catch(() => []);
      if (geo[0]) return geo[0];
    }

    const photon = await searchPhoton(q, 3, bias ?? DEFAULT_BIAS).catch(() => []);
    if (photon[0]) return photon[0];

    const nominatim = await searchNominatim(q, 3).catch(() => []);
    if (nominatim[0]) return nominatim[0];
  }

  throw new Error(
    "Could not find that address in South Africa. Try adding province or nearest town, or enable Google Places in settings."
  );
}

export function isGooglePlacesConfigured(): boolean {
  return Boolean(GOOGLE_KEY?.trim());
}
