import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { acceptInvitation, rejectInvitation, subscribeInvitations } from "@/lib/myg-linking";
import { MYGInvitation } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { Mail, Check, X } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

interface InvitationListProps {
  /** Called when the underlying MYG relationship may have changed (accept/reject) */
  onRelationChanged?: () => void;
}

export const InvitationList: React.FC<InvitationListProps> = ({ onRelationChanged }) => {
  const [invitations, setInvitations] = useState<MYGInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeInvitations(currentUser.uid, (invites) => {
      setInvitations(invites);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleAccept = async (invitationId: string) => {
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (invitationId: string) => {
    try {
      await rejectInvitation(invitationId);
      toast({
        title: "Invitation rejected",
      });
      onRelationChanged?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject invitation",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading invitations...</div>;
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Pending Invitations
        </CardTitle>
        <CardDescription>
          You have {invitations.length} pending invitation{invitations.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.map((invitation) => {
          const isGuardianInvite = invitation.invitationType === "guardian_to_primary";
          const description = isGuardianInvite
            ? "Wants to monitor your safety"
            : "Wants you to be their MYG Guardian";
          
          return (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{invitation.fromUserEmail}</p>
                <p className="text-sm text-muted-foreground">
                  {description}
                </p>
                <Badge variant="outline" className="mt-2">
                  {invitation.status}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(invitation.id)}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(invitation.id)}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
