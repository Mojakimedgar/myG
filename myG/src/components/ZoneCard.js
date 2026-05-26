import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Clock } from "lucide-react";
import { EditZoneModal } from "./EditZoneModal";
import { DeleteZoneDialog } from "./DeleteZoneDialog";
const zoneTypeConfig = {
    home: {
        color: "bg-safe-zone",
        label: "Home Zone",
    },
    school: {
        color: "bg-primary",
        label: "School Zone",
    },
    custom: {
        color: "bg-accent",
        label: "Custom Zone",
    },
};
export function ZoneCard(props) {
    const { id, name, address, latitude, longitude, radius, type, activeKids, totalKids, createdAt, isActive, customLabel, onZoneUpdated } = props;
    const config = zoneTypeConfig[type];
    const createdLabel = createdAt instanceof Date ? createdAt.toLocaleString() : "";
    return (_jsxs(Card, { className: "group hover:shadow-lg transition-all duration-300 border-0 shadow-soft", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(CardTitle, { className: "text-lg", children: name }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { className: `${config.color} text-white border-0 shadow-sm`, variant: "secondary", children: config.label }), !isActive && (_jsx(Badge, { variant: "outline", className: "text-muted-foreground", children: "Inactive" }))] }), customLabel && (_jsx("p", { className: "text-sm text-muted-foreground mt-2 italic", children: customLabel }))] }), _jsx("div", { className: "flex gap-1", children: _jsx(DeleteZoneDialog, { zone: { id, name, address, latitude, longitude, radius, type, activeKids, totalKids, createdAt, isActive, createdBy: "" }, onZoneDeleted: onZoneUpdated || (() => { }) }) })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(MapPin, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-foreground", children: address })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("div", { className: "h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center", children: _jsx("div", { className: "h-2 w-2 rounded-full bg-primary" }) }), _jsxs("span", { className: "text-muted-foreground", children: [radius, "m radius"] })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(Users, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("span", { className: "text-foreground", children: [activeKids, " of ", totalKids, " G's currently in zone"] })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(Clock, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("span", { className: "text-muted-foreground", children: ["Created ", createdLabel] })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "zone", size: "sm", className: "flex-1", onClick: () => {
                                    let url;
                                    if (typeof latitude === 'number' && typeof longitude === 'number') {
                                        url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
                                    }
                                    else {
                                        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
                                    }
                                    window.open(url, '_blank');
                                }, children: [_jsx(MapPin, { className: "h-4 w-4" }), "View on Map"] }), _jsx(EditZoneModal, { zone: { id, name, address, latitude, longitude, radius, type, activeKids, totalKids, createdAt, isActive, createdBy: "" }, onZoneUpdated: onZoneUpdated || (() => { }) })] })] })] }));
}
