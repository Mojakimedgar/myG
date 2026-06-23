import React, { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const AnyMapContainer: any = MapContainer as any;
const AnyTileLayer: any = TileLayer as any;
const AnyCircle: any = Circle as any;
const AnyCircleMarker: any = CircleMarker as any;
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kid } from "@/types/kids";
import { Zone } from "@/types/zone";

interface LiveMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kids: Kid[];
  zones?: Zone[];
  /** Optional: center map on this kid when opening */
  focusKidId?: string | null;
}

function FitBounds({ kids }: { kids: Kid[] }) {
  const map = useMap();
  const points = useMemo(() => {
    return kids
      .filter((k) => typeof k.latitude === "number" && typeof k.longitude === "number")
      .map((k) => [k.latitude!, k.longitude!] as [number, number]);
  }, [kids]);

  React.useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    const bounds = points.map((p) => p as [number, number]);
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
  }, [map, points]);

  return null;
}

function FlyToKid({ kidId, kids }: { kidId: string | null; kids: Kid[] }) {
  const map = useMap();
  const kid = kidId ? kids.find((k) => k.id === kidId) : null;
  React.useEffect(() => {
    if (kid && typeof kid.latitude === "number" && typeof kid.longitude === "number") {
      map.setView([kid.latitude, kid.longitude], 15);
    }
  }, [map, kid, kidId]);
  return null;
}

const statusColors: Record<"safe" | "warning" | "alert", string> = {
  safe: "#22c55e",
  warning: "#eab308",
  alert: "#ef4444",
};

export function LiveMapModal({
  open,
  onOpenChange,
  kids,
  zones = [],
  focusKidId = null,
}: LiveMapModalProps) {
  const kidsWithCoords = useMemo(
    () =>
      kids.filter(
        (k) => typeof k.latitude === "number" && typeof k.longitude === "number"
      ),
    [kids]
  );

  const defaultCenter: [number, number] = useMemo(() => {
    if (focusKidId) {
      const k = kids.find((x) => x.id === focusKidId);
      if (k && typeof k.latitude === "number" && typeof k.longitude === "number")
        return [k.latitude, k.longitude];
    }
    if (kidsWithCoords.length > 0)
      return [kidsWithCoords[0].latitude!, kidsWithCoords[0].longitude!];
    return [-26.2041, 28.0473]; // Johannesburg fallback
  }, [kids, kidsWithCoords, focusKidId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] sm:max-h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle>G&apos;s live location</DialogTitle>
        </DialogHeader>
        <div className="h-[60vh] min-h-[300px] w-full px-4 pb-4 pt-2">
          {/* @ts-ignore - react-leaflet prop typing differences across versions */}
          <AnyMapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: "100%", width: "100%", borderRadius: 8 }}
            scrollWheelZoom
          >
            {/* @ts-ignore - tile layer prop typing */}
            <AnyTileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {kidsWithCoords.length > 0 && <FitBounds kids={kidsWithCoords} />}
            {focusKidId && <FlyToKid kidId={focusKidId} kids={kids} />}
            {kidsWithCoords.map((kid) => (
              // @ts-ignore - circle marker typing
              <AnyCircleMarker
                key={kid.id}
                center={[kid.latitude!, kid.longitude!]}
                radius={10}
                pathOptions={{
                  color: statusColors[kid.status] ?? "#2563eb",
                  fillColor: statusColors[kid.status] ?? "#2563eb",
                  fillOpacity: 1,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{kid.name}</p>
                    <p className="text-muted-foreground">{kid.location}</p>
                    <p className="text-muted-foreground">Status: {kid.status}</p>
                    <p className="text-muted-foreground">Last seen: {kid.lastSeen}</p>
                  </div>
                </Popup>
              </AnyCircleMarker>
            ))}
            {zones
              .filter(
                (z) =>
                  typeof z.latitude === "number" &&
                  typeof z.longitude === "number" &&
                  z.isActive
              )
              .map((zone) => (
                <React.Fragment key={zone.id}>
                      {/* @ts-ignore - circle prop typing */}
                      <AnyCircle
                    center={[zone.latitude!, zone.longitude!]}
                    radius={zone.radius}
                    pathOptions={{
                      color: "#6366f1",
                      fillColor: "#6366f1",
                      fillOpacity: 0.1,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{zone.name}</p>
                        <p className="text-muted-foreground">Type: {zone.type}</p>
                        <p className="text-muted-foreground">Radius: {zone.radius}m</p>
                        <p className="text-muted-foreground">Active kids: {zone.activeKids}</p>
                      </div>
                    </Popup>
                  </AnyCircle>
                  {/* @ts-ignore - circle marker prop typing */}
                  <AnyCircleMarker
                    center={[zone.latitude!, zone.longitude!]}
                    radius={8}
                    pathOptions={{
                      color: "#4f46e5",
                      fillColor: "#4f46e5",
                      fillOpacity: 1,
                      weight: 2,
                    }}
                  />
                </React.Fragment>
              ))}
          </AnyMapContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
