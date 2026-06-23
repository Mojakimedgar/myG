import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signUp } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types/user";
import { User, Shield, Users } from "lucide-react";

interface RoleSelectionProps {
  email: string;
  password: string;
  displayName: string;
  onRoleSelected: (role: UserRole) => void;
}

export const RoleSelection = ({
  email,
  password,
  displayName,
  onRoleSelected,
}: RoleSelectionProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRoleSelect = async (role: UserRole) => {
    setLoading(true);
    try {
      await signUp(email, password, displayName, role);
      toast({
        title: "Sign up successful",
        description: `Your ${role === "primary" ? "Primary User" : "Guardian"} account has been created. Please log in to continue.`,
      });
      // Notify parent (if needed)
      onRoleSelected(role);
      // Always redirect to the login page after successful registration
      navigate("/auth", { replace: true });
    } catch (error: any) {
      // Only show a strong error when the email already exists.
      if (error?.code === "auth/email-already-in-use") {
        toast({
          title: "Email already in use",
          description: error.message || "This email already has a MYG account. Please sign in instead.",
          variant: "destructive",
        });
        return; // Stay on the role selection so user can adjust
      }

      // For other errors (e.g. network issues), show a gentle notice and move back to login.
      console.error("Sign up failed", error);
      toast({
        title: "We couldn't confirm sign up",
        description: "Please try again. If the problem persists, contact support.",
        variant: "destructive",
      });
      // Do not proceed to the login step when sign-up fails — keep user on role selection
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Choose Your Role</h2>
        <p className="text-muted-foreground">
          Select how you'll use MYG to stay safe and connected
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-primary" />
            </div>
            <CardTitle>Primary User</CardTitle>
            <CardDescription>
              I want to be monitored and stay safe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Confirm your safety status</li>
              <li>• Move through safe and unsafe zones</li>
              <li>• Respond to safety checks</li>
              <li>• Invite guardians to watch over you</li>
            </ul>
            <Button
              className="w-full"
              onClick={() => handleRoleSelect("primary")}
              disabled={loading}
            >
              {loading ? "Creating..." : "I'm a Primary User"}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle>Guardian (MYG)</CardTitle>
            <CardDescription>
              I want to monitor and protect others
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Monitor location and safety status</li>
              <li>• Create and manage safe zones</li>
              <li>• Initiate safety checks</li>
              <li>• Receive alerts and notifications</li>
            </ul>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleRoleSelect("guardian")}
              disabled={loading}
            >
              {loading ? "Creating..." : "I'm a Guardian"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
