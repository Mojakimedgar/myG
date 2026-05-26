import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderPlus, Folder, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, updateDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
export const ZoneGroupManager = ({ zones, onGroupUpdated }) => {
    const [groups, setGroups] = useState([]);
    const [open, setOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "zoneGroups"), (snapshot) => {
            const groupsData = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    name: data.name || "",
                    description: data.description || "",
                    zoneIds: data.zoneIds || [],
                    createdAt: data.createdAt?.toDate() || new Date(),
                };
            });
            setGroups(groupsData);
        });
        return () => unsubscribe();
    }, []);
    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            toast({
                title: "Error",
                description: "Group name is required",
                variant: "destructive",
            });
            return;
        }
        setLoading(true);
        try {
            await addDoc(collection(db, "zoneGroups"), {
                name: groupName,
                description: groupDescription || "",
                zoneIds: [],
                createdAt: new Date(),
            });
            toast({
                title: "Group created",
                description: `${groupName} has been created`,
            });
            setGroupName("");
            setGroupDescription("");
            setOpen(false);
            onGroupUpdated();
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to create group",
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleAddZoneToGroup = async (zoneId, groupId) => {
        const group = groups.find((g) => g.id === groupId);
        if (!group)
            return;
        const updatedZoneIds = [...group.zoneIds, zoneId];
        try {
            await updateDoc(doc(db, "zoneGroups", groupId), {
                zoneIds: updatedZoneIds,
            });
            // Update zone's groupId
            await updateDoc(doc(db, "zones", zoneId), {
                groupId,
            });
            toast({
                title: "Zone added to group",
            });
            onGroupUpdated();
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to add zone to group",
                variant: "destructive",
            });
        }
    };
    const handleRemoveZoneFromGroup = async (zoneId, groupId) => {
        const group = groups.find((g) => g.id === groupId);
        if (!group)
            return;
        const updatedZoneIds = group.zoneIds.filter((id) => id !== zoneId);
        try {
            await updateDoc(doc(db, "zoneGroups", groupId), {
                zoneIds: updatedZoneIds,
            });
            // Remove zone's groupId
            await updateDoc(doc(db, "zones", zoneId), {
                groupId: null,
            });
            toast({
                title: "Zone removed from group",
            });
            onGroupUpdated();
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to remove zone from group",
                variant: "destructive",
            });
        }
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Zone Groups" }), _jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { size: "sm", children: [_jsx(FolderPlus, { className: "h-4 w-4 mr-2" }), "Create Group"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Create Zone Group" }), _jsx(DialogDescription, { children: "Group zones together for easier management" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "group-name", children: "Group Name *" }), _jsx(Input, { id: "group-name", value: groupName, onChange: (e) => setGroupName(e.target.value), placeholder: "e.g., School Zones" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "group-description", children: "Description" }), _jsx(Input, { id: "group-description", value: groupDescription, onChange: (e) => setGroupDescription(e.target.value), placeholder: "Optional description" })] }), _jsx(Button, { onClick: handleCreateGroup, disabled: loading, className: "w-full", children: loading ? "Creating..." : "Create Group" })] })] })] })] }), groups.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "No groups created yet" })) : (_jsx("div", { className: "space-y-3", children: groups.map((group) => {
                    const groupZones = zones.filter((z) => z.id && group.zoneIds.includes(z.id));
                    const ungroupedZones = zones.filter((z) => !z.groupId || z.groupId === "");
                    return (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Folder, { className: "h-5 w-5" }), group.name, _jsxs(Badge, { variant: "secondary", children: [groupZones.length, " zones"] })] }), group.description && (_jsx("p", { className: "text-sm text-muted-foreground", children: group.description }))] }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Add Zone to Group" }), _jsxs(Select, { onValueChange: (zoneId) => handleAddZoneToGroup(zoneId, group.id), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a zone to add" }) }), _jsxs(SelectContent, { children: [ungroupedZones.map((zone) => (_jsx(SelectItem, { value: zone.id, children: zone.name }, zone.id))), ungroupedZones.length === 0 && (_jsx(SelectItem, { value: "", disabled: true, children: "No ungrouped zones" }))] })] })] }), groupZones.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Zones in this group" }), _jsx("div", { className: "flex flex-wrap gap-2", children: groupZones.map((zone) => (_jsxs(Badge, { variant: "outline", className: "flex items-center gap-1", children: [zone.name, _jsx("button", { onClick: () => handleRemoveZoneFromGroup(zone.id, group.id), className: "ml-1 hover:text-destructive", children: _jsx(X, { className: "h-3 w-3" }) })] }, zone.id))) })] }))] })] }, group.id));
                }) }))] }));
};
