import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Menu, LogOut } from "lucide-react";
import { AddZoneModal } from "@/components/AddZoneModal";
import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { logOut, getCurrentUserProfile } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { User as UserType } from "@/types/user";
import { useToast } from "@/hooks/use-toast";

interface NavbarProps {
  onOpenSidebar?: () => void;
  showSidebarButton?: boolean;
}

export function Navbar({ onOpenSidebar, showSidebarButton }: NavbarProps) {
  const [user, setUser] = useState<UserType | null>(null);
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log out",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <nav className="bg-card border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              {showSidebarButton && (
                <Button variant="ghost" size="icon" onClick={onOpenSidebar} className="sm:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">
                    MyG
                  </h1>
                  {user && (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      {user.role === "primary" ? "Primary User" : "Guardian"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Family Safety Monitor
                </p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-3">
              {user?.role === "guardian" && (
                <AddZoneModal onZoneAdded={() => { window.dispatchEvent(new Event("zone:refresh")); }} buttonLabel="New Zone" />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-5 w-5" />
                    {user?.displayName || "User"}
                    {user?.subscriptionTier === "premium" && (
                      <Badge variant="secondary" className="ml-1">Premium</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.displayName}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {user?.role === "primary" ? "Primary User" : "Guardian"}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
