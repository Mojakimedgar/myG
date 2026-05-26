import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { deleteKid } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
export function DeleteKidDialog({ kid, onKidDeleted }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const handleDelete = async () => {
        setLoading(true);
        try {
            await deleteKid(kid.id);
            toast({
                title: "Success!",
                description: `${kid.name}'s profile has been deleted successfully.`,
            });
            onKidDeleted();
        }
        catch (error) {
            console.error("Error deleting kid:", error);
            toast({
                title: "Error",
                description: "Failed to delete G's profile. Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(AlertDialog, { children: [_jsx(AlertDialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", className: "gap-2 text-red-600 hover:text-red-700 hover:bg-red-50", children: [_jsx(Trash2, { className: "h-4 w-4" }), "Delete"] }) }), _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsxs(AlertDialogTitle, { className: "flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "h-5 w-5 text-red-500" }), "Are you sure you want to delete this profile?"] }), _jsxs(AlertDialogDescription, { children: ["This action cannot be undone. This will permanently delete", " ", _jsx("span", { className: "font-semibold", children: kid.name }), "'s profile and remove all associated data from the database."] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { disabled: loading, children: "Cancel" }), _jsx(AlertDialogAction, { onClick: handleDelete, disabled: loading, className: "bg-red-600 hover:bg-red-700 focus:ring-red-600", children: loading ? "Deleting..." : "Yes, Delete Profile" })] })] })] }));
}
