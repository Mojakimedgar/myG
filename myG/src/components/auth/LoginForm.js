import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail, Lock } from "lucide-react";
export const LoginForm = ({ onSuccess, onSignUp }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isSignUp) {
                if (!displayName.trim()) {
                    toast({
                        title: "Display name required",
                        description: "Please enter your display name",
                        variant: "destructive",
                    });
                    return;
                }
                // Pass to parent for role selection
                onSignUp?.(email, password, displayName);
            }
            else {
                await signIn(email, password);
                toast({
                    title: "Welcome back!",
                    description: "You've successfully signed in.",
                });
                onSuccess?.();
            }
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to authenticate",
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(Card, { className: "w-full max-w-md mx-auto", children: [_jsxs(CardHeader, { className: "space-y-1", children: [_jsx("div", { className: "flex items-center justify-center mb-4", children: _jsx(Shield, { className: "h-12 w-12 text-primary" }) }), _jsx(CardTitle, { className: "text-2xl text-center", children: isSignUp ? "Create Account" : "Welcome to MYG" }), _jsx(CardDescription, { className: "text-center", children: isSignUp
                            ? "Sign up to start monitoring and staying safe"
                            : "Sign in to your MYG account" })] }), _jsxs(CardContent, { children: [_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [isSignUp && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "displayName", children: "Display Name" }), _jsx(Input, { id: "displayName", type: "text", placeholder: "Your name", value: displayName, onChange: (e) => setDisplayName(e.target.value), required: isSignUp })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "email", type: "email", placeholder: "you@example.com", value: email, onChange: (e) => setEmail(e.target.value), required: true, className: "pl-10" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "password", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: (e) => setPassword(e.target.value), required: true, className: "pl-10" })] })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In" })] }), _jsx("div", { className: "mt-4 text-center text-sm", children: _jsx("button", { type: "button", onClick: () => setIsSignUp(!isSignUp), className: "text-primary hover:underline", children: isSignUp
                                ? "Already have an account? Sign in"
                                : "Don't have an account? Sign up" }) })] })] }));
};
