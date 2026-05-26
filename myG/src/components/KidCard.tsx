import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MapPin, Shield, Clock, Phone, Navigation, MessageCircle } from "lucide-react";
import { EditKidModal } from "./EditKidModal";
import { DeleteKidDialog } from "./DeleteKidDialog";
import { Kid } from "@/types/kids";
import { useToast } from "@/hooks/use-toast";
import { EMERGENCY_PHONE_NUMBER } from "@/lib/constants";
import { openCall, openMessage } from "@/lib/contact";

interface KidCardProps {
  kid: Kid;
  onKidUpdated: () => void;
  /** When provided, "View Map" opens the in-app live map focused on this kid */
  onViewLiveMap?: (kidId: string | null) => void;
}

const statusConfig = {
  safe: {
    color: "bg-safe-zone",
    text: "Safe in Zone",
    icon: Shield,
  },
  warning: {
    color: "bg-warning-zone",
    text: "Near Boundary",
    icon: MapPin,
  },
  alert: {
    color: "bg-danger-zone",
    text: "Outside Zone",
    icon: MapPin,
  },
};

export function KidCard({ kid, onKidUpdated, onViewLiveMap }: KidCardProps) {
  const { name, age, status, location, lastSeen, avatar, zonesCount, latitude, longitude, phoneNumber } = kid;
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const { toast } = useToast();

  const handleViewMap = () => {
    if (onViewLiveMap) {
      onViewLiveMap(kid.id);
      return;
    }
    let mapsUrl: string;
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    } else {
      const encodedLocation = encodeURIComponent(location);
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    }
    window.open(mapsUrl, '_blank');
    toast({
      title: "Opening Map",
      description: typeof latitude === 'number' && typeof longitude === 'number'
        ? `Viewing ${name}'s coordinates: ${latitude}, ${longitude}`
        : `Viewing ${name}'s location: ${location}`,
    });
  };

  const handleCall = () => {
    const number = (phoneNumber || "").trim();
    if (!number) {
      toast({
        title: "No phone number",
        description: `Add ${name}'s phone number in Edit profile to call them.`,
        variant: "destructive",
      });
      return;
    }
    const ok = openCall(number);
    if (ok) {
      toast({ title: "Calling…", description: `Opening dialer for ${name}` });
    }
  };

  const handleMessage = () => {
    const number = (phoneNumber || "").trim();
    if (!number) {
      toast({
        title: "No phone number",
        description: `Add ${name}'s phone number in Edit profile to message them.`,
        variant: "destructive",
      });
      return;
    }
    const ok = openMessage(number);
    if (ok) {
      toast({ title: "Messaging…", description: `Opening messages for ${name}` });
    }
  };

  const handleEmergency = () => {
    const ok = openCall(EMERGENCY_PHONE_NUMBER);
    if (ok) {
      toast({ title: "Emergency call", description: "Opening dialer for emergency number." });
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-white font-semibold">
                {name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <p className="text-sm text-muted-foreground">Age {age}</p>
            </div>
          </div>
          <Badge
            className={`${config.color} text-white border-0 shadow-sm`}
            variant="secondary"
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Last seen {lastSeen}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {zonesCount} active zones
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="zone" 
            size="sm" 
            className="flex-1"
            onClick={handleViewMap}
          >
            <MapPin className="h-4 w-4" />
            View Map
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact {name}
                </DialogTitle>
                <DialogDescription>
                  Choose how you'd like to contact {name} or access emergency features.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={handleEmergency}
                  >
                    <Phone className="h-6 w-6 text-red-500" />
                    <span className="text-sm">Emergency</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={handleCall}
                  >
                    <Phone className="h-6 w-6 text-green-500" />
                    <span className="text-sm">Call</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={handleMessage}
                  >
                    <MessageCircle className="h-6 w-6 text-blue-500" />
                    <span className="text-sm">Message</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={handleViewMap}
                  >
                    <Navigation className="h-6 w-6 text-purple-500" />
                    <span className="text-sm">Navigate</span>
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    Current Status: <Badge className={config.color}>{config.text}</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last seen: {lastSeen} at {location}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex gap-2 pt-2">
          <EditKidModal kid={kid} onKidUpdated={onKidUpdated} />
          <DeleteKidDialog kid={kid} onKidDeleted={onKidUpdated} />
        </div>
      </CardContent>
    </Card>
  );
}
