import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Columns3, ListTodo, BarChart3, Plus, Search, Building2, AlertTriangle, ExternalLink } from 'lucide-react';
import { fetchLeads as fetchLeadsApi } from '@/lib/crmApi';
import CrmLeadForm from '@/components/crm/CrmLeadForm';
import CrmLeadsList from '@/components/crm/CrmLeadsList';
import CrmKanban from '@/components/crm/CrmKanban';
import CrmTasks from '@/components/crm/CrmTasks';
import CrmReports from '@/components/crm/CrmReports';
import CrmConstrutoras from '@/components/crm/CrmConstrutoras';
import { getActiveTenant } from '@/lib/tenant';

const CrmTab = ({ isVisitor = false }: { isVisitor?: boolean }) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState('construtoras');
  const activeTenant = getActiveTenant();

  const fetchLeads = useCallback(async () => {
    try {
      const data = await fetchLeadsApi();
      setLeads(data);
    } catch (err) {
      console.warn('Erro ao carregar leads:', err);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleEditLead = (lead: any) => {
    setEditLead(lead);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditLead(null);
  };

  return (
    <div className={isVisitor ? 'pointer-events-none' : ''}>
      {activeTenant && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Recurso Isolado por Escopo (Tenant: {activeTenant.name})</p>
              <p className="text-muted-foreground">A customização visual e de propostas desta imobiliária parceira é restrita aos simuladores técnicos. Para CRM completo e funil de vendas, use o ambiente unificado do <strong>Lorento CRM</strong>.</p>
            </div>
          </div>
          <a
            href={`https://lorentocrm.simuladorcorretorelite.com.br`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-black uppercase text-amber-400 hover:underline bg-amber-500/15 px-2.5 py-1 rounded"
          >
            Acessar CRM <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Search & Actions */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar leads..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" readOnly={isVisitor} />
        </div>
        {!isVisitor && (
          <Button className="gold-gradient text-primary font-semibold hover:opacity-90" onClick={() => { setEditLead(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Novo Lead
          </Button>
        )}
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="construtoras" className="text-xs"><Building2 className="w-4 h-4 mr-1" /> Construtoras</TabsTrigger>
          <TabsTrigger value="leads" className="text-xs"><Users className="w-4 h-4 mr-1" /> Leads</TabsTrigger>
          <TabsTrigger value="kanban" className="text-xs"><Columns3 className="w-4 h-4 mr-1" /> Kanban</TabsTrigger>
          <TabsTrigger value="tarefas" className="text-xs"><ListTodo className="w-4 h-4 mr-1" /> Tarefas</TabsTrigger>
          <TabsTrigger value="relatorios" className="text-xs"><BarChart3 className="w-4 h-4 mr-1" /> Relatórios</TabsTrigger>
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

      {/* Lead Form Dialog */}
      {formOpen && (
        <CrmLeadForm isOpen={formOpen} onClose={handleCloseForm} onSaved={fetchLeads} editLead={editLead} />
      )}
    </div>
  );
};

export default CrmTab;
