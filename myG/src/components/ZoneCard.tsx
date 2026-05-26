import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Clock } from "lucide-react";
import { EditZoneModal } from "./EditZoneModal";
import { DeleteZoneDialog } from "./DeleteZoneDialog";
import { Zone } from "@/types/zone";

type ZoneCardProps = Zone;
interface ZoneCardExtraProps {
  onZoneUpdated?: () => void;
}

const zoneTypeConfig = {
  home: {
    color: "bg-safe-zone",
    label: "Home Zone",
  },
  school: {
    color: "bg-primary",
    label: "School Zone",
  },
  custom: {
    color: "bg-accent",
    label: "Custom Zone",
  },
};

export function ZoneCard(props: ZoneCardProps & ZoneCardExtraProps) {
  const { id, name, address, latitude, longitude, radius, type, activeKids, totalKids, createdAt, isActive, customLabel, onZoneUpdated } = props;
  const config = zoneTypeConfig[type];
  const createdLabel = createdAt instanceof Date ? createdAt.toLocaleString() : "";

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                className={`${config.color} text-white border-0 shadow-sm`}
                variant="secondary"
              >
                {config.label}
              </Badge>
              {!isActive && (
                <Badge variant="outline" className="text-muted-foreground">
                  Inactive
                </Badge>
              )}
            </div>
            {customLabel && (
              <p className="text-sm text-muted-foreground mt-2 italic">{customLabel}</p>
            )}
          </div>
          <div className="flex gap-1">
            <DeleteZoneDialog zone={{ id, name, address, latitude, longitude, radius, type, activeKids, totalKids, createdAt, isActive, createdBy: "" }} onZoneDeleted={onZoneUpdated || (() => {})} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
            </div>
            <span className="text-muted-foreground">{radius}m radius</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">
              {activeKids} of {totalKids} G's currently in zone
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created {createdLabel}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="zone"
            size="sm"
            className="flex-1"
            onClick={() => {
              let url: string;
              if (typeof latitude === 'number' && typeof longitude === 'number') {
                url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
              } else {
                url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
              }
              window.open(url, '_blank');
            }}
          >
            <MapPin className="h-4 w-4" />
            View on Map
          </Button>
          <EditZoneModal zone={{ id, name, address, latitude, longitude, radius, type, activeKids, totalKids, createdAt, isActive, createdBy: "" }} onZoneUpdated={onZoneUpdated || (() => {})} />
        </div>
      </CardContent>
    </Card>
  );
}
