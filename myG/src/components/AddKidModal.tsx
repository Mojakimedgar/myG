import { useState } from "react";
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
import { Plus, User } from "lucide-react";
import MapPicker from "@/components/MapPicker";
import { addKid } from "@/lib/firestore";
import { CreateKidData } from "@/types/kids";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddKidModalProps {
  onKidAdded: () => void;
}

export function AddKidModal({ onKidAdded }: AddKidModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateKidData & { type?: string; status?: "safe" | "warning" | "alert" }>({
    name: "",
    age: 0,
    location: "",
    address: "",
    latitude: undefined,
    longitude: undefined,
    avatar: "",
    radius: undefined,
    phoneNumber: "",
    type: "custom",
    status: "safe",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid data.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Adding kid:", formData);
      const kidId = await addKid(formData);
      console.log("Kid added with ID:", kidId);
      toast({
        title: "Success!",
        description: `${formData.name} has been added successfully.`,
      });
      setFormData({ name: "", age: 0, location: "", address: "", latitude: undefined, longitude: undefined, avatar: "", radius: undefined, phoneNumber: "", type: "custom", status: "safe" });
      setOpen(false);
      console.log("Calling onGAdded callback");
      onKidAdded();
    } catch (error) {
      console.error("Error adding kid:", error);
      toast({
        title: "Error",
        description: "Failed to add G's profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add G's Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2 pr-12">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New G&apos;s Profile
          </DialogTitle>
          <DialogDescription>
            Create a new profile for your G to start monitoring their safety.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 min-h-0 px-6 space-y-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="name">G's Name *</Label>
            <Input
              id="name"
              value={formData.name}
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
          
          <div className="space-y-2">
            <Label htmlFor="location">Current Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="e.g., Home, School, Park"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address/Description *</Label>
            <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
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
            <Input id="radius" type="number" min={10} value={formData.radius} onChange={(e) => setFormData({ ...formData, radius: Number(e.target.value) || 0 })} />
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
          <div className="space-y-2">
            <Label htmlFor="type">Profile Type *</Label>
            <Select value={formData.type || "custom"} onValueChange={(v) => setFormData({ ...formData, type: v })}>
              <SelectTrigger id="type">
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
          </div>
          <DialogFooter className="shrink-0 border-t bg-muted/30 px-6 py-4 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
