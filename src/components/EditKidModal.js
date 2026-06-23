import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Edit, User } from "lucide-react";
import MapPicker from "@/components/MapPicker";
import { updateKid, updateUserLocation } from "@/lib/firestore";
import { getCurrentUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
export function EditKidModal({ kid, onKidUpdated }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: kid.name,
        age: kid.age,
        location: kid.location,
        address: "",
        latitude: kid.latitude,
        longitude: kid.longitude,
        avatar: kid.avatar || "",
        radius: undefined,
        status: kid.status,
        phoneNumber: kid.phoneNumber || "",
    });
    const { toast } = useToast();
    useEffect(() => {
        setFormData({
            name: kid.name,
            age: kid.age,
            location: kid.location,
            address: "",
            latitude: kid.latitude,
            longitude: kid.longitude,
            avatar: kid.avatar || "",
            radius: undefined,
            status: kid.status,
            phoneNumber: kid.phoneNumber || "",
        });
    }, [kid]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        const currentUserId = getCurrentUser()?.uid;
        const isMonitoredUser = kid.parentId && kid.parentId !== currentUserId;
        // For actual kids, require name and age. For monitored users, only require location.
        if (isMonitoredUser) {
            if (!formData.location) {
                toast({
                    title: "Validation Error",
                    description: "Please fill in the location field.",
                    variant: "destructive",
                });
                return;
            }
        }
        else {
            if (!formData.name || !formData.location) {
                toast({
                    title: "Validation Error",
                    description: "Please fill in all required fields with valid data.",
                    variant: "destructive",
                });
                return;
            }
        }
        setLoading(true);
        try {
            // Check if this is a monitored user (when guardian is editing primary user)
            // or an actual kid. Monitored users have parentId !== currentUserId.
            if (isMonitoredUser) {
                // This is a monitored primary user - update user document
                // Only allow updating location/address for monitored users
                await updateUserLocation(kid.id, formData.latitude || kid.latitude, formData.longitude || kid.longitude, formData.location);
            }
            else {
                // This is an actual kid - update myG document
                await updateKid(kid.id, formData);
            }
            toast({
                title: "Success!",
                description: `${formData.name}'s profile has been updated successfully.`,
            });
            setOpen(false);
            onKidUpdated();
        }
        catch (error) {
            console.error("Error updating kid:", error);
            toast({
                title: "Error",
                description: "Failed to update profile. Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", children: [_jsx(Edit, { className: "h-4 w-4" }), "Edit"] }) }), _jsxs(DialogContent, { className: "sm:max-w-[425px] max-h-[95vh] flex flex-col overflow-hidden p-0 gap-0", children: [_jsxs(DialogHeader, { className: "shrink-0 px-6 pt-6 pb-2 pr-12", children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(User, { className: "h-5 w-5" }), "Edit ", kid.parentId === getCurrentUser()?.uid ? "G" : "User", "'s Profile"] }), _jsxs(DialogDescription, { children: ["Update the information for ", kid.name, "'s profile."] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col flex-1 overflow-hidden", children: [_jsxs("div", { className: "overflow-y-auto flex-1 px-6 py-4 space-y-4", children: [kid.parentId === getCurrentUser()?.uid && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "name", children: "G's Name *" }), _jsx(Input, { id: "name", value: formData.name || "", onChange: (e) => handleInputChange("name", e.target.value), placeholder: "Enter G's full name", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "age", children: "Age" }), _jsx(Input, { id: "age", type: "number", value: formData.age || "", onChange: (e) => handleInputChange("age", parseInt(e.target.value) || 0), placeholder: "Enter G's age" })] })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "location", children: "Current Location *" }), _jsx(Input, { id: "location", value: formData.location || "", onChange: (e) => handleInputChange("location", e.target.value), placeholder: "e.g., Home, School, Park", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "address", children: "Address/Description *" }), _jsx(Input, { id: "address", value: formData.address || "", onChange: (e) => handleInputChange("address", e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Location Coordinates" }), _jsx(MapPicker, { latitude: formData.latitude, longitude: formData.longitude, address: formData.address, radius: formData.radius, onChange: (lat, lng) => {
                                                    handleInputChange("latitude", lat);
                                                    handleInputChange("longitude", lng);
                                                }, height: "220px" }), _jsxs("div", { className: "flex items-center gap-4 text-sm mt-2", children: [_jsxs("div", { children: ["Lat: ", formData.latitude ?? "—"] }), _jsxs("div", { children: ["Lng: ", formData.longitude ?? "—"] }), _jsx(Button, { type: "button", variant: "outline", onClick: () => {
                                                            handleInputChange("latitude", undefined);
                                                            handleInputChange("longitude", undefined);
                                                        }, children: "Clear" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "radius", children: "Radius (meters) *" }), _jsx(Input, { id: "radius", type: "number", min: 10, value: formData.radius || "", onChange: (e) => handleInputChange("radius", e.target.value === "" ? undefined : Number(e.target.value) || 0) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "status", children: "Status" }), _jsxs(Select, { value: formData.status, onValueChange: (value) => handleInputChange("status", value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "safe", children: "Safe in Zone" }), _jsx(SelectItem, { value: "warning", children: "Near Boundary" }), _jsx(SelectItem, { value: "alert", children: "Outside Zone" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "phoneNumber", children: "Phone Number (for Call / Message)" }), _jsx(Input, { id: "phoneNumber", type: "tel", value: formData.phoneNumber || "", onChange: (e) => handleInputChange("phoneNumber", e.target.value), placeholder: "e.g. +27123456789" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "avatar", children: "Avatar URL (Optional)" }), _jsx(Input, { id: "avatar", value: formData.avatar || "", onChange: (e) => handleInputChange("avatar", e.target.value), placeholder: "https://example.com/avatar.jpg" })] })] }), _jsxs(DialogFooter, { className: "shrink-0 border-t bg-muted/30 px-6 py-4 gap-3", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), disabled: loading, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: loading, children: loading ? "Updating..." : "Save" })] })] })] })] }));
}
