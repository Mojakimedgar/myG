import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Clock } from "lucide-react";
import MapPicker from "@/components/MapPicker";
import { updateZone } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
export function EditZoneModal({ zone, onZoneUpdated, asIcon = false }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [zoneGroups, setZoneGroups] = useState([]);
    const [formData, setFormData] = useState({
        name: zone.name,
        address: zone.address,
        latitude: zone.latitude,
        longitude: zone.longitude,
        radius: zone.radius,
        type: zone.type,
        totalKids: zone.totalKids,
        isActive: zone.isActive,
        groupId: zone.groupId,
        customLabel: zone.customLabel || "",
        activeHours: zone.activeHours || {
            enabled: false,
            startHour: 8,
            endHour: 18,
            daysOfWeek: [1, 2, 3, 4, 5],
        },
        status: "safe",
    });
    const { toast } = useToast();
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
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };
    useEffect(() => {
        setFormData({
            name: zone.name,
            address: zone.address,
            latitude: zone.latitude,
            longitude: zone.longitude,
            radius: zone.radius,
            type: zone.type,
            totalKids: zone.totalKids,
            isActive: zone.isActive,
            groupId: zone.groupId,
            activeHours: zone.activeHours || {
                enabled: false,
                startHour: 8,
                endHour: 18,
                daysOfWeek: [1, 2, 3, 4, 5],
            },
            status: "safe",
        });
    }, [zone]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.address || !formData.radius)
            return;
        setLoading(true);
        try {
            await updateZone(zone.id, formData);
            toast({ title: "Zone updated", description: `${formData.name} saved.` });
            setOpen(false);
            onZoneUpdated();
        }
        catch (err) {
            console.error(err);
            toast({ title: "Failed to update zone", description: "Please try again.", variant: "destructive" });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: asIcon ? (_jsx(Button, { variant: "outline", size: "sm", children: _jsx(Settings, { className: "h-4 w-4" }) })) : (_jsx(Button, { variant: "outline", size: "sm", children: "Edit Zone" })) }), _jsxs(DialogContent, { className: "sm:max-w-[480px] max-h-[95vh] flex flex-col overflow-hidden p-0 gap-0", children: [_jsxs(DialogHeader, { className: "shrink-0 px-6 pt-6 pb-2 pr-12", children: [_jsx(DialogTitle, { children: "Edit Zone" }), _jsx(DialogDescription, { children: "Update this safety zone configuration." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col flex-1 overflow-hidden", children: [_jsxs("div", { className: "overflow-y-auto flex-1 px-6 py-4 space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "name", children: "Name" }), _jsx(Input, { id: "name", value: formData.name || "", onChange: (e) => setFormData({ ...formData, name: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "address", children: "Address/Description" }), _jsx(Input, { id: "address", value: formData.address || "", onChange: (e) => setFormData({ ...formData, address: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Location" }), _jsx(MapPicker, { latitude: formData.latitude, longitude: formData.longitude, address: formData.address, radius: formData.radius, onChange: (lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng }), height: "220px" }), _jsxs("div", { className: "flex items-center gap-4 text-sm mt-2", children: [_jsxs("div", { children: ["Lat: ", formData.latitude ?? "—"] }), _jsxs("div", { children: ["Lng: ", formData.longitude ?? "—"] }), _jsx(Button, { type: "button", variant: "outline", onClick: () => setFormData({ ...formData, latitude: undefined, longitude: undefined }), children: "Clear" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "radius", children: "Radius (meters)" }), _jsx(Input, { id: "radius", type: "number", min: 10, value: formData.radius || 0, onChange: (e) => setFormData({ ...formData, radius: Number(e.target.value) || 0 }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Type" }), _jsxs(Select, { value: formData.type, onValueChange: (v) => setFormData({ ...formData, type: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "home", children: "Home" }), _jsx(SelectItem, { value: "school", children: "School" }), _jsx(SelectItem, { value: "work", children: "Work" }), _jsx(SelectItem, { value: "custom", children: "Custom" })] })] })] }), formData.type === "custom" && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "edit-customLabel", children: "Custom Label" }), _jsx(Textarea, { id: "edit-customLabel", placeholder: "Enter a custom name or description for this zone", value: formData.customLabel || "", onChange: (e) => setFormData({ ...formData, customLabel: e.target.value }), rows: 3 })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "status", children: "Status" }), _jsxs(Select, { value: formData.status, onValueChange: (value) => handleInputChange("status", value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "safe", children: "Safe in Zone" }), _jsx(SelectItem, { value: "warning", children: "Near Boundary" }), _jsx(SelectItem, { value: "alert", children: "Outside Zone" })] })] })] }), zoneGroups.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Zone Group (Optional)" }), _jsxs(Select, { value: formData.groupId || "", onValueChange: (groupId) => setFormData({ ...formData, groupId: groupId || undefined }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a group (optional)" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "", children: "None" }), zoneGroups.map((group) => (_jsx(SelectItem, { value: group.id, children: group.name }, group.id)))] })] })] })), _jsxs("div", { className: "space-y-4 border-t pt-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "edit-active-hours-enabled", checked: formData.activeHours?.enabled || false, onCheckedChange: (checked) => setFormData({
                                                            ...formData,
                                                            activeHours: {
                                                                ...formData.activeHours,
                                                                enabled: checked,
                                                            },
                                                        }) }), _jsxs(Label, { htmlFor: "edit-active-hours-enabled", className: "flex items-center gap-2 cursor-pointer", children: [_jsx(Clock, { className: "h-4 w-4" }), "Enable Active Hours"] })] }), formData.activeHours?.enabled && (_jsxs("div", { className: "space-y-4 pl-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "edit-start-hour", children: "Start Hour" }), _jsx(Input, { id: "edit-start-hour", type: "number", min: "0", max: "23", value: formData.activeHours?.startHour || 8, onChange: (e) => setFormData({
                                                                            ...formData,
                                                                            activeHours: {
                                                                                ...formData.activeHours,
                                                                                startHour: parseInt(e.target.value) || 0,
                                                                            },
                                                                        }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "edit-end-hour", children: "End Hour" }), _jsx(Input, { id: "edit-end-hour", type: "number", min: "0", max: "23", value: formData.activeHours?.endHour || 18, onChange: (e) => setFormData({
                                                                            ...formData,
                                                                            activeHours: {
                                                                                ...formData.activeHours,
                                                                                endHour: parseInt(e.target.value) || 23,
                                                                            },
                                                                        }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Active Days" }), _jsx("div", { className: "flex flex-wrap gap-2", children: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: `edit-day-${index}`, checked: formData.activeHours?.daysOfWeek?.includes(index) || false, onCheckedChange: (checked) => {
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
                                                                            } }), _jsx(Label, { htmlFor: `edit-day-${index}`, className: "cursor-pointer text-sm", children: day })] }, index))) })] })] }))] })] }), _jsxs(DialogFooter, { className: "shrink-0 border-t bg-muted/30 px-6 py-4 gap-3", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), disabled: loading, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: loading, children: loading ? "Saving..." : "Save" })] })] })] })] }));
}
