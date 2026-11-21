import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import ManualPage from "./pages/ManualPage";
import NotFound from "./pages/NotFound";
import CrmPage from "./pages/CrmPage";
import ApresentacaoPage from "./pages/ApresentacaoPage";
import ImagensPage from "./pages/ImagensPage";
import LuizaElitePage from "./pages/LuizaElitePage";
import MarketingIndex from "./pages/marketing/MarketingIndex";
import MarketingAuth from "./pages/marketing/MarketingAuth";
import MarketingSettings from "./pages/marketing/MarketingSettings";
import MarketingResetPassword from "./pages/marketing/MarketingResetPassword";
import RelatorioAuditoriaPage from "./pages/RelatorioAuditoriaPage";
import { getActiveTenant, applyTenantTheme } from "@/lib/tenant";
import FirebaseErrorBoundary from "@/components/FirebaseErrorBoundary";
import { FirebaseProvider } from "@/contexts/FirebaseContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

// Rotas protegidas pelo HOC ProtectedRoute com verificação de autenticação, tenant_id e papel
const ProtectedCrmPage = ProtectedRoute(CrmPage, {
  allowedPapeis: ["master_adm", "admin_imobiliaria", "corretor"],
  requireTenantId: true,
});
const ProtectedApresentacaoPage = ProtectedRoute(ApresentacaoPage, {
  allowedPapeis: ["master_adm", "admin_imobiliaria", "corretor", "cliente"],
  requireTenantId: true,
});
const ProtectedLuizaElitePage = ProtectedRoute(LuizaElitePage, {
  allowedPapeis: ["master_adm", "admin_imobiliaria", "corretor"],
  requireTenantId: true,
});
const ProtectedImagensPage = ProtectedRoute(ImagensPage, {
  allowedPapeis: ["master_adm", "admin_imobiliaria", "corretor"],
  requireTenantId: true,
});
const ProtectedMarketingIndex = ProtectedRoute(MarketingIndex, {
  allowedPapeis: ["master_adm", "admin_imobiliaria", "corretor"],
  requireTenantId: true,
});
const ProtectedMarketingSettings = ProtectedRoute(MarketingSettings, {
  allowedPapeis: ["master_adm", "admin_imobiliaria"],
  requireTenantId: true,
});
const ProtectedRelatorioAuditoriaPage = ProtectedRoute(RelatorioAuditoriaPage, {
  allowedPapeis: ["master_adm", "admin_imobiliaria"],
  requireTenantId: true,
});

const App = () => {
  useEffect(() => {
    // Detect active tenant subdomain or preview local storage and apply the custom styling instantly!
    const activeTenant = getActiveTenant();
    applyTenantTheme(activeTenant);
  }, []);

  return (
    <FirebaseErrorBoundary>
      <FirebaseProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Index />} />
                <Route path="/site" element={<LandingPage />} />
                <Route path="/manual" element={<ManualPage />} />
                <Route path="/crm" element={<ProtectedCrmPage />} />
                <Route path="/apresentacao" element={<ProtectedApresentacaoPage />} />
                <Route path="/luiza" element={<ProtectedLuizaElitePage />} />
                <Route path="/imagens" element={<ProtectedImagensPage />} />
                <Route path="/marketing" element={<ProtectedMarketingIndex />} />
                <Route path="/marketing/auth" element={<MarketingAuth />} />
                <Route path="/marketing/settings" element={<ProtectedMarketingSettings />} />
                <Route path="/marketing/reset-password" element={<MarketingResetPassword />} />
                <Route path="/relatorio-auditoria" element={<ProtectedRelatorioAuditoriaPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </FirebaseProvider>
    </FirebaseErrorBoundary>
  );
};

export default App;
