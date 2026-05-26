import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSafetyCheck } from "@/lib/safety-check";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { User as UserType } from "@/types/user";

interface InitiateSafetyCheckProps {
  monitoredUser: UserType;
}

export const InitiateSafetyCheck = ({ monitoredUser }: InitiateSafetyCheckProps) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [timeoutMinutes, setTimeoutMinutes] = useState(5);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate safety check",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Safety Check
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Initiate Safety Check</DialogTitle>
          <DialogDescription>
            Send a safety check request to {monitoredUser.displayName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Are you safe?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeout">Timeout (minutes)</Label>
            <Input
              id="timeout"
              type="number"
              min="1"
              max="30"
              value={timeoutMinutes}
              onChange={(e) => setTimeoutMinutes(parseInt(e.target.value) || 5)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send Safety Check"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
