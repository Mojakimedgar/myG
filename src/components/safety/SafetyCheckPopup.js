import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, HelpCircle, Clock } from "lucide-react";
import { respondToSafetyCheck } from "@/lib/safety-check";
import { useToast } from "@/hooks/use-toast";
import { showSafetyCheckNotification } from "@/lib/notifications";
export const SafetyCheckPopup = ({ check, onResponded }) => {
    const [timeRemaining, setTimeRemaining] = useState(check.timeoutMinutes * 60);
    const [responding, setResponding] = useState(false);
    const { toast } = useToast();
    useEffect(() => {
        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - check.createdAt.getTime()) / 1000);
            const remaining = check.timeoutMinutes * 60 - elapsed;
            setTimeRemaining(Math.max(0, remaining));
        }, 1000);
        return () => clearInterval(interval);
    }, [check.createdAt, check.timeoutMinutes]);
    // Show browser notification when safety check appears
    useEffect(() => {
        showSafetyCheckNotification(check.message || "Are you safe?", check.initiatedBy, check.id);
    }, [check]);
    const handleResponse = async (response) => {
        setResponding(true);
        try {
            await respondToSafetyCheck(check.id, response);
            toast({
                title: response === "safe" ? "Safety confirmed" : "Help requested",
                description: response === "safe"
                    ? "Your guardians have been notified that you're safe."
                    : "Your guardians have been alerted and help is on the way.",
            });
            onResponded();
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to send response",
                variant: "destructive",
            });
        }
        finally {
            setResponding(false);
        }
    };
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return (_jsx(Dialog, { open: true, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "h-6 w-6 text-warning-zone" }), _jsx(DialogTitle, { children: "Safety Check" })] }), _jsx(DialogDescription, { children: check.message || "Are you safe?" })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "flex items-center justify-center gap-2 text-sm text-muted-foreground", children: [_jsx(Clock, { className: "h-4 w-4" }), _jsx("span", { children: timeRemaining > 0
                                        ? `${minutes}:${seconds.toString().padStart(2, "0")} remaining`
                                        : "Time expired - escalation in progress" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs(Button, { onClick: () => handleResponse("safe"), disabled: responding, className: "h-auto py-6 flex flex-col items-center gap-2", variant: "default", children: [_jsx(CheckCircle, { className: "h-6 w-6" }), _jsx("span", { className: "font-semibold", children: "I am safe" })] }), _jsxs(Button, { onClick: () => handleResponse("help_needed"), disabled: responding, className: "h-auto py-6 flex flex-col items-center gap-2", variant: "destructive", children: [_jsx(HelpCircle, { className: "h-6 w-6" }), _jsx("span", { className: "font-semibold", children: "I need help" })] })] })] })] }) }));
};
