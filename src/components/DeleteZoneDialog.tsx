import { Button } from "@/components/ui/button";
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
import { Trash2 } from "lucide-react";
import { deleteZone } from "@/lib/firestore";
import { Zone } from "@/types/zone";
import { useToast } from "@/hooks/use-toast";

interface DeleteZoneDialogProps {
  zone: Zone;
  onZoneDeleted: () => void;
}

export function DeleteZoneDialog({ zone, onZoneDeleted }: DeleteZoneDialogProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteZone(zone.id);
      toast({ title: "Zone deleted", description: `${zone.name} has been removed.` });
      onZoneDeleted();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to delete zone", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete zone?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the zone "{zone.name}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


