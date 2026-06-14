import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Columns3, ListTodo, BarChart3, Plus, Search, ExternalLink, LogOut, Building2 } from "lucide-react";
import { fetchLeads as fetchLeadsApi } from "@/lib/crmApi";
import { checkLoginValid, getUserEmail } from "@/lib/eliteUtils";
import CrmLeadForm from "@/components/crm/CrmLeadForm";
import CrmLeadsList from "@/components/crm/CrmLeadsList";
import CrmKanban from "@/components/crm/CrmKanban";
import CrmTasks from "@/components/crm/CrmTasks";
import CrmReports from "@/components/crm/CrmReports";
import CrmConstrutoras from "@/components/crm/CrmConstrutoras";
import CrmCadastro from "@/components/crm/CrmCadastro";
import LoginScreen from "@/components/LoginScreen";

import { setLoginDate } from "@/lib/eliteUtils";

const CrmPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(checkLoginValid);
  const [leads, setLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("construtoras");

  const fetchLeads = useCallback(async () => {
    try {
      const data = await fetchLeadsApi();
      setLeads(data || []);
    } catch (err) {
      console.error("CrmPage.fetchLeads error:", err);
      setLeads([]);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchLeads();
  }, [isLoggedIn, fetchLeads]);

  // Periodic refresh (realtime channel removed: data flows through crm-api edge function)
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, fetchLeads]);

  const handleLogin = () => {
    setLoginDate();
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const handleEditLead = (lead: any) => {
    setEditLead(lead);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditLead(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="elite-gradient text-gold border-b-2 border-gold/30 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold tracking-wider uppercase text-gold">
              CRM <span className="text-gold-bright">Elite 4.0</span>
            </h1>
            <p className="text-[10px] text-gold/50 tracking-[2px] uppercase">Gestão Inteligente de Vendas</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-gold/80 hover:text-gold hover:bg-gold/10 text-xs border border-gold/30"
            onClick={() => window.open("https://www.assecomassessoria.net.br", "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-1" /> Simulador 4.0
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-gold/80 hover:text-gold hover:bg-gold/10 text-xs"
            onClick={() => setCadastroOpen(true)}
          >
            Cadastre-se
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-red-400/70 hover:text-red-400 hover:bg-gold/10"
            onClick={() => {
              localStorage.removeItem("elite_login_date");
              setIsLoggedIn(false);
            }}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4">
        {/* Search & Actions */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            className="gold-gradient text-primary font-semibold hover:opacity-90"
            onClick={() => {
              setEditLead(null);
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Novo Lead
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="construtoras" className="text-xs">
              <Building2 className="w-4 h-4 mr-1" /> Construtoras
            </TabsTrigger>
            <TabsTrigger value="leads" className="text-xs">
              <Users className="w-4 h-4 mr-1" /> Leads
            </TabsTrigger>
            <TabsTrigger value="kanban" className="text-xs">
              <Columns3 className="w-4 h-4 mr-1" /> Kanban
            </TabsTrigger>
            <TabsTrigger value="tarefas" className="text-xs">
              <ListTodo className="w-4 h-4 mr-1" /> Tarefas
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="text-xs">
              <BarChart3 className="w-4 h-4 mr-1" /> Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="construtoras" className="mt-4">
            <CrmConstrutoras />
          </TabsContent>

          <TabsContent value="leads" className="mt-4">
            <CrmLeadsList leads={leads} onRefresh={fetchLeads} onEditLead={handleEditLead} searchTerm={searchTerm} />
          </TabsContent>

          <TabsContent value="kanban" className="mt-4">
            <CrmKanban leads={leads} onRefresh={fetchLeads} onEditLead={handleEditLead} />
          </TabsContent>

          <TabsContent value="tarefas" className="mt-4">
            <CrmTasks leads={leads} />
          </TabsContent>

          <TabsContent value="relatorios" className="mt-4">
            <CrmReports leads={leads} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-4 py-3 text-center border-t border-gold/20 mt-8 elite-gradient">
        <p className="text-[10px] text-gold/60">
          © 2026 CRM Corretor Elite 4.0 - Comprometimento com resultados reais.
        </p>
        <p className="text-[9px] text-gold/40 mt-0.5">Tecnologia a serviço de quem faz o mercado acontecer.</p>
      </div>

      {/* Lead Form Dialog */}
      {formOpen && <CrmLeadForm isOpen={formOpen} onClose={handleCloseForm} onSaved={fetchLeads} editLead={editLead} />}

      {/* Cadastro Dialog */}
      <CrmCadastro isOpen={cadastroOpen} onClose={() => setCadastroOpen(false)} />
    </div>
  );
};

export default CrmPage;
