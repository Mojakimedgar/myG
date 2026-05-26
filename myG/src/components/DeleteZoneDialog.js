import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { deleteZone } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
export function DeleteZoneDialog({ zone, onZoneDeleted }) {
    const { toast } = useToast();
    const handleDelete = async () => {
        try {
            await deleteZone(zone.id);
            toast({ title: "Zone deleted", description: `${zone.name} has been removed.` });
            onZoneDeleted();
        }
        catch (err) {
            console.error(err);
            toast({ title: "Failed to delete zone", description: "Please try again.", variant: "destructive" });
        }
    };
    return (_jsxs(AlertDialog, { children: [_jsx(AlertDialogTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", className: "text-destructive hover:text-destructive", children: _jsx(Trash2, { className: "h-4 w-4" }) }) }), _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Delete zone?" }), _jsxs(AlertDialogDescription, { children: ["This action cannot be undone. This will permanently delete the zone \"", zone.name, "\"."] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "Cancel" }), _jsx(AlertDialogAction, { onClick: handleDelete, className: "bg-red-600 hover:bg-red-700", children: "Delete" })] })] })] }));
}
