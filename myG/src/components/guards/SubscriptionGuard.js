import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getCurrentUserProfile } from "@/lib/auth";
export function SubscriptionGuard({ children }) {
    const [loading, setLoading] = useState(true);
    const [hasChosenPlan, setHasChosenPlan] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const profile = await getCurrentUserProfile();
                const chosen = Boolean(profile?.hasChosenPlan);
                if (!cancelled) {
                    setHasChosenPlan(chosen);
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
    }, []);
    useEffect(() => {
        if (loading)
            return;
        if (hasChosenPlan)
            return;
        navigate("/subscription", {
            replace: true,
            state: { from: location.pathname },
        });
    }, [hasChosenPlan, loading, location.pathname, navigate]);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin mx-auto text-primary" }), _jsx("p", { className: "text-muted-foreground", children: "Loading..." })] }) }));
    }
    if (!hasChosenPlan)
        return null;
    return _jsx(_Fragment, { children: children });
}
