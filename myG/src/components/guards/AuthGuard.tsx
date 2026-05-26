import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthChange } from "@/lib/auth";
import { requestNotificationPermission } from "@/lib/notifications";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard = ({ children, requireAuth = true }: AuthGuardProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        // Firebase user is present – allow access
        setIsAuthenticated(true);
        
        // Request notification permissions for authenticated user
        requestNotificationPermission().catch((error) => {
          console.warn("Failed to request notification permission:", error);
        });
        
        setLoading(false);
      } else {
        // No Firebase user – redirect to auth if required
        setIsAuthenticated(false);
        setLoading(false);
        if (requireAuth) {
          navigate("/auth");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, requireAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect to /auth
  }

  return <>{children}</>;
};
