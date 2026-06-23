import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, User } from "lucide-react";
import MapPicker from "@/components/MapPicker";
import { addKid } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
export function AddKidModal({ onKidAdded }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        age: 0,
        location: "",
        address: "",
        latitude: undefined,
        longitude: undefined,
        avatar: "",
        radius: undefined,
        phoneNumber: "",
        type: "custom",
        status: "safe",
    });
    const { toast } = useToast();
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.location) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields with valid data.",
                variant: "destructive",
            });
            return;
        }
        setLoading(true);
        try {
            console.log("Adding kid:", formData);
            const kidId = await addKid(formData);
            console.log("Kid added with ID:", kidId);
            toast({
                title: "Success!",
                description: `${formData.name} has been added successfully.`,
            });
            setFormData({ name: "", age: 0, location: "", address: "", latitude: undefined, longitude: undefined, avatar: "", radius: undefined, phoneNumber: "", type: "custom", status: "safe" });
            setOpen(false);
            console.log("Calling onGAdded callback");
            onKidAdded();
        }
        catch (error) {
            console.error("Error adding kid:", error);
            toast({
                title: "Error",
                description: "Failed to add G's profile. Please try again.",
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
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: "gap-2", children: [_jsx(Plus, { className: "h-4 w-4" }), "Add G's Profile"] }) }), _jsxs(DialogContent, { className: "sm:max-w-[425px] max-h-[90vh] flex flex-col p-0 gap-0", children: [_jsxs(DialogHeader, { className: "shrink-0 px-6 pt-6 pb-2 pr-12", children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(User, { className: "h-5 w-5" }), "Add New G's Profile"] }), _jsx(DialogDescription, { children: "Create a new profile for your G to start monitoring their safety." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col flex-1 min-h-0", children: [_jsxs("div", { className: "overflow-y-auto flex-1 min-h-0 px-6 space-y-4 pb-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "name", children: "G's Name *" }), _jsx(Input, { id: "name", value: formData.name, onChange: (e) => handleInputChange("name", e.target.value), placeholder: "Enter G's full name", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "age", children: "Age" }), _jsx(Input, { id: "age", type: "number", value: formData.age || "", onChange: (e) => handleInputChange("age", parseInt(e.target.value) || 0), placeholder: "Enter G's age" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "location", children: "Current Location *" }), _jsx(Input, { id: "location", value: formData.location, onChange: (e) => handleInputChange("location", e.target.value), placeholder: "e.g., Home, School, Park", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "address", children: "Address/Description *" }), _jsx(Input, { id: "address", value: formData.address, onChange: (e) => setFormData({ ...formData, address: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Location Coordinates" }), _jsx(MapPicker, { latitude: formData.latitude, longitude: formData.longitude, address: formData.address, radius: formData.radius, onChange: (lat, lng) => {
                                                    handleInputChange("latitude", lat);
                                                    handleInputChange("longitude", lng);
                                                }, height: "220px" }), _jsxs("div", { className: "flex items-center gap-4 text-sm mt-2", children: [_jsxs("div", { children: ["Lat: ", formData.latitude ?? "—"] }), _jsxs("div", { children: ["Lng: ", formData.longitude ?? "—"] }), _jsx(Button, { type: "button", variant: "outline", onClick: () => {
                                                            handleInputChange("latitude", undefined);
                                                            handleInputChange("longitude", undefined);
                                                        }, children: "Clear" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "radius", children: "Radius (meters) *" }), _jsx(Input, { id: "radius", type: "number", min: 10, value: formData.radius, onChange: (e) => setFormData({ ...formData, radius: Number(e.target.value) || 0 }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "phoneNumber", children: "Phone Number (for Call / Message)" }), _jsx(Input, { id: "phoneNumber", type: "tel", value: formData.phoneNumber || "", onChange: (e) => handleInputChange("phoneNumber", e.target.value), placeholder: "e.g. +27123456789" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "avatar", children: "Avatar URL (Optional)" }), _jsx(Input, { id: "avatar", value: formData.avatar || "", onChange: (e) => handleInputChange("avatar", e.target.value), placeholder: "https://example.com/avatar.jpg" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "type", children: "Profile Type *" }), _jsxs(Select, { value: formData.type || "custom", onValueChange: (v) => setFormData({ ...formData, type: v }), children: [_jsx(SelectTrigger, { id: "type", children: _jsx(SelectValue, { placeholder: "Select type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "home", children: "Home" }), _jsx(SelectItem, { value: "school", children: "School" }), _jsx(SelectItem, { value: "work", children: "Work" }), _jsx(SelectItem, { value: "custom", children: "Custom" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "status", children: "Status" }), _jsxs(Select, { value: formData.status, onValueChange: (value) => handleInputChange("status", value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "safe", children: "Safe in Zone" }), _jsx(SelectItem, { value: "warning", children: "Near Boundary" }), _jsx(SelectItem, { value: "alert", children: "Outside Zone" })] })] })] })] }), _jsxs(DialogFooter, { className: "shrink-0 border-t bg-muted/30 px-6 py-4 rounded-b-lg", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), disabled: loading, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: loading, children: loading ? "Adding..." : "Save" })] })] })] })] }));
}
