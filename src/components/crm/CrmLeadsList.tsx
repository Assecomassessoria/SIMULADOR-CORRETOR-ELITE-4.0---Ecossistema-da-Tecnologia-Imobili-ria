import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Edit, Trash2, User, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/eliteUtils';
import { deleteLead as deleteLeadApi } from '@/lib/crmApi';

const ESTAGIO_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  prospeccao: { label: 'Prospecção', variant: 'outline' },
  qualificacao: { label: 'Qualificação', variant: 'secondary' },
  proposta: { label: 'Proposta', variant: 'default' },
  negociacao: { label: 'Negociação', variant: 'default' },
  fechado_ganho: { label: 'Ganho ✅', variant: 'default' },
  fechado_perdido: { label: 'Perdido ❌', variant: 'destructive' },
};

interface CrmLeadsListProps {
  leads: any[];
  onRefresh: () => void;
  onEditLead: (lead: any) => void;
  searchTerm: string;
}

const CrmLeadsList = ({ leads, onRefresh, onEditLead, searchTerm }: CrmLeadsListProps) => {
  const filtered = leads.filter(l => {
    const term = searchTerm.toLowerCase();
    return l.nome?.toLowerCase().includes(term) ||
      l.email?.toLowerCase().includes(term) ||
      l.whatsapp?.includes(term) ||
      l.cpf_cnpj?.includes(term);
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este lead?')) return;
    try {
      await deleteLeadApi(id);
      toast({ title: 'Lead excluído' });
      onRefresh();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const openWhatsApp = (phone: string, nome: string) => {
    const clean = phone.replace(/\D/g, '');
    const number = clean.startsWith('55') ? clean : `55${clean}`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(`Olá ${nome}, tudo bem?`)}`, '_blank');
  };

  if (filtered.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhum lead encontrado.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {filtered.map(lead => {
        const est = ESTAGIO_LABELS[lead.estagio] || { label: lead.estagio, variant: 'outline' as const };
        return (
          <Card key={lead.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <User className="w-5 h-5 text-primary flex-shrink-0" />
                  <h3 className="font-bold text-sm truncate">{lead.nome}</h3>
                </div>
                <Badge variant={est.variant} className="text-[10px] flex-shrink-0">{est.label}</Badge>
              </div>

              {lead.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</p>}
              {lead.whatsapp && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{lead.whatsapp}</p>}
              {lead.cpf_cnpj && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.cpf_cnpj}</p>}
              {lead.valor_negociacao > 0 && <p className="text-sm font-bold text-primary mt-1">{formatCurrency(lead.valor_negociacao)}</p>}
              {lead.mensagem && <p className="text-xs text-muted-foreground mt-1 italic line-clamp-3 whitespace-pre-line">"{lead.mensagem}"</p>}

              <div className="flex gap-1 mt-3">
                {lead.whatsapp && (
                  <Button size="sm" variant="outline" className="text-green-600 h-8 text-xs" onClick={() => openWhatsApp(lead.whatsapp, lead.nome)}>
                    <Phone className="w-3 h-3 mr-1" /> WhatsApp
                  </Button>
                )}
                <div className="flex-1" />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEditLead(lead)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(lead.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CrmLeadsList;
