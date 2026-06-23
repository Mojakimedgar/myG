import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { acceptInvitation, rejectInvitation, subscribeInvitations } from "@/lib/myg-linking";
import { useToast } from "@/hooks/use-toast";
import { Mail, Check, X } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
export const InvitationList = ({ onRelationChanged }) => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const currentUser = getCurrentUser();
    useEffect(() => {
        if (!currentUser)
            return;
        const unsubscribe = subscribeInvitations(currentUser.uid, (invites) => {
            setInvitations(invites);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentUser]);
    const handleAccept = async (invitationId) => {
        try {
            const invitation = invitations.find(inv => inv.id === invitationId);
            await acceptInvitation(invitationId);
            const message = invitation?.invitationType === "guardian_to_primary"
                ? "You are now being monitored by this guardian"
                : "You are now monitoring this user";
            toast({
                title: "Invitation accepted",
                description: message,
            });
            onRelationChanged?.();
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to accept invitation",
                variant: "destructive",
            });
        }
    };
    const handleReject = async (invitationId) => {
        try {
            await rejectInvitation(invitationId);
            toast({
                title: "Invitation rejected",
            });
            onRelationChanged?.();
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to reject invitation",
                variant: "destructive",
            });
        }
    };
    if (loading) {
        return _jsx("div", { className: "text-center py-4 text-muted-foreground", children: "Loading invitations..." });
    }
    if (invitations.length === 0) {
        return null;
    }
    return (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Mail, { className: "h-5 w-5" }), "Pending Invitations"] }), _jsxs(CardDescription, { children: ["You have ", invitations.length, " pending invitation", invitations.length !== 1 ? "s" : ""] })] }), _jsx(CardContent, { className: "space-y-3", children: invitations.map((invitation) => {
                    const isGuardianInvite = invitation.invitationType === "guardian_to_primary";
                    const description = isGuardianInvite
                        ? "Wants to monitor your safety"
                        : "Wants you to be their MYG Guardian";
                    return (_jsxs("div", { className: "flex items-center justify-between p-4 border rounded-lg", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium", children: invitation.fromUserEmail }), _jsx("p", { className: "text-sm text-muted-foreground", children: description }), _jsx(Badge, { variant: "outline", className: "mt-2", children: invitation.status })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { size: "sm", onClick: () => handleAccept(invitation.id), className: "gap-2", children: [_jsx(Check, { className: "h-4 w-4" }), "Accept"] }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleReject(invitation.id), className: "gap-2", children: [_jsx(X, { className: "h-4 w-4" }), "Reject"] })] })] }, invitation.id));
                }) })] }));
};
