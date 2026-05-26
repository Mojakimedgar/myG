import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, HelpCircle, Clock } from "lucide-react";
import { SafetyCheck } from "@/types/safety-check";
import { respondToSafetyCheck } from "@/lib/safety-check";
import { useToast } from "@/hooks/use-toast";
import { showSafetyCheckNotification } from "@/lib/notifications";

interface SafetyCheckPopupProps {
  check: SafetyCheck;
  onResponded: () => void;
}

export const SafetyCheckPopup = ({ check, onResponded }: SafetyCheckPopupProps) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(check.timeoutMinutes * 60);
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
    showSafetyCheckNotification(
      check.message || "Are you safe?",
      check.initiatedBy,
      check.id
    );
  }, [check]);

  const handleResponse = async (response: "safe" | "help_needed") => {
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send response",
        variant: "destructive",
      });
    } finally {
      setResponding(false);
    }
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-warning-zone" />
            <DialogTitle>Safety Check</DialogTitle>
          </div>
          <DialogDescription>
            {check.message || "Are you safe?"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {timeRemaining > 0
                ? `${minutes}:${seconds.toString().padStart(2, "0")} remaining`
                : "Time expired - escalation in progress"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleResponse("safe")}
              disabled={responding}
              className="h-auto py-6 flex flex-col items-center gap-2"
              variant="default"
            >
              <CheckCircle className="h-6 w-6" />
              <span className="font-semibold">I am safe</span>
            </Button>
            
            <Button
              onClick={() => handleResponse("help_needed")}
              disabled={responding}
              className="h-auto py-6 flex flex-col items-center gap-2"
              variant="destructive"
            >
              <HelpCircle className="h-6 w-6" />
              <span className="font-semibold">I need help</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
