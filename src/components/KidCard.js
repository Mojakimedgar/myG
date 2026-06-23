import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { MapPin, Shield, Clock, Phone, Navigation, MessageCircle } from "lucide-react";
import { EditKidModal } from "./EditKidModal";
import { DeleteKidDialog } from "./DeleteKidDialog";
import { useToast } from "@/hooks/use-toast";
import { EMERGENCY_PHONE_NUMBER } from "@/lib/constants";
import { openCall, openMessage } from "@/lib/contact";
const statusConfig = {
    safe: {
        color: "bg-safe-zone",
        text: "Safe in Zone",
        icon: Shield,
    },
    warning: {
        color: "bg-warning-zone",
        text: "Near Boundary",
        icon: MapPin,
    },
    alert: {
        color: "bg-danger-zone",
        text: "Outside Zone",
        icon: MapPin,
    },
};
export function KidCard({ kid, onKidUpdated, onViewLiveMap }) {
    const { name, age, status, location, lastSeen, avatar, zonesCount, latitude, longitude, phoneNumber } = kid;
    const config = statusConfig[status];
    const StatusIcon = config.icon;
    const { toast } = useToast();
    const handleViewMap = () => {
        if (onViewLiveMap) {
            onViewLiveMap(kid.id);
            return;
        }
        let mapsUrl;
        if (typeof latitude === 'number' && typeof longitude === 'number') {
            mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        }
        else {
            const encodedLocation = encodeURIComponent(location);
            mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
        }
        window.open(mapsUrl, '_blank');
        toast({
            title: "Opening Map",
            description: typeof latitude === 'number' && typeof longitude === 'number'
                ? `Viewing ${name}'s coordinates: ${latitude}, ${longitude}`
                : `Viewing ${name}'s location: ${location}`,
        });
    };
    const handleCall = () => {
        const number = (phoneNumber || "").trim();
        if (!number) {
            toast({
                title: "No phone number",
                description: `Add ${name}'s phone number in Edit profile to call them.`,
                variant: "destructive",
            });
            return;
        }
        const ok = openCall(number);
        if (ok) {
            toast({ title: "Calling…", description: `Opening dialer for ${name}` });
        }
    };
    const handleMessage = () => {
        const number = (phoneNumber || "").trim();
        if (!number) {
            toast({
                title: "No phone number",
                description: `Add ${name}'s phone number in Edit profile to message them.`,
                variant: "destructive",
            });
            return;
        }
        const ok = openMessage(number);
        if (ok) {
            toast({ title: "Messaging…", description: `Opening messages for ${name}` });
        }
    };
    const handleEmergency = () => {
        const ok = openCall(EMERGENCY_PHONE_NUMBER);
        if (ok) {
            toast({ title: "Emergency call", description: "Opening dialer for emergency number." });
        }
    };
    return (_jsxs(Card, { className: "group hover:shadow-lg transition-all duration-300 border-0 shadow-soft", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs(Avatar, { className: "h-12 w-12 ring-2 ring-primary/20", children: [_jsx(AvatarImage, { src: avatar, alt: name }), _jsx(AvatarFallback, { className: "bg-gradient-to-br from-primary to-primary-glow text-white font-semibold", children: name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("") })] }), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-lg", children: name }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Age ", age] })] })] }), _jsxs(Badge, { className: `${config.color} text-white border-0 shadow-sm`, variant: "secondary", children: [_jsx(StatusIcon, { className: "h-3 w-3 mr-1" }), config.text] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(MapPin, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-foreground", children: location })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(Clock, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("span", { className: "text-muted-foreground", children: ["Last seen ", lastSeen] })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(Shield, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("span", { className: "text-muted-foreground", children: [zonesCount, " active zones"] })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "zone", size: "sm", className: "flex-1", onClick: handleViewMap, children: [_jsx(MapPin, { className: "h-4 w-4" }), "View Map"] }), _jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { variant: "outline", size: "sm", children: _jsx(Phone, { className: "h-4 w-4" }) }) }), _jsxs(DialogContent, { className: "sm:max-w-[425px]", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Phone, { className: "h-5 w-5" }), "Contact ", name] }), _jsxs(DialogDescription, { children: ["Choose how you'd like to contact ", name, " or access emergency features."] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs(Button, { variant: "outline", className: "h-20 flex flex-col gap-2", onClick: handleEmergency, children: [_jsx(Phone, { className: "h-6 w-6 text-red-500" }), _jsx("span", { className: "text-sm", children: "Emergency" })] }), _jsxs(Button, { variant: "outline", className: "h-20 flex flex-col gap-2", onClick: handleCall, children: [_jsx(Phone, { className: "h-6 w-6 text-green-500" }), _jsx("span", { className: "text-sm", children: "Call" })] }), _jsxs(Button, { variant: "outline", className: "h-20 flex flex-col gap-2", onClick: handleMessage, children: [_jsx(MessageCircle, { className: "h-6 w-6 text-blue-500" }), _jsx("span", { className: "text-sm", children: "Message" })] }), _jsxs(Button, { variant: "outline", className: "h-20 flex flex-col gap-2", onClick: handleViewMap, children: [_jsx(Navigation, { className: "h-6 w-6 text-purple-500" }), _jsx("span", { className: "text-sm", children: "Navigate" })] })] }), _jsxs("div", { className: "pt-4 border-t", children: [_jsxs("p", { className: "text-sm text-muted-foreground mb-3", children: ["Current Status: ", _jsx(Badge, { className: config.color, children: config.text })] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Last seen: ", lastSeen, " at ", location] })] })] })] })] })] }), _jsxs("div", { className: "flex gap-2 pt-2", children: [_jsx(EditKidModal, { kid: kid, onKidUpdated: onKidUpdated }), _jsx(DeleteKidDialog, { kid: kid, onKidDeleted: onKidUpdated })] })] })] }));
}
