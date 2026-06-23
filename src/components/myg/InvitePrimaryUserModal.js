import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { createGuardianInvitation } from "@/lib/myg-linking";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail } from "lucide-react";
export const InvitePrimaryUserModal = ({ currentUserId, currentUserEmail, onInvitationSent, }) => {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const handleSubmit = async (e) => {
        e.preventDefault();
        // 1. Normalize the input email
        const targetEmail = email.trim().toLowerCase();
        // 2. Validation: Prevent self-invitation
        if (targetEmail === currentUserEmail?.toLowerCase()) {
            return toast({
                title: "Invalid Email",
                description: "You cannot invite yourself.",
                variant: "destructive",
            });
        }
        setLoading(true);
        try {
            // 3. Call the guardian invitation function
            await createGuardianInvitation({
                fromUserId: currentUserId,
                toUserEmail: targetEmail,
                fromUserEmail: currentUserEmail,
            });
            toast({
                title: "Invitation sent!",
                description: `An invitation has been sent to ${targetEmail}`,
            });
            setEmail("");
            setOpen(false);
            onInvitationSent?.();
        }
        catch (error) {
            toast({
                title: "Request Failed",
                description: error.message || "Failed to send invitation",
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { disabled: !currentUserId, children: [_jsx(UserPlus, { className: "h-4 w-4 mr-2" }), "Invite Primary User"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Invite a Primary User" }), _jsx(DialogDescription, { children: "Send an invitation to someone you want to monitor. They must have a MYG account." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "primary-user-email", children: "User Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "primary-user-email", type: "email", placeholder: "user@example.com", value: email, onChange: (e) => setEmail(e.target.value), required: true, className: "pl-10" })] })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? "Sending..." : "Send Invitation" })] })] })] }));
};
