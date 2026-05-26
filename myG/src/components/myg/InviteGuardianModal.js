import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { db } from "@/lib/firebase";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { createInvitation } from "@/lib/myg-linking";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail } from "lucide-react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
export const InviteGuardianModal = ({ currentUserId, currentUserEmail, onInvitationSent, }) => {
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
                description: "You cannot invite yourself as a guardian.",
                variant: "destructive",
            });
        }
        setLoading(true);
        try {
            // 3. Call the refactored createInvitation (from the previous step)
            await createInvitation({
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
            // This catches the "Guardian user not found" error from the backend
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
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { disabled: !currentUserId, children: [_jsx(UserPlus, { className: "h-4 w-4 mr-2" }), "Invite Guardian"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Invite a Guardian" }), _jsx(DialogDescription, { children: "Send an invitation to someone you trust to monitor your safety. They must have a MYG account." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "guardian-email", children: "Guardian Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "guardian-email", type: "email", placeholder: "guardian@example.com", value: email, onChange: (e) => setEmail(e.target.value), required: true, className: "pl-10" })] })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? "Sending..." : "Send Invitation" })] })] })] }));
};
export const normalizeUserEmails = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    const updates = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        if (data.email && data.email !== data.email.toLowerCase()) {
            return updateDoc(doc(db, "users", docSnap.id), {
                email: data.email.toLowerCase()
            });
        }
        return Promise.resolve();
    });
    await Promise.all(updates);
    console.log("Emails normalized!");
};
