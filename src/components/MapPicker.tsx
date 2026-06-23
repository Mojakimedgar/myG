import React from "react";
import { MapContainer, TileLayer, Circle, CircleMarker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const AnyMapContainer: any = MapContainer as any;
const AnyTileLayer: any = TileLayer as any;
const AnyCircle: any = Circle as any;
const AnyCircleMarker: any = CircleMarker as any;

interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  radius?: number; // meters
  onChange: (lat?: number, lng?: number) => void;
  height?: string;
}

function LocationEvents({ onChange }: { onChange: (lat?: number, lng?: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToCenter({ center }: { center: [number, number] | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function MapPicker({ latitude, longitude, address, radius, onChange, height = "220px" }: MapPickerProps) {
  const [geocodedCenter, setGeocodedCenter] = React.useState<[number, number] | null>(
    latitude !== undefined && longitude !== undefined ? [latitude, longitude] : null
  );
  const [isGeocoding, setIsGeocoding] = React.useState(false);

  // When external lat/lng change (e.g., user clicked map or form updated), keep internal center in sync
  React.useEffect(() => {
    if (typeof latitude === "number" && typeof longitude === "number") {
      setGeocodedCenter([latitude, longitude]);
    } else if (latitude === undefined && longitude === undefined) {
      // Clear the map when coordinates are cleared
      setGeocodedCenter(null);
    }
  }, [latitude, longitude]);

  // Debounced geocode when address changes
  React.useEffect(() => {
    if (!address || address.trim() === "") return;
    let cancelled = false;
    const handler = setTimeout(async () => {
      setIsGeocoding(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
        const res = await fetch(url, {
          headers: {
            // nice-to-have; some servers prefer a user-agent but browsers may ignore
            "Accept-Language": "en",
          },
        });
        const data = await res.json();
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setGeocodedCenter([lat, lon]);
          onChange(lat, lon);
        }
      } catch (e) {
        // swallow errors — geocoding is best-effort
        console.warn("Geocode failed", e);
      } finally {
        if (!cancelled) setIsGeocoding(false);
      }
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(handler);
    };
  }, [address, onChange]);

  const center: [number, number] = geocodedCenter ?? [37.4219983, -122.084];

  return (
    <div style={{ height }} className="rounded-md overflow-hidden">
      {/* @ts-ignore - react-leaflet prop types can be finicky between versions */}
      <AnyMapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        {/* @ts-ignore - tile layer prop typing */}
        <AnyTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToCenter center={geocodedCenter} />
        <LocationEvents onChange={onChange} />
        {typeof geocodedCenter?.[0] === "number" && typeof geocodedCenter?.[1] === "number" && (
          <>
            {/* @ts-ignore - circle prop typing */}
            <AnyCircle center={geocodedCenter} radius={radius ?? 100} pathOptions={{ color: "#2563eb", fillOpacity: 0.08 }} />
            {/* @ts-ignore - circle marker prop typing */}
            <AnyCircleMarker center={geocodedCenter} radius={6} pathOptions={{ color: "#2563eb", fillOpacity: 1 }} />
          </>
        )}
      </AnyMapContainer>
    </div>
  );
}
