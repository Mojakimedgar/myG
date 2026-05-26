import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createGuardianInvitation } from "@/lib/myg-linking";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail } from "lucide-react";

interface InvitePrimaryUserModalProps {
  currentUserId: string;
  currentUserEmail: string;
  onInvitationSent?: () => void;
}

export const InvitePrimaryUserModal = ({
  currentUserId,
  currentUserEmail,
  onInvitationSent,
}: InvitePrimaryUserModalProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!currentUserId}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Primary User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a Primary User</DialogTitle>
          <DialogDescription>
            Send an invitation to someone you want to monitor. They must have a
            MYG account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primary-user-email">User Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="primary-user-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
