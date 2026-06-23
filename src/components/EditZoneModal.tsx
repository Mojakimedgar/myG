import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Settings, Clock } from "lucide-react";
import MapPicker from "@/components/MapPicker";
import { updateZone } from "@/lib/firestore";
import { Zone, ZoneType, UpdateZoneData, ActiveHours } from "@/types/zone";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface EditZoneModalProps {
  zone: Zone;
  onZoneUpdated: () => void;
  asIcon?: boolean;
}

export function EditZoneModal({ zone, onZoneUpdated, asIcon = false }: EditZoneModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [zoneGroups, setZoneGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState<UpdateZoneData & { status?: "safe" | "warning" | "alert" }>({
    name: zone.name,
    address: zone.address,
    latitude: zone.latitude,
    longitude: zone.longitude,
    radius: zone.radius,
    type: zone.type,
    totalKids: zone.totalKids,
    isActive: zone.isActive,
    groupId: zone.groupId,
    customLabel: zone.customLabel || "",
    activeHours: zone.activeHours || {
      enabled: false,
      startHour: 8,
      endHour: 18,
      daysOfWeek: [1, 2, 3, 4, 5],
    },
    status: "safe",
  });
  const { toast } = useToast();

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

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    setFormData({
      name: zone.name,
      address: zone.address,
      latitude: zone.latitude,
      longitude: zone.longitude,
      radius: zone.radius,
      type: zone.type,
      totalKids: zone.totalKids,
      isActive: zone.isActive,
      groupId: zone.groupId,
      activeHours: zone.activeHours || {
        enabled: false,
        startHour: 8,
        endHour: 18,
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      status: "safe",
    });
  }, [zone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.radius) return;
    setLoading(true);
    try {
      await updateZone(zone.id, formData);
      toast({ title: "Zone updated", description: `${formData.name} saved.` });
      setOpen(false);
      onZoneUpdated();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to update zone", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {asIcon ? (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">Edit Zone</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] max-h-[95vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2 pr-12">
          <DialogTitle>Edit Zone</DialogTitle>
          <DialogDescription>Update this safety zone configuration.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address/Description</Label>
            <Input id="address" value={formData.address || ""} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
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
            <Label htmlFor="radius">Radius (meters)</Label>
            <Input id="radius" type="number" min={10} value={formData.radius || 0} onChange={(e) => setFormData({ ...formData, radius: Number(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
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
              <Label htmlFor="edit-customLabel">Custom Label</Label>
              <Textarea
                id="edit-customLabel"
                placeholder="Enter a custom name or description for this zone"
                value={formData.customLabel || ""}
                onChange={(e) => setFormData({ ...formData, customLabel: e.target.value })}
                rows={3}
              />
            </div>
          )}
           <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "safe" | "warning" | "alert") => 
                handleInputChange("status", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="safe">Safe in Zone</SelectItem>
                <SelectItem value="warning">Near Boundary</SelectItem>
                <SelectItem value="alert">Outside Zone</SelectItem>
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
                id="edit-active-hours-enabled"
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
              <Label htmlFor="edit-active-hours-enabled" className="flex items-center gap-2 cursor-pointer">
                <Clock className="h-4 w-4" />
                Enable Active Hours
              </Label>
            </div>

            {formData.activeHours?.enabled && (
              <div className="space-y-4 pl-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-start-hour">Start Hour</Label>
                    <Input
                      id="edit-start-hour"
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
                    <Label htmlFor="edit-end-hour">End Hour</Label>
                    <Input
                      id="edit-end-hour"
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
                          id={`edit-day-${index}`}
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
                        <Label htmlFor={`edit-day-${index}`} className="cursor-pointer text-sm">
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
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


