import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RoleSelection } from "@/components/auth/RoleSelection";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [step, setStep] = useState<"login" | "role">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const navigate = useNavigate();

  const handleSignUp = (userEmail: string, userPassword: string, userName: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setDisplayName(userName);
    setStep("role");
  };

  const handleRoleSelected = () => {
    // After successful signup, reset local state so next visit starts on login
    setEmail("");
    setPassword("");
    setDisplayName("");
    setStep("login");
  };

  if (step === "role") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <RoleSelection
          email={email}
          password={password}
          displayName={displayName}
          onRoleSelected={handleRoleSelected}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <LoginForm onSuccess={() => navigate("/subscription")} onSignUp={handleSignUp} />
    </div>
  );
}
