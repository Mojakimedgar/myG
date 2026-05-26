import { Card, CardContent } from "@/components/ui/card";
import { Shield, MapPin, Users, Clock } from "lucide-react";
import { Kid } from "@/types/kids";
import { Zone } from "@/types/zone";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "stable";
  variant?: "safe" | "warning" | "primary" | "accent";
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "primary",
}: StatCardProps) {
  const variantStyles = {
    safe: "from-safe-zone to-safe-zone/80",
    warning: "from-warning-zone to-accent",
    primary: "from-primary to-primary-glow",
    accent: "from-accent to-accent/80",
  };

  return (
    <Card className="border-0 shadow-soft hover:shadow-medium transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${variantStyles[variant]} shadow-lg group-hover:shadow-xl transition-all duration-300`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm font-medium text-foreground">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickStatsProps {
  kids: Kid[];
  zones: Zone[];
}

export function QuickStats({ kids, zones }: QuickStatsProps) {
  const kidsCount = kids.length;
  const safeCount = kids.filter((k) => k.status === "safe").length;
  const activeProfiles = kids.filter((k) => k.status !== "alert").length;
  const activeProfilesSubtitle =
    kidsCount > 0
      ? activeProfiles === kidsCount
        ? "All profiles active"
        : `${activeProfiles}/${kidsCount} profiles active`
      : "No profiles yet";

  const zonesCount = zones.length;
  const homeCount = zones.filter((z) => z.type === "home").length;
  const schoolCount = zones.filter((z) => z.type === "school").length;
  const customCount = zones.filter((z) => z.type === "custom").length;
  const zonesSubtitle =
    zonesCount > 0
      ? `${homeCount} home, ${schoolCount} school, ${customCount} custom`
      : "No zones yet";

  // Last Check calculation based on most recent kid.updatedAt
  const updatedDates = kids
    .map((k) => (k.updatedAt instanceof Date ? k.updatedAt : new Date(k.updatedAt)))
    .filter((d) => !isNaN(d.getTime()));
  const latestUpdate = updatedDates.length ? new Date(Math.max(...updatedDates.map((d) => d.getTime()))) : null;

  const now = new Date();
  let lastCheckValue = kidsCount > 0 ? "Just now" : "-";
  if (latestUpdate) {
    const diffMs = now.getTime() - latestUpdate.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin <= 0) lastCheckValue = "Just now";
    else if (diffMin < 60) lastCheckValue = `${diffMin}m`;
    else {
      const diffH = Math.floor(diffMin / 60);
      lastCheckValue = `${diffH}h`;
    }
  }

  // Consider a location "updated" if updated within last 5 minutes
  const freshThresholdMs = 5 * 60 * 1000;
  const freshCount = updatedDates.filter((d) => now.getTime() - d.getTime() <= freshThresholdMs).length;
  const lastCheckSubtitle =
    kidsCount === 0
      ? "Add a profile to start"
      : freshCount === kidsCount
      ? "All locations updated"
      : `${kidsCount - freshCount} need update`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="G's Safe"
        value={safeCount}
        subtitle={kidsCount > 0 ? `${safeCount}/${kidsCount} in safe zones` : "No data"}
        icon={Shield}
        variant="safe"
      />
      <StatCard
        title="Active Zones"
        value={zonesCount}
        subtitle={zonesSubtitle}
        icon={MapPin}
        variant="primary"
      />
      <StatCard
        title="Total G's"
        value={kidsCount}
        subtitle={activeProfilesSubtitle}
        icon={Users}
        variant="accent"
      />
      <StatCard
        title="Last Check"
        value={lastCheckValue}
        subtitle={lastCheckSubtitle}
        icon={Clock}
        variant="primary"
      />
    </div>
  );
}
