import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Crown, Loader2, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/auth";
import { updateUserProfile } from "@/lib/users";
import { SUBSCRIPTION_LIMITS } from "@/lib/subscription";

type LocationState = { from?: string } | null;

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleLabel, setRoleLabel] = useState<string>("your account");

  const fromPath = useMemo(() => {
    const s = location.state as LocationState;
    return s?.from || "/";
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getCurrentUserProfile();
        if (!profile) return;
        if (!cancelled) {
          setRoleLabel(profile.role === "guardian" ? "your Guardian (MYG) account" : "your Primary User account");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fromPath, navigate]);

  const choosePlan = async (tier: "free" | "premium") => {
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
    } catch (err: any) {
      console.error("Failed to save subscription choice", err);
      toast({
        title: "Couldn't save your choice",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const startPaidCheckout = async (plan: "basic" | "family" | "premium") => {
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

      const data = (await res.json()) as { checkoutUrl?: string };
      if (!data.checkoutUrl) {
        throw new Error("Billing service did not return a checkout URL.");
      }

      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error("Failed to start paid checkout", err);
      toast({
        title: "Couldn't start payment",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 justify-center text-primary font-semibold text-lg">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-4 w-4" />
            </span>
            <span>Salema</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold">
              Choose a Plan to Protect Your Children
            </h1>
            <p className="text-muted-foreground">
              Before you set up safe zones or link MYGs, pick what works best for{" "}
              {roleLabel}.
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-card/80">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Choose a Plan to Protect Your Children</CardTitle>
                <CardDescription>
                  Start free, then upgrade as your family&apos;s needs grow.
                </CardDescription>
              </div>
              <Badge className="bg-gradient-to-r from-primary to-primary-glow text-white border-0">
                Most families pick Family
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[720px] rounded-2xl border bg-background/80 shadow-sm">
                <div className="grid grid-cols-5 text-sm">
                  {/* Header row */}
                  <div className="bg-muted/60 px-4 py-4 font-medium text-muted-foreground">
                    Plan
                  </div>
                  <div className="px-4 py-4 text-center font-semibold">Free</div>
                  <div className="px-4 py-4 text-center font-semibold">Basic</div>
                  <div className="relative px-4 py-4 text-center font-semibold">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-amber-400 text-amber-950 border-0 text-[10px] px-2 py-0.5">
                        Popular
                      </Badge>
                    </div>
                    Family
                  </div>
                  <div className="px-4 py-4 text-center font-semibold flex items-center justify-center gap-1">
                    Premium
                    <Crown className="h-4 w-4 text-primary" />
                  </div>

                  {/* Price row */}
                  <div className="bg-muted/60 px-4 py-3 font-medium text-muted-foreground">
                    Price / month
                  </div>
                  <div className="px-4 py-3 text-center font-bold">R0</div>
                  <div className="px-4 py-3 text-center font-bold text-primary">R49</div>
                  <div className="px-4 py-3 text-center font-bold text-orange-500">
                    R129
                  </div>
                  <div className="px-4 py-3 text-center font-bold text-primary">
                    R249
                  </div>

                  {/* Children row */}
                  <div className="bg-muted/60 px-4 py-3 font-medium text-muted-foreground">
                    Children
                  </div>
                  <div className="px-4 py-3 text-center">1</div>
                  <div className="px-4 py-3 text-center">1</div>
                  <div className="px-4 py-3 text-center">3</div>
                  <div className="px-4 py-3 text-center">Unlimited</div>

                  {/* Zones row */}
                  <div className="bg-muted/60 px-4 py-3 font-medium text-muted-foreground">
                    Zones
                  </div>
                  <div className="px-4 py-3 text-center">
                    {SUBSCRIPTION_LIMITS.free.maxZones}
                  </div>
                  <div className="px-4 py-3 text-center">5</div>
                  <div className="px-4 py-3 text-center">15</div>
                  <div className="px-4 py-3 text-center">Unlimited</div>

                  {/* Travel history row */}
                  <div className="bg-muted/60 px-4 py-3 font-medium text-muted-foreground">
                    Travel history
                  </div>
                  <div className="px-4 py-3 text-center">24 h</div>
                  <div className="px-4 py-3 text-center">7 days</div>
                  <div className="px-4 py-3 text-center">30 days</div>
                  <div className="px-4 py-3 text-center">90 days</div>

                  {/* Alerts row */}
                  <div className="bg-muted/60 px-4 py-3 font-medium text-muted-foreground">
                    Alerts
                  </div>
                  <div className="px-4 py-3 text-center">Basic</div>
                  <div className="px-4 py-3 text-center">Select</div>
                  <div className="px-4 py-3 text-center">Real-time</div>
                  <div className="px-4 py-3 text-center">Advanced</div>

                  {/* CTA row */}
                  <div className="bg-muted/60 px-4 py-4 font-medium text-muted-foreground">
                    &nbsp;
                  </div>
                  <div className="px-4 py-4 flex justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full max-w-[120px]"
                      onClick={() => choosePlan("free")}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Select"}
                    </Button>
                  </div>
                  <div className="px-4 py-4 flex justify-center">
                    <Button
                      size="sm"
                      className="w-full max-w-[120px]"
                      variant="outline"
                      onClick={() => startPaidCheckout("basic")}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Select"}
                    </Button>
                  </div>
                  <div className="px-4 py-4 flex justify-center">
                    <Button
                      size="sm"
                      className="w-full max-w-[120px] bg-gradient-to-r from-primary to-primary-glow text-white border-0"
                      onClick={() => startPaidCheckout("family")}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Select"}
                    </Button>
                  </div>
                  <div className="px-4 py-4 flex justify-center">
                    <Button
                      size="sm"
                      className="w-full max-w-[120px]"
                      onClick={() => startPaidCheckout("premium")}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Select"}
                    </Button>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-muted-foreground text-center">
                After payment, your billing backend should update the MYG account
                subscription tier based on the completed plan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

