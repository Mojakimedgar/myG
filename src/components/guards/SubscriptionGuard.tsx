import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getCurrentUserProfile } from "@/lib/auth";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const [loading, setLoading] = useState(true);
  const [hasChosenPlan, setHasChosenPlan] = useState<boolean>(false);
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
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (hasChosenPlan) return;

    navigate("/subscription", {
      replace: true,
      state: { from: location.pathname },
    });
  }, [hasChosenPlan, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasChosenPlan) return null;

  return <>{children}</>;
}

