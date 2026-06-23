import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signUp } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { User, Shield } from "lucide-react";
export const RoleSelection = ({ email, password, displayName, onRoleSelected, }) => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();
    const handleRoleSelect = async (role) => {
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
        }
        catch (error) {
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
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "w-full max-w-2xl mx-auto space-y-6", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("h2", { className: "text-3xl font-bold", children: "Choose Your Role" }), _jsx("p", { className: "text-muted-foreground", children: "Select how you'll use MYG to stay safe and connected" })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [_jsxs(Card, { className: "cursor-pointer hover:border-primary transition-colors", children: [_jsxs(CardHeader, { children: [_jsx("div", { className: "flex items-center justify-center mb-4", children: _jsx(User, { className: "h-12 w-12 text-primary" }) }), _jsx(CardTitle, { children: "Primary User" }), _jsx(CardDescription, { children: "I want to be monitored and stay safe" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("ul", { className: "text-sm text-muted-foreground space-y-2", children: [_jsx("li", { children: "\u2022 Confirm your safety status" }), _jsx("li", { children: "\u2022 Move through safe and unsafe zones" }), _jsx("li", { children: "\u2022 Respond to safety checks" }), _jsx("li", { children: "\u2022 Invite guardians to watch over you" })] }), _jsx(Button, { className: "w-full", onClick: () => handleRoleSelect("primary"), disabled: loading, children: loading ? "Creating..." : "I'm a Primary User" })] })] }), _jsxs(Card, { className: "cursor-pointer hover:border-primary transition-colors", children: [_jsxs(CardHeader, { children: [_jsx("div", { className: "flex items-center justify-center mb-4", children: _jsx(Shield, { className: "h-12 w-12 text-primary" }) }), _jsx(CardTitle, { children: "Guardian (MYG)" }), _jsx(CardDescription, { children: "I want to monitor and protect others" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("ul", { className: "text-sm text-muted-foreground space-y-2", children: [_jsx("li", { children: "\u2022 Monitor location and safety status" }), _jsx("li", { children: "\u2022 Create and manage safe zones" }), _jsx("li", { children: "\u2022 Initiate safety checks" }), _jsx("li", { children: "\u2022 Receive alerts and notifications" })] }), _jsx(Button, { className: "w-full", variant: "outline", onClick: () => handleRoleSelect("guardian"), disabled: loading, children: loading ? "Creating..." : "I'm a Guardian" })] })] })] })] }));
};
