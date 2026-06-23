import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, Clock } from "lucide-react";
import MapPicker from "@/components/MapPicker";
import { addZone } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";
import { Checkbox } from "@/components/ui/checkbox";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
export function AddZoneModal({ onZoneAdded, buttonLabel = "New Zone" }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [zoneGroups, setZoneGroups] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        latitude: undefined,
        longitude: undefined,
        radius: 100,
        type: "home",
        customLabel: "",
        totalKids: 0,
        isActive: true,
        activeHours: {
            enabled: false,
            startHour: 8,
            endHour: 18,
            daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
        },
        createdBy: "",
        status: "safe",
    });
    const { toast } = useToast();
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };
    useEffect(() => {
        const loadGroups = async () => {
            const snapshot = await getDocs(collection(db, "zoneGroups"));
            const groups = snapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name || "",
            }));
            setZoneGroups(groups);
        };
        if (open) {
            loadGroups();
        }
    }, [open]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.address || !formData.radius) {
            toast({ title: "Validation error", description: "Please fill all required fields", variant: "destructive" });
            return;
        }
        const currentUser = getCurrentUser();
        if (!currentUser) {
            toast({ title: "Error", description: "You must be logged in to create zones", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            await addZone({
                ...formData,
                createdBy: currentUser.uid,
            });
            toast({ title: "Zone created", description: `${formData.name} has been added.` });
            setOpen(false);
            onZoneAdded();
        }
        catch (err) {
            console.error(err);
            toast({ title: "Failed to create zone", description: "Please try again.", variant: "destructive" });
        }
        finally {
            setLoading(false);
        }
    };
    // Allow opening the modal programmatically (optional)
    // e.g., window.dispatchEvent(new Event("zone:add"))
    // This helps if any parent wants to trigger it imperatively.
    if (typeof window !== "undefined") {
        window.addEventListener("zone:add", () => setOpen(true), { once: true });
    }
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { type: "button", variant: "safety", className: "text-base px-4 relative z-10", onClick: () => setOpen(true), children: [_jsx(Plus, { className: "h-4 w-4" }), buttonLabel] }) }), _jsxs(DialogContent, { className: "sm:max-w-[480px] max-h-[95vh] flex flex-col overflow-hidden p-0 gap-0", children: [_jsxs(DialogHeader, { className: "shrink-0 px-6 pt-6 pb-2 pr-12", children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(MapPin, { className: "h-5 w-5" }), "Create Safety Zone"] }), _jsx(DialogDescription, { children: "Define a boundary and its type." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col flex-1 overflow-hidden", children: [_jsxs("div", { className: "overflow-y-auto flex-1 px-6 py-4 space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "name", children: "Name *" }), _jsx(Input, { id: "name", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "address", children: "Address/Description *" }), _jsx(Input, { id: "address", value: formData.address, onChange: (e) => setFormData({ ...formData, address: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Location" }), _jsx(MapPicker, { latitude: formData.latitude, longitude: formData.longitude, address: formData.address, radius: formData.radius, onChange: (lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng }), height: "220px" }), _jsxs("div", { className: "flex items-center gap-4 text-sm mt-2", children: [_jsxs("div", { children: ["Lat: ", formData.latitude ?? "—"] }), _jsxs("div", { children: ["Lng: ", formData.longitude ?? "—"] }), _jsx(Button, { type: "button", variant: "outline", onClick: () => setFormData({ ...formData, latitude: undefined, longitude: undefined }), children: "Clear" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "radius", children: "Radius (meters) *" }), _jsx(Input, { id: "radius", type: "number", min: 10, value: formData.radius, onChange: (e) => setFormData({ ...formData, radius: Number(e.target.value) || 0 }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Type *" }), _jsxs(Select, { value: formData.type, onValueChange: (v) => setFormData({ ...formData, type: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "home", children: "Home" }), _jsx(SelectItem, { value: "school", children: "School" }), _jsx(SelectItem, { value: "work", children: "Work" }), _jsx(SelectItem, { value: "custom", children: "Custom" })] })] })] }), formData.type === "custom" && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "customLabel", children: "Custom Label (optional)" }), _jsx(Textarea, { id: "customLabel", placeholder: "Describe this custom zone (e.g. 'Park where kids meet')", value: formData.customLabel || "", onChange: (e) => setFormData({ ...formData, customLabel: e.target.value }), rows: 3 })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "status", children: "Status *" }), _jsxs(Select, { value: formData.status || "safe", onValueChange: (value) => handleInputChange("status", value), children: [_jsx(SelectTrigger, { id: "status", children: _jsx(SelectValue, { placeholder: "Select status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "safe", children: "Safe Zone" }), _jsx(SelectItem, { value: "warning", children: "Warning Zone" }), _jsx(SelectItem, { value: "alert", children: "Alert Zone" })] })] })] }), zoneGroups.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Zone Group (Optional)" }), _jsxs(Select, { value: formData.groupId || "", onValueChange: (groupId) => setFormData({ ...formData, groupId: groupId || undefined }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a group (optional)" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "", children: "None" }), zoneGroups.map((group) => (_jsx(SelectItem, { value: group.id, children: group.name }, group.id)))] })] })] })), _jsxs("div", { className: "space-y-4 border-t pt-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "active-hours-enabled", checked: formData.activeHours?.enabled || false, onCheckedChange: (checked) => setFormData({
                                                            ...formData,
                                                            activeHours: {
                                                                ...formData.activeHours,
                                                                enabled: checked,
                                                            },
                                                        }) }), _jsxs(Label, { htmlFor: "active-hours-enabled", className: "flex items-center gap-2 cursor-pointer", children: [_jsx(Clock, { className: "h-4 w-4" }), "Enable Active Hours"] })] }), formData.activeHours?.enabled && (_jsxs("div", { className: "space-y-4 pl-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "start-hour", children: "Start Hour" }), _jsx(Input, { id: "start-hour", type: "number", min: "0", max: "23", value: formData.activeHours?.startHour || 8, onChange: (e) => setFormData({
                                                                            ...formData,
                                                                            activeHours: {
                                                                                ...formData.activeHours,
                                                                                startHour: parseInt(e.target.value) || 0,
                                                                            },
                                                                        }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "end-hour", children: "End Hour" }), _jsx(Input, { id: "end-hour", type: "number", min: "0", max: "23", value: formData.activeHours?.endHour || 18, onChange: (e) => setFormData({
                                                                            ...formData,
                                                                            activeHours: {
                                                                                ...formData.activeHours,
                                                                                endHour: parseInt(e.target.value) || 23,
                                                                            },
                                                                        }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Active Days" }), _jsx("div", { className: "flex flex-wrap gap-2", children: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: `day-${index}`, checked: formData.activeHours?.daysOfWeek?.includes(index) || false, onCheckedChange: (checked) => {
                                                                                const currentDays = formData.activeHours?.daysOfWeek || [];
                                                                                const newDays = checked
                                                                                    ? [...currentDays, index]
                                                                                    : currentDays.filter((d) => d !== index);
                                                                                setFormData({
                                                                                    ...formData,
                                                                                    activeHours: {
                                                                                        ...formData.activeHours,
                                                                                        daysOfWeek: newDays.sort(),
                                                                                    },
                                                                                });
                                                                            } }), _jsx(Label, { htmlFor: `day-${index}`, className: "cursor-pointer text-sm", children: day })] }, index))) })] })] }))] })] }), _jsxs(DialogFooter, { className: "shrink-0 border-t bg-muted/30 px-6 py-4 gap-3", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), disabled: loading, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: loading, children: loading ? "Creating..." : "Save" })] })] })] })] }));
}
