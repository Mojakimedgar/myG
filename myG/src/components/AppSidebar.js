import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
export function AppSidebar({ activity, open: controlledOpen, onOpenChange, onToggle, trigger, className, }) {
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [internalOpen, setInternalOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = (v) => {
        if (onOpenChange)
            onOpenChange(v);
        else
            setInternalOpen(v);
    };
    const settings = loadSettings();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const { isEnabled: notificationsEnabled, enableNotifications } = useNotifications();
    const formatActivityTime = (createdAt) => {
        const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
        const diff = Math.floor((Date.now() - d.getTime()) / 60000);
        if (diff <= 0)
            return "Just now";
        if (diff < 60)
            return `${diff}m ago`;
        const h = Math.floor(diff / 60);
        if (h < 24)
            return `${h}h ago`;
        const day = Math.floor(h / 24);
        return `${day}d ago`;
    };
    const navButtonClass = "justify-start gap-3 h-10 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors";
    const handleLogout = async () => {
        try {
            await logOut();
            toast({
                title: "Logged out",
                description: "You have been successfully logged out",
            });
            navigate("/auth");
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to log out",
                variant: "destructive",
            });
        }
    };
    const sidebarContent = (_jsxs("div", { className: "flex flex-col h-full", children: [_jsxs("div", { className: "flex items-center gap-2.5 px-4 py-5 shrink-0", children: [_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-sm", children: _jsx(Shield, { className: "h-5 w-5 text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-foreground tracking-tight", children: "MyG" }), _jsx("p", { className: "text-[11px] text-muted-foreground", children: "Family Safety" })] })] }), _jsx(Separator, {}), _jsx(ScrollArea, { className: "flex-1 py-3", children: _jsxs("nav", { className: "grid gap-0.5 px-2", children: [_jsxs(Button, { variant: "ghost", className: navButtonClass, onClick: () => {
                                setSettingsOpen(true);
                                if (isMobile)
                                    setOpen(false);
                            }, children: [_jsx(Settings, { className: "h-4 w-4 shrink-0" }), "Settings"] }), _jsxs(Button, { variant: "ghost", className: navButtonClass, onClick: () => {
                                setNotificationsOpen(true);
                                if (isMobile)
                                    setOpen(false);
                            }, children: [_jsx(Bell, { className: "h-4 w-4 shrink-0" }), "Notifications", activity.length > 0 && (_jsx("span", { className: "ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary", children: activity.length > 9 ? "9+" : activity.length }))] }), _jsxs(Button, { variant: "ghost", className: navButtonClass, onClick: () => {
                                setHistoryOpen(true);
                                if (isMobile)
                                    setOpen(false);
                            }, children: [_jsx(History, { className: "h-4 w-4 shrink-0" }), "History"] }), _jsxs(Button, { variant: "ghost", className: navButtonClass, onClick: () => {
                                navigate("/route-tracking");
                                if (isMobile)
                                    setOpen(false);
                            }, children: [_jsx(Navigation, { className: "h-4 w-4 shrink-0" }), "Route Tracking"] }), _jsx(Separator, { className: "my-3" }), _jsxs(Button, { variant: "ghost", className: navButtonClass, onClick: () => {
                                setContactOpen(true);
                                if (isMobile)
                                    setOpen(false);
                            }, children: [_jsx(Mail, { className: "h-4 w-4 shrink-0" }), "Contact Us"] }), _jsxs(Button, { variant: "ghost", className: navButtonClass, onClick: () => {
                                setAboutOpen(true);
                                if (isMobile)
                                    setOpen(false);
                            }, children: [_jsx(Info, { className: "h-4 w-4 shrink-0" }), "About"] }), _jsxs(Button, { variant: "ghost", className: cn(navButtonClass, "w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"), onClick: handleLogout, children: [_jsx(LogOut, { className: "h-4 w-4 shrink-0" }), "Logout"] })] }) })] }));
    return (_jsxs(_Fragment, { children: [isMobile ? (_jsxs(Sheet, { open: open, onOpenChange: setOpen, children: [trigger, _jsxs(SheetContent, { side: "left", className: "p-0 w-[300px] sm:max-w-[85vw] border-r bg-card/95 backdrop-blur", children: [_jsx(SheetHeader, { className: "sr-only", children: _jsx(SheetTitle, { children: "Menu" }) }), sidebarContent] })] })) : (_jsx("aside", { className: cn("w-[260px] shrink-0 border-r border-border bg-card flex flex-col shadow-sm", className), children: sidebarContent })), _jsx(Dialog, { open: settingsOpen, onOpenChange: setSettingsOpen, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Settings" }), _jsx(DialogDescription, { children: "Configure geofencing and activity display." })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "geofencing", children: "Geofencing" }), _jsx(Switch, { id: "geofencing", checked: settings.geofencingEnabled, onCheckedChange: (checked) => {
                                                saveSettings({ geofencingEnabled: checked });
                                                setSettingsOpen(false);
                                            } })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "activity-limit", children: "Activity limit" }), _jsx("span", { className: "text-sm text-muted-foreground", children: settings.activityLimit })] })] })] }) }), _jsx(Dialog, { open: historyOpen, onOpenChange: setHistoryOpen, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(History, { className: "h-5 w-5" }), "History"] }), _jsx(DialogDescription, { children: "Recent activities" })] }), _jsx("div", { className: "max-h-[60vh] overflow-y-auto space-y-2 py-2", children: activity.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground py-4 text-center", children: "No recent activity" })) : (activity.slice(0, 30).map((a) => {
                                const dotColor = a.severity === "danger"
                                    ? "bg-red-500"
                                    : a.severity === "warning"
                                        ? "bg-amber-500"
                                        : a.severity === "safe"
                                            ? "bg-emerald-500"
                                            : "bg-primary";
                                return (_jsxs("div", { className: "flex gap-3 rounded-lg p-3 bg-muted/50 hover:bg-muted transition-colors", children: [_jsx("div", { className: cn("mt-1 h-2 w-2 shrink-0 rounded-full", dotColor) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "font-medium text-sm", children: a.message }), _jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [a.type, " \u00B7 ", a.severity, " \u00B7 ", formatActivityTime(a.createdAt)] })] })] }, a.id));
                            })) })] }) }), _jsx(Dialog, { open: notificationsOpen, onOpenChange: setNotificationsOpen, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Bell, { className: "h-5 w-5" }), "Notifications"] }), _jsx(DialogDescription, { children: "Recent activity and alerts" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "border-b pb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(Label, { htmlFor: "push-notifications", className: "font-medium", children: "Browser Notifications" }), _jsx(Switch, { id: "push-notifications", checked: notificationsEnabled, onCheckedChange: async () => {
                                                        await enableNotifications();
                                                    } })] }), _jsx("p", { className: "text-xs text-muted-foreground", children: notificationsEnabled
                                                ? "Receiving browser notifications for safety alerts and important events"
                                                : "Click the toggle to receive notifications on your device" }), !notificationsEnabled && (_jsxs(Alert, { className: "mt-3 bg-amber-50 border-amber-200", children: [_jsx(AlertCircle, { className: "h-4 w-4 text-amber-600" }), _jsx(AlertDescription, { className: "text-amber-800 text-xs", children: "Enable notifications to get instant alerts for safety checks and zone breaches." })] }))] }), _jsxs("div", { children: [_jsx(Label, { className: "font-medium text-sm mb-3 block", children: "Recent Activity" }), _jsx("div", { className: "max-h-[40vh] overflow-y-auto space-y-2", children: activity.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground py-4 text-center", children: "No notifications" })) : (activity.slice(0, 20).map((a) => {
                                                const dotColor = a.severity === "danger"
                                                    ? "bg-red-500"
                                                    : a.severity === "warning"
                                                        ? "bg-amber-500"
                                                        : a.severity === "safe"
                                                            ? "bg-emerald-500"
                                                            : "bg-primary";
                                                return (_jsxs("div", { className: "flex gap-3 rounded-lg p-3 bg-muted/50 hover:bg-muted transition-colors", children: [_jsx("div", { className: cn("mt-1 h-2 w-2 shrink-0 rounded-full", dotColor) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "font-medium text-sm", children: a.message }), _jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [a.type, " \u00B7 ", a.severity, " \u00B7 ", formatActivityTime(a.createdAt)] })] })] }, a.id));
                                            })) })] })] })] }) }), _jsx(Dialog, { open: contactOpen, onOpenChange: setContactOpen, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Contact Us" }), _jsx(DialogDescription, { children: "Get in touch with MyG support. For emergencies, use the Emergency button in the contact dialog for your G." })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Email: support@mygsalema.co.za" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Emergency number is available in each G's contact dialog." })] })] }) }), _jsx(Dialog, { open: aboutOpen, onOpenChange: setAboutOpen, children: _jsx(DialogContent, { children: _jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "About MyG" }), _jsx(DialogDescription, { children: "MyG is a family safety monitor application that helps you track your G's, monitor zones, and receive real-time activity notifications for enhanced safety and peace of mind." })] }) }) })] }));
}
