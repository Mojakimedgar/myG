import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderPlus, Folder, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Zone, ZoneGroup } from "@/types/zone";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const ZoneGroupManager = ({ zones, onGroupUpdated }: { zones: Zone[]; onGroupUpdated: () => void }) => {
  const [groups, setGroups] = useState<ZoneGroup[]>([]);
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "zoneGroups"), (snapshot) => {
      const groupsData: ZoneGroup[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || "",
          description: data.description || "",
          zoneIds: data.zoneIds || [],
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });
      setGroups(groupsData);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "zoneGroups"), {
        name: groupName,
        description: groupDescription || "",
        zoneIds: [],
        createdAt: new Date(),
      });
      toast({
        title: "Group created",
        description: `${groupName} has been created`,
      });
      setGroupName("");
      setGroupDescription("");
      setOpen(false);
      onGroupUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddZoneToGroup = async (zoneId: string, groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const updatedZoneIds = [...group.zoneIds, zoneId];
    try {
      await updateDoc(doc(db, "zoneGroups", groupId), {
        zoneIds: updatedZoneIds,
      });
      
      // Update zone's groupId
      await updateDoc(doc(db, "zones", zoneId), {
        groupId,
      });
      
      toast({
        title: "Zone added to group",
      });
      onGroupUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add zone to group",
        variant: "destructive",
      });
    }
  };

  const handleRemoveZoneFromGroup = async (zoneId: string, groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const updatedZoneIds = group.zoneIds.filter((id) => id !== zoneId);
    try {
      await updateDoc(doc(db, "zoneGroups", groupId), {
        zoneIds: updatedZoneIds,
      });
      
      // Remove zone's groupId
      await updateDoc(doc(db, "zones", zoneId), {
        groupId: null,
      });
      
      toast({
        title: "Zone removed from group",
      });
      onGroupUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove zone from group",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Zone Groups</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Zone Group</DialogTitle>
              <DialogDescription>
                Group zones together for easier management
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name *</Label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., School Zones"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-description">Description</Label>
                <Input
                  id="group-description"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              <Button onClick={handleCreateGroup} disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No groups created yet</p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const groupZones = zones.filter((z) => z.id && group.zoneIds.includes(z.id));
            const ungroupedZones = zones.filter((z) => !z.groupId || z.groupId === "");

            return (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    {group.name}
                    <Badge variant="secondary">{groupZones.length} zones</Badge>
                  </CardTitle>
                  {group.description && (
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Add Zone to Group</Label>
                    <Select
                      onValueChange={(zoneId) => handleAddZoneToGroup(zoneId, group.id)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a zone to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {ungroupedZones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name}
                          </SelectItem>
                        ))}
                        {ungroupedZones.length === 0 && (
                          <SelectItem value="" disabled>
                            No ungrouped zones
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {groupZones.length > 0 && (
                    <div className="space-y-2">
                      <Label>Zones in this group</Label>
                      <div className="flex flex-wrap gap-2">
                        {groupZones.map((zone) => (
                          <Badge
                            key={zone.id}
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            {zone.name}
                            <button
                              onClick={() => handleRemoveZoneFromGroup(zone.id, group.id)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
