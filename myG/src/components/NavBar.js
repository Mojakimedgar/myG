import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Menu, LogOut } from "lucide-react";
import { AddZoneModal } from "@/components/AddZoneModal";
import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { logOut, getCurrentUserProfile } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
export function Navbar({ onOpenSidebar, showSidebarButton }) {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const { toast } = useToast();
    useEffect(() => {
        const loadUser = async () => {
            const userProfile = await getCurrentUserProfile();
            setUser(userProfile);
        };
        loadUser();
    }, []);
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
    return (_jsx(_Fragment, { children: _jsx("nav", { className: "bg-card border-b border-border shadow-soft", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center h-16", children: [_jsxs("div", { className: "flex items-center gap-3", children: [showSidebarButton && (_jsx(Button, { variant: "ghost", size: "icon", onClick: onOpenSidebar, className: "sm:hidden", children: _jsx(Menu, { className: "h-5 w-5" }) })), _jsx("div", { className: "flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-lg", children: _jsx(Shield, { className: "h-6 w-6 text-white" }) }), _jsxs("div", { className: "flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h1", { className: "text-xl font-bold text-foreground", children: "MyG" }), user && (_jsx(Badge, { variant: "outline", className: "text-[10px] uppercase tracking-wide", children: user.role === "primary" ? "Primary User" : "Guardian" }))] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Family Safety Monitor" })] })] }), _jsxs("div", { className: "hidden sm:flex items-center gap-3", children: [user?.role === "guardian" && (_jsx(AddZoneModal, { onZoneAdded: () => { window.dispatchEvent(new Event("zone:refresh")); }, buttonLabel: "New Zone" })), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "gap-2", children: [_jsx(User, { className: "h-5 w-5" }), user?.displayName || "User", user?.subscriptionTier === "premium" && (_jsx(Badge, { variant: "secondary", className: "ml-1", children: "Premium" }))] }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuLabel, { children: _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { children: user?.displayName }), _jsx("span", { className: "text-xs text-muted-foreground", children: user?.email }), _jsx("span", { className: "text-xs text-muted-foreground capitalize", children: user?.role === "primary" ? "Primary User" : "Guardian" })] }) }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: handleLogout, children: [_jsx(LogOut, { className: "h-4 w-4 mr-2" }), "Logout"] })] })] })] })] }) }) }) }));
}
