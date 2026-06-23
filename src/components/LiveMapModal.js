import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
const AnyMapContainer = MapContainer;
const AnyTileLayer = TileLayer;
const AnyCircle = Circle;
const AnyCircleMarker = CircleMarker;
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
function FitBounds({ kids }) {
    const map = useMap();
    const points = useMemo(() => {
        return kids
            .filter((k) => typeof k.latitude === "number" && typeof k.longitude === "number")
            .map((k) => [k.latitude, k.longitude]);
    }, [kids]);
    React.useEffect(() => {
        if (points.length === 0)
            return;
        if (points.length === 1) {
            map.setView(points[0], 14);
            return;
        }
        const bounds = points.map((p) => p);
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
    }, [map, points]);
    return null;
}
function FlyToKid({ kidId, kids }) {
    const map = useMap();
    const kid = kidId ? kids.find((k) => k.id === kidId) : null;
    React.useEffect(() => {
        if (kid && typeof kid.latitude === "number" && typeof kid.longitude === "number") {
            map.setView([kid.latitude, kid.longitude], 15);
        }
    }, [map, kid, kidId]);
    return null;
}
const statusColors = {
    safe: "#22c55e",
    warning: "#eab308",
    alert: "#ef4444",
};
export function LiveMapModal({ open, onOpenChange, kids, zones = [], focusKidId = null, }) {
    const kidsWithCoords = useMemo(() => kids.filter((k) => typeof k.latitude === "number" && typeof k.longitude === "number"), [kids]);
    const defaultCenter = useMemo(() => {
        if (focusKidId) {
            const k = kids.find((x) => x.id === focusKidId);
            if (k && typeof k.latitude === "number" && typeof k.longitude === "number")
                return [k.latitude, k.longitude];
        }
        if (kidsWithCoords.length > 0)
            return [kidsWithCoords[0].latitude, kidsWithCoords[0].longitude];
        return [-26.2041, 28.0473]; // Johannesburg fallback
    }, [kids, kidsWithCoords, focusKidId]);
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-[90vw] sm:max-h-[85vh] p-0 gap-0 overflow-hidden", children: [_jsx(DialogHeader, { className: "px-4 pt-4 pb-0", children: _jsx(DialogTitle, { children: "G's live location" }) }), _jsx("div", { className: "h-[60vh] min-h-[300px] w-full px-4 pb-4 pt-2", children: _jsxs(AnyMapContainer, { center: defaultCenter, zoom: 13, style: { height: "100%", width: "100%", borderRadius: 8 }, scrollWheelZoom: true, children: [_jsx(AnyTileLayer, { attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), kidsWithCoords.length > 0 && _jsx(FitBounds, { kids: kidsWithCoords }), focusKidId && _jsx(FlyToKid, { kidId: focusKidId, kids: kids }), kidsWithCoords.map((kid) => (
                            // @ts-ignore - circle marker typing
                            _jsx(AnyCircleMarker, { center: [kid.latitude, kid.longitude], radius: 10, pathOptions: {
                                    color: statusColors[kid.status] ?? "#2563eb",
                                    fillColor: statusColors[kid.status] ?? "#2563eb",
                                    fillOpacity: 1,
                                    weight: 2,
                                }, children: _jsx(Popup, { children: _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-semibold", children: kid.name }), _jsx("p", { className: "text-muted-foreground", children: kid.location }), _jsxs("p", { className: "text-muted-foreground", children: ["Status: ", kid.status] }), _jsxs("p", { className: "text-muted-foreground", children: ["Last seen: ", kid.lastSeen] })] }) }) }, kid.id))), zones
                                .filter((z) => typeof z.latitude === "number" &&
                                typeof z.longitude === "number" &&
                                z.isActive)
                                .map((zone) => (_jsxs(React.Fragment, { children: [_jsx(AnyCircle, { center: [zone.latitude, zone.longitude], radius: zone.radius, pathOptions: {
                                            color: "#6366f1",
                                            fillColor: "#6366f1",
                                            fillOpacity: 0.1,
                                            weight: 2,
                                        }, children: _jsx(Popup, { children: _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-semibold", children: zone.name }), _jsxs("p", { className: "text-muted-foreground", children: ["Type: ", zone.type] }), _jsxs("p", { className: "text-muted-foreground", children: ["Radius: ", zone.radius, "m"] }), _jsxs("p", { className: "text-muted-foreground", children: ["Active kids: ", zone.activeKids] })] }) }) }), _jsx(AnyCircleMarker, { center: [zone.latitude, zone.longitude], radius: 8, pathOptions: {
                                            color: "#4f46e5",
                                            fillColor: "#4f46e5",
                                            fillOpacity: 1,
                                            weight: 2,
                                        } })] }, zone.id)))] }) })] }) }));
}
