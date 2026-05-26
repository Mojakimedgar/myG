import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logOut } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, History, Mail, Shield, Info, AlertCircle, LogOut, Navigation } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { loadSettings, saveSettings } from "@/lib/settings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Activity } from "@/types/activity";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AppSidebarProps {
  activity: Activity[];
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  onToggle?: () => void;
  /** When used as controlled (e.g. from Navbar), pass trigger to open */
  trigger?: React.ReactNode;
  className?: string;
}

export function AppSidebar({
  activity,
  open: controlledOpen,
  onOpenChange,
  onToggle,
  trigger,
  className,
}: AppSidebarProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };

  const settings = loadSettings();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { isEnabled: notificationsEnabled, enableNotifications } = useNotifications();

  const formatActivityTime = (createdAt: Date | unknown) => {
    const d = createdAt instanceof Date ? createdAt : new Date(createdAt as string);
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff <= 0) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `${h}h ago`;
    const day = Math.floor(h / 24);
    return `${day}d ago`;
  };

  const navButtonClass =
    "justify-start gap-3 h-10 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors";

  const handleLogout = async () => {
    try {
      await logOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-4 py-5 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-sm">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-foreground tracking-tight">MyG</p>
          <p className="text-[11px] text-muted-foreground">Family Safety</p>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1 py-3">
        <nav className="grid gap-0.5 px-2">
          <Button
            variant="ghost"
            className={navButtonClass}
            onClick={() => {
              setSettingsOpen(true);
              if (isMobile) setOpen(false);
            }}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Settings
          </Button>
          <Button
            variant="ghost"
            className={navButtonClass}
            onClick={() => {
              setNotificationsOpen(true);
              if (isMobile) setOpen(false);
            }}
          >
            <Bell className="h-4 w-4 shrink-0" />
            Notifications
            {activity.length > 0 && (
              <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                {activity.length > 9 ? "9+" : activity.length}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            className={navButtonClass}
            onClick={() => {
              setHistoryOpen(true);
              if (isMobile) setOpen(false);
            }}
          >
            <History className="h-4 w-4 shrink-0" />
            History
          </Button>
          <Button
            variant="ghost"
            className={navButtonClass}
            onClick={() => {
              navigate("/route-tracking");
              if (isMobile) setOpen(false);
            }}
          >
            <Navigation className="h-4 w-4 shrink-0" />
            Route Tracking
          </Button>
          <Separator className="my-3" />
          <Button
            variant="ghost"
            className={navButtonClass}
            onClick={() => {
              setContactOpen(true);
              if (isMobile) setOpen(false);
            }}
          >
            <Mail className="h-4 w-4 shrink-0" />
            Contact Us
          </Button>
          <Button
            variant="ghost"
            className={navButtonClass}
            onClick={() => {
              setAboutOpen(true);
              if (isMobile) setOpen(false);
            }}
          >
            <Info className="h-4 w-4 shrink-0" />
            About
          </Button>
          {/* Logout button inside nav so it scrolls on mobile */}
          <Button
            variant="ghost"
            className={cn(navButtonClass, "w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10")}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </Button>
        </nav>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          {trigger}
          {/* @ts-ignore - SheetContent typing mismatch from Radix typings */}
          <SheetContent side="left" className="p-0 w-[300px] sm:max-w-[85vw] border-r bg-card/95 backdrop-blur">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      ) : (
        <aside
          className={cn(
            "w-[260px] shrink-0 border-r border-border bg-card flex flex-col shadow-sm",
            className
          )}
        >
          {sidebarContent}
        </aside>
      )}

      {/* Settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Configure geofencing and activity display.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="geofencing">Geofencing</Label>
              <Switch
                id="geofencing"
                checked={settings.geofencingEnabled}
                onCheckedChange={(checked) => {
                  saveSettings({ geofencingEnabled: checked });
                  setSettingsOpen(false);
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="activity-limit">Activity limit</Label>
              <span className="text-sm text-muted-foreground">{settings.activityLimit}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              History
            </DialogTitle>
            <DialogDescription>
              Recent activities
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 py-2">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
            ) : (
              activity.slice(0, 30).map((a) => {
                const dotColor =
                  a.severity === "danger"
                    ? "bg-red-500"
                    : a.severity === "warning"
                      ? "bg-amber-500"
                      : a.severity === "safe"
                        ? "bg-emerald-500"
                        : "bg-primary";
                return (
                  <div
                    key={a.id}
                    className="flex gap-3 rounded-lg p-3 bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", dotColor)} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.type} · {a.severity} · {formatActivityTime(a.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications dialog */}
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </DialogTitle>
            <DialogDescription>
              Recent activity and alerts
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Browser Notification Settings */}
            <div className="border-b pb-4">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="push-notifications" className="font-medium">
                  Browser Notifications
                </Label>
                <Switch
                  id="push-notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={async () => {
                    await enableNotifications();
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {notificationsEnabled 
                  ? "Receiving browser notifications for safety alerts and important events"
                  : "Click the toggle to receive notifications on your device"}
              </p>
              {!notificationsEnabled && (
                <Alert className="mt-3 bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-xs">
                    Enable notifications to get instant alerts for safety checks and zone breaches.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Activity List */}
            <div>
              <Label className="font-medium text-sm mb-3 block">Recent Activity</Label>
              <div className="max-h-[40vh] overflow-y-auto space-y-2">
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No notifications</p>
                ) : (
                  activity.slice(0, 20).map((a) => {
                    const dotColor =
                      a.severity === "danger"
                        ? "bg-red-500"
                        : a.severity === "warning"
                          ? "bg-amber-500"
                          : a.severity === "safe"
                            ? "bg-emerald-500"
                            : "bg-primary";
                    return (
                      <div
                        key={a.id}
                        className="flex gap-3 rounded-lg p-3 bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", dotColor)} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{a.message}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {a.type} · {a.severity} · {formatActivityTime(a.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Us dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Us</DialogTitle>
            <DialogDescription>
              Get in touch with MyG support. For emergencies, use the Emergency button in the contact dialog for your G.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Email: support@mygsalema.co.za
            </p>
            <p className="text-sm text-muted-foreground">
              Emergency number is available in each G&apos;s contact dialog.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* About dialog */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>About MyG</DialogTitle>
            <DialogDescription>
              MyG is a family safety monitor application that helps you track your G&apos;s, monitor zones, and receive real-time activity notifications for enhanced safety and peace of mind.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
