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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/site" element={<LandingPage />} />
          <Route path="/manual" element={<ManualPage />} />
          <Route path="/crm" element={<CrmPage />} />
          <Route path="/apresentacao" element={<ApresentacaoPage />} />
          <Route path="/luiza" element={<LuizaElitePage />} />
          <Route path="/imagens" element={<ImagensPage />} />
          <Route path="/marketing" element={<MarketingIndex />} />
          <Route path="/marketing/auth" element={<MarketingAuth />} />
          <Route path="/marketing/settings" element={<MarketingSettings />} />
          <Route path="/marketing/reset-password" element={<MarketingResetPassword />} />
          <Route path="/relatorio-auditoria" element={<RelatorioAuditoriaPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
