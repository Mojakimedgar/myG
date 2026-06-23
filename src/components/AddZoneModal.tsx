
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, Clock } from "lucide-react";
import MapPicker from "@/components/MapPicker";
import { addZone } from "@/lib/firestore";
import { CreateZoneData, ZoneType, ActiveHours } from "@/types/zone";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";
import { Checkbox } from "@/components/ui/checkbox";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { ZoneGroup } from "@/types/zone";
import { Textarea } from "@/components/ui/textarea";

interface AddZoneModalProps {
  onZoneAdded: () => void;
  buttonLabel?: string;
}

export function AddZoneModal({ onZoneAdded, buttonLabel = "New Zone" }: AddZoneModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [zoneGroups, setZoneGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState<CreateZoneData & { status?: "safe" | "warning" | "alert" }>({
    name: "",
    address: "",
    latitude: undefined,
    longitude: undefined,
    radius: 100,
    type: "home",
    customLabel: "",
    totalKids: 0,
    isActive: true,
    activeHours: {
      enabled: false,
      startHour: 8,
      endHour: 18,
      daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
    },
    createdBy: "",
    status: "safe",
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    const loadGroups = async () => {
      const snapshot = await getDocs(collection(db, "zoneGroups"));
      const groups = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || "",
      }));
      setZoneGroups(groups);
    };
    if (open) {
      loadGroups();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.radius) {
      toast({ title: "Validation error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to create zones", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      await addZone({
        ...formData,
        createdBy: currentUser.uid,
      });
      toast({ title: "Zone created", description: `${formData.name} has been added.` });
      setOpen(false);
      onZoneAdded();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to create zone", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Allow opening the modal programmatically (optional)
  // e.g., window.dispatchEvent(new Event("zone:add"))
  // This helps if any parent wants to trigger it imperatively.
  if (typeof window !== "undefined") {
    window.addEventListener("zone:add", () => setOpen(true), { once: true });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="safety" className="text-base px-4 relative z-10" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] max-h-[95vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2 pr-12">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Create Safety Zone
          </DialogTitle>
          <DialogDescription>Define a boundary and its type.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address/Description *</Label>
            <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <MapPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              address={formData.address}
              radius={formData.radius}
              onChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
              height="220px"
            />
            <div className="flex items-center gap-4 text-sm mt-2">
              <div>Lat: {formData.latitude ?? "—"}</div>
              <div>Lng: {formData.longitude ?? "—"}</div>
              <Button type="button" variant="outline" onClick={() => setFormData({ ...formData, latitude: undefined, longitude: undefined })}>
                Clear
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="radius">Radius (meters) *</Label>
            <Input id="radius" type="number" min={10} value={formData.radius} onChange={(e) => setFormData({ ...formData, radius: Number(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2">
            <Label>Type *</Label>
            <Select value={formData.type} onValueChange={(v: ZoneType) => setFormData({ ...formData, type: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="customLabel">Custom Label (optional)</Label>
              <Textarea
                id="customLabel"
                placeholder="Describe this custom zone (e.g. 'Park where kids meet')"
                value={formData.customLabel || ""}
                onChange={(e) => setFormData({ ...formData, customLabel: e.target.value })}
                rows={3}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status || "safe"}
              onValueChange={(value: "safe" | "warning" | "alert") => 
                handleInputChange("status", value)
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="safe">Safe Zone</SelectItem>
                <SelectItem value="warning">Warning Zone</SelectItem>
                <SelectItem value="alert">Alert Zone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {zoneGroups.length > 0 && (
            <div className="space-y-2">
              <Label>Zone Group (Optional)</Label>
              <Select
                value={formData.groupId || ""}
                onValueChange={(groupId) => setFormData({ ...formData, groupId: groupId || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a group (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {zoneGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active-hours-enabled"
                checked={formData.activeHours?.enabled || false}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    activeHours: {
                      ...formData.activeHours!,
                      enabled: checked as boolean,
                    },
                  })
                }
              />
              <Label htmlFor="active-hours-enabled" className="flex items-center gap-2 cursor-pointer">
                <Clock className="h-4 w-4" />
                Enable Active Hours
              </Label>
            </div>

            {formData.activeHours?.enabled && (
              <div className="space-y-4 pl-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-hour">Start Hour</Label>
                    <Input
                      id="start-hour"
                      type="number"
                      min="0"
                      max="23"
                      value={formData.activeHours?.startHour || 8}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          activeHours: {
                            ...formData.activeHours!,
                            startHour: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-hour">End Hour</Label>
                    <Input
                      id="end-hour"
                      type="number"
                      min="0"
                      max="23"
                      value={formData.activeHours?.endHour || 18}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          activeHours: {
                            ...formData.activeHours!,
                            endHour: parseInt(e.target.value) || 23,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Active Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${index}`}
                          checked={formData.activeHours?.daysOfWeek?.includes(index) || false}
                          onCheckedChange={(checked) => {
                            const currentDays = formData.activeHours?.daysOfWeek || [];
                            const newDays = checked
                              ? [...currentDays, index]
                              : currentDays.filter((d) => d !== index);
                            setFormData({
                              ...formData,
                              activeHours: {
                                ...formData.activeHours!,
                                daysOfWeek: newDays.sort(),
                              },
                            });
                          }}
                        />
                        <Label htmlFor={`day-${index}`} className="cursor-pointer text-sm">
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
          <DialogFooter className="shrink-0 border-t bg-muted/30 px-6 py-4 gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
