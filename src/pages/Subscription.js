import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Crown, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/auth";
import { updateUserProfile } from "@/lib/users";
import { SUBSCRIPTION_LIMITS } from "@/lib/subscription";
export default function SubscriptionPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [roleLabel, setRoleLabel] = useState("your account");
    const fromPath = useMemo(() => {
        const s = location.state;
        return s?.from || "/";
    }, [location.state]);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const profile = await getCurrentUserProfile();
                if (!profile)
                    return;
                if (!cancelled) {
                    setRoleLabel(profile.role === "guardian" ? "your Guardian (MYG) account" : "your Primary User account");
                }
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [fromPath, navigate]);
    const choosePlan = async (tier) => {
        const firebaseUser = getCurrentUser();
        if (!firebaseUser) {
            navigate("/auth", { replace: true });
            return;
        }
        setSaving(true);
        try {
            await updateUserProfile(firebaseUser.uid, {
                subscriptionTier: tier,
                hasChosenPlan: true,
            });
            toast({
                title: tier === "premium" ? "Premium activated" : "Free plan selected",
                description: "You can change your plan later in settings.",
            });
            navigate(fromPath, { replace: true });
        }
        catch (err) {
            console.error("Failed to save subscription choice", err);
            toast({
                title: "Couldn't save your choice",
                description: err?.message || "Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setSaving(false);
        }
    };
    const startPaidCheckout = async (plan) => {
        setSaving(true);
        try {
            const firebaseUser = getCurrentUser();
            if (!firebaseUser) {
                navigate("/auth", { replace: true });
                return;
            }
            const apiBase = import.meta.env.VITE_BILLING_API_URL;
            if (!apiBase) {
                throw new Error("Billing API URL (VITE_BILLING_API_URL) is not configured.");
            }
            const res = await fetch(`${apiBase}/create-checkout-session`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uid: firebaseUser.uid,
                    plan,
                }),
            });
            if (!res.ok) {
                throw new Error("Failed to start checkout. Please try again.");
            }
            const data = (await res.json());
            if (!data.checkoutUrl) {
                throw new Error("Billing service did not return a checkout URL.");
            }
            window.location.href = data.checkoutUrl;
        }
        catch (err) {
            console.error("Failed to start paid checkout", err);
            toast({
                title: "Couldn't start payment",
                description: err?.message || "Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4", children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin mx-auto text-primary" }), _jsx("p", { className: "text-muted-foreground", children: "Loading..." })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-background via-background to-muted", children: _jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8", children: [_jsxs("div", { className: "text-center space-y-4", children: [_jsxs("div", { className: "inline-flex items-center gap-2 justify-center text-primary font-semibold text-lg", children: [_jsx("span", { className: "inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10", children: _jsx(Shield, { className: "h-4 w-4" }) }), _jsx("span", { children: "Salema" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h1", { className: "text-3xl md:text-4xl font-bold", children: "Choose a Plan to Protect Your Children" }), _jsxs("p", { className: "text-muted-foreground", children: ["Before you set up safe zones or link MYGs, pick what works best for", " ", roleLabel, "."] })] })] }), _jsxs(Card, { className: "border-0 shadow-lg bg-card/80", children: [_jsx(CardHeader, { className: "pb-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "Choose a Plan to Protect Your Children" }), _jsx(CardDescription, { children: "Start free, then upgrade as your family's needs grow." })] }), _jsx(Badge, { className: "bg-gradient-to-r from-primary to-primary-glow text-white border-0", children: "Most families pick Family" })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "overflow-x-auto", children: [_jsx("div", { className: "min-w-[720px] rounded-2xl border bg-background/80 shadow-sm", children: _jsxs("div", { className: "grid grid-cols-5 text-sm", children: [_jsx("div", { className: "bg-muted/60 px-4 py-4 font-medium text-muted-foreground", children: "Plan" }), _jsx("div", { className: "px-4 py-4 text-center font-semibold", children: "Free" }), _jsx("div", { className: "px-4 py-4 text-center font-semibold", children: "Basic" }), _jsxs("div", { className: "relative px-4 py-4 text-center font-semibold", children: [_jsx("div", { className: "absolute -top-3 left-1/2 -translate-x-1/2", children: _jsx(Badge, { className: "bg-amber-400 text-amber-950 border-0 text-[10px] px-2 py-0.5", children: "Popular" }) }), "Family"] }), _jsxs("div", { className: "px-4 py-4 text-center font-semibold flex items-center justify-center gap-1", children: ["Premium", _jsx(Crown, { className: "h-4 w-4 text-primary" })] }), _jsx("div", { className: "bg-muted/60 px-4 py-3 font-medium text-muted-foreground", children: "Price / month" }), _jsx("div", { className: "px-4 py-3 text-center font-bold", children: "R0" }), _jsx("div", { className: "px-4 py-3 text-center font-bold text-primary", children: "R49" }), _jsx("div", { className: "px-4 py-3 text-center font-bold text-orange-500", children: "R129" }), _jsx("div", { className: "px-4 py-3 text-center font-bold text-primary", children: "R249" }), _jsx("div", { className: "bg-muted/60 px-4 py-3 font-medium text-muted-foreground", children: "Children" }), _jsx("div", { className: "px-4 py-3 text-center", children: "1" }), _jsx("div", { className: "px-4 py-3 text-center", children: "1" }), _jsx("div", { className: "px-4 py-3 text-center", children: "3" }), _jsx("div", { className: "px-4 py-3 text-center", children: "Unlimited" }), _jsx("div", { className: "bg-muted/60 px-4 py-3 font-medium text-muted-foreground", children: "Zones" }), _jsx("div", { className: "px-4 py-3 text-center", children: SUBSCRIPTION_LIMITS.free.maxZones }), _jsx("div", { className: "px-4 py-3 text-center", children: "5" }), _jsx("div", { className: "px-4 py-3 text-center", children: "15" }), _jsx("div", { className: "px-4 py-3 text-center", children: "Unlimited" }), _jsx("div", { className: "bg-muted/60 px-4 py-3 font-medium text-muted-foreground", children: "Travel history" }), _jsx("div", { className: "px-4 py-3 text-center", children: "24 h" }), _jsx("div", { className: "px-4 py-3 text-center", children: "7 days" }), _jsx("div", { className: "px-4 py-3 text-center", children: "30 days" }), _jsx("div", { className: "px-4 py-3 text-center", children: "90 days" }), _jsx("div", { className: "bg-muted/60 px-4 py-3 font-medium text-muted-foreground", children: "Alerts" }), _jsx("div", { className: "px-4 py-3 text-center", children: "Basic" }), _jsx("div", { className: "px-4 py-3 text-center", children: "Select" }), _jsx("div", { className: "px-4 py-3 text-center", children: "Real-time" }), _jsx("div", { className: "px-4 py-3 text-center", children: "Advanced" }), _jsx("div", { className: "bg-muted/60 px-4 py-4 font-medium text-muted-foreground", children: "\u00A0" }), _jsx("div", { className: "px-4 py-4 flex justify-center", children: _jsx(Button, { size: "sm", variant: "outline", className: "w-full max-w-[120px]", onClick: () => choosePlan("free"), disabled: saving, children: saving ? "Saving..." : "Select" }) }), _jsx("div", { className: "px-4 py-4 flex justify-center", children: _jsx(Button, { size: "sm", className: "w-full max-w-[120px]", variant: "outline", onClick: () => startPaidCheckout("basic"), disabled: saving, children: saving ? "Saving..." : "Select" }) }), _jsx("div", { className: "px-4 py-4 flex justify-center", children: _jsx(Button, { size: "sm", className: "w-full max-w-[120px] bg-gradient-to-r from-primary to-primary-glow text-white border-0", onClick: () => startPaidCheckout("family"), disabled: saving, children: saving ? "Saving..." : "Select" }) }), _jsx("div", { className: "px-4 py-4 flex justify-center", children: _jsx(Button, { size: "sm", className: "w-full max-w-[120px]", onClick: () => startPaidCheckout("premium"), disabled: saving, children: saving ? "Saving..." : "Select" }) })] }) }), _jsx("p", { className: "mt-4 text-xs text-muted-foreground text-center", children: "After payment, your billing backend should update the MYG account subscription tier based on the completed plan." })] }) })] })] }) }));
}
