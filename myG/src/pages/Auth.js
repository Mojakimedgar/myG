import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RoleSelection } from "@/components/auth/RoleSelection";
import { useNavigate } from "react-router-dom";
export default function Auth() {
    const [step, setStep] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const navigate = useNavigate();
    const handleSignUp = (userEmail, userPassword, userName) => {
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
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4", children: _jsx(RoleSelection, { email: email, password: password, displayName: displayName, onRoleSelected: handleRoleSelected }) }));
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4", children: _jsx(LoginForm, { onSuccess: () => navigate("/subscription"), onSignUp: handleSignUp }) }));
}
