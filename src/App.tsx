import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CatalogProvider } from "@/contexts/CatalogContext";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

// Lazy load admin components for better performance
import LoginPage from "./components/admin/LoginPage";
import AdminDashboard from "./components/admin/AdminDashboard";
import UploadCatalog from "./components/admin/UploadCatalog";
import EditCatalog from "./components/admin/EditCatalog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CatalogProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen bg-[#0f0f1a] text-[#05d9e8]">
                  Cargando aplicación...
                </div>
              }
            >

              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/admin/login" element={<LoginPage />} />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/upload"
                    element={
                      <ProtectedRoute>
                        <UploadCatalog />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/edit/:catalogId"
                    element={
                      <ProtectedRoute>
                        <EditCatalog />
                      </ProtectedRoute>
                    }
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </CatalogProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

