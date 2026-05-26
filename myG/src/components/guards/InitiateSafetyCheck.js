import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSafetyCheck } from "@/lib/safety-check";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
export const InitiateSafetyCheck = ({ monitoredUser }) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [timeoutMinutes, setTimeoutMinutes] = useState(5);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const currentUser = getCurrentUser();
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser)
            return;
        setLoading(true);
        try {
            await createSafetyCheck({
                userId: monitoredUser.id,
                initiatedBy: currentUser.uid,
                message: message || undefined,
                timeoutMinutes,
            });
            toast({
                title: "Safety check initiated",
                description: `A safety check has been sent to ${monitoredUser.displayName}`,
            });
            setMessage("");
            setOpen(false);
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to initiate safety check",
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(AlertTriangle, { className: "h-4 w-4 mr-2" }), "Safety Check"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Initiate Safety Check" }), _jsxs(DialogDescription, { children: ["Send a safety check request to ", monitoredUser.displayName] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "message", children: "Message (Optional)" }), _jsx(Textarea, { id: "message", placeholder: "Are you safe?", value: message, onChange: (e) => setMessage(e.target.value), rows: 3 })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "timeout", children: "Timeout (minutes)" }), _jsx(Input, { id: "timeout", type: "number", min: "1", max: "30", value: timeoutMinutes, onChange: (e) => setTimeoutMinutes(parseInt(e.target.value) || 5) })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? "Sending..." : "Send Safety Check" })] })] })] }));
};
