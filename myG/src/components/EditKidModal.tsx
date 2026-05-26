import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, User } from "lucide-react";
import MapPicker from "@/components/MapPicker";
import { updateKid, updateUserLocation } from "@/lib/firestore";
import { getCurrentUser } from "@/lib/auth";
import { Kid, UpdateKidData } from "@/types/kids";
import { useToast } from "@/hooks/use-toast";

interface EditKidModalProps {
  kid: Kid;
  onKidUpdated: () => void;
}

export function EditKidModal({ kid, onKidUpdated }: EditKidModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateKidData>({
    name: kid.name,
    age: kid.age,
    location: kid.location,
    address: "",
    latitude: kid.latitude,
    longitude: kid.longitude,
    avatar: kid.avatar || "",
    radius: undefined,
    status: kid.status,
    phoneNumber: kid.phoneNumber || "",
  });
  const { toast } = useToast();

  useEffect(() => {
    setFormData({
      name: kid.name,
      age: kid.age,
      location: kid.location,
      address: "",
      latitude: kid.latitude,
      longitude: kid.longitude,
      avatar: kid.avatar || "",
      radius: undefined,
      status: kid.status,
      phoneNumber: kid.phoneNumber || "",
    });
  }, [kid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentUserId = getCurrentUser()?.uid;
    const isMonitoredUser = kid.parentId && kid.parentId !== currentUserId;

    // For actual kids, require name and age. For monitored users, only require location.
    if (isMonitoredUser) {
      if (!formData.location) {
        toast({
          title: "Validation Error",
          description: "Please fill in the location field.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!formData.name || !formData.location) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields with valid data.",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Check if this is a monitored user (when guardian is editing primary user)
      // or an actual kid. Monitored users have parentId !== currentUserId.

      if (isMonitoredUser) {
        // This is a monitored primary user - update user document
        // Only allow updating location/address for monitored users
        await updateUserLocation(
          kid.id,
          formData.latitude || kid.latitude,
          formData.longitude || kid.longitude,
          formData.location
        );
      } else {
        // This is an actual kid - update myG document
        await updateKid(kid.id, formData);
      }

      toast({
        title: "Success!",
        description: `${formData.name}'s profile has been updated successfully.`,
      });
      setOpen(false);
      onKidUpdated();
    } catch (error) {
      console.error("Error updating kid:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateKidData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[95vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2 pr-12">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit {kid.parentId === getCurrentUser()?.uid ? "G" : "User"}&apos;s Profile
          </DialogTitle>
          <DialogDescription>
            Update the information for {kid.name}&apos;s profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {kid.parentId === getCurrentUser()?.uid && (
            <>
          <div className="space-y-2">
            <Label htmlFor="name">G&apos;s Name *</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter G's full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={formData.age || ""}
              onChange={(e) => handleInputChange("age", parseInt(e.target.value) || 0)}
              placeholder="Enter G's age"
            />
          </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="location">Current Location *</Label>
            <Input
              id="location"
              value={formData.location || ""}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="e.g., Home, School, Park"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address/Description *</Label>
            <Input id="address" value={formData.address || ""} onChange={(e) => handleInputChange("address", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Location Coordinates</Label>
            <MapPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              address={formData.address}
              radius={formData.radius}
              onChange={(lat, lng) => {
                handleInputChange("latitude", lat);
                handleInputChange("longitude", lng);
              }}
              height="220px"
            />
            <div className="flex items-center gap-4 text-sm mt-2">
              <div>Lat: {formData.latitude ?? "—"}</div>
              <div>Lng: {formData.longitude ?? "—"}</div>
              <Button type="button" variant="outline" onClick={() => {
                handleInputChange("latitude", undefined);
                handleInputChange("longitude", undefined);
              }}>
                Clear
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="radius">Radius (meters) *</Label>
            <Input id="radius" type="number" min={10} value={formData.radius || ""} onChange={(e) => handleInputChange("radius", e.target.value === "" ? undefined : Number(e.target.value) || 0)} />
          </div>
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
          
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number (for Call / Message)</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber || ""}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              placeholder="e.g. +27123456789"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar URL (Optional)</Label>
            <Input
              id="avatar"
              value={formData.avatar || ""}
              onChange={(e) => handleInputChange("avatar", e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          </div>
          <DialogFooter className="shrink-0 border-t bg-muted/30 px-6 py-4 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
