import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { RouteTrackingPage } from "./pages/RouteTracking";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { SubscriptionGuard } from "@/components/guards/SubscriptionGuard";
import SubscriptionPage from "./pages/Subscription";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/subscription"
            element={
              <AuthGuard>
                <SubscriptionPage />
              </AuthGuard>
            }
          />
          <Route
            path="/"
            element={
              <AuthGuard>
                <SubscriptionGuard>
                  <Index />
                </SubscriptionGuard>
              </AuthGuard>
            }
          />
          <Route
            path="/route-tracking"
            element={
              <AuthGuard>
                <SubscriptionGuard>
                  <RouteTrackingPage />
                </SubscriptionGuard>
              </AuthGuard>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
