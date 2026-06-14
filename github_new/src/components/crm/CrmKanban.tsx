import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, ArrowRight, ArrowLeft, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/eliteUtils';
import { updateLead } from '@/lib/crmApi';

const ESTAGIOS = [
  { value: 'prospeccao', label: 'Prospecção', color: 'bg-blue-500' },
  { value: 'qualificacao', label: 'Qualificação', color: 'bg-yellow-500' },
  { value: 'proposta', label: 'Proposta', color: 'bg-orange-500' },
  { value: 'negociacao', label: 'Negociação', color: 'bg-purple-500' },
  { value: 'fechado_ganho', label: 'Ganho ✅', color: 'bg-green-600' },
  { value: 'fechado_perdido', label: 'Perdido ❌', color: 'bg-red-500' },
];

interface CrmKanbanProps {
  leads: any[];
  onRefresh: () => void;
  onEditLead: (lead: any) => void;
}

const CrmKanban = ({ leads, onRefresh, onEditLead }: CrmKanbanProps) => {
  const [moving, setMoving] = useState<string | null>(null);

  const moveLead = async (leadId: string, direction: 'next' | 'prev') => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    const currentIdx = ESTAGIOS.findIndex(e => e.value === lead.estagio);
    const newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (newIdx < 0 || newIdx >= ESTAGIOS.length) return;

    setMoving(leadId);
    try {
      await updateLead(leadId, { estagio: ESTAGIOS[newIdx].value });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
    setMoving(null);
    onRefresh();
  };

  const openWhatsApp = (phone: string, nome: string) => {
    const clean = phone.replace(/\D/g, '');
    const number = clean.startsWith('55') ? clean : `55${clean}`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(`Olá ${nome}, tudo bem?`)}`, '_blank');
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-[1200px]">
        {ESTAGIOS.map(estagio => {
          const stagLeads = leads.filter(l => l.estagio === estagio.value);
          const total = stagLeads.reduce((s, l) => s + (l.valor_negociacao || 0), 0);

          return (
            <div key={estagio.value} className="flex-1 min-w-[200px]">
              <div className={`${estagio.color} text-white rounded-t-lg px-3 py-2 text-center`}>
                <p className="font-bold text-sm">{estagio.label}</p>
                <p className="text-[10px] opacity-80">{stagLeads.length} leads • {formatCurrency(total)}</p>
              </div>
              <div className="bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[200px]">
                {stagLeads.map(lead => (
                  <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onEditLead(lead)}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <p className="font-semibold text-sm truncate">{lead.nome}</p>
                      </div>
                      {lead.valor_negociacao > 0 && (
                        <p className="text-xs text-primary font-bold">{formatCurrency(lead.valor_negociacao)}</p>
                      )}
                      <Badge variant="outline" className="text-[10px]">{lead.origem}</Badge>
                      <div className="flex gap-1">
                        {lead.whatsapp && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={e => { e.stopPropagation(); openWhatsApp(lead.whatsapp, lead.nome); }}>
                            <Phone className="w-3 h-3" />
                          </Button>
                        )}
                        {lead.email && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" onClick={e => { e.stopPropagation(); window.open(`mailto:${lead.email}`); }}>
                            <Mail className="w-3 h-3" />
                          </Button>
                        )}
                        <div className="flex-1" />
                        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={moving === lead.id || ESTAGIOS.findIndex(e => e.value === lead.estagio) === 0} onClick={e => { e.stopPropagation(); moveLead(lead.id, 'prev'); }}>
                          <ArrowLeft className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={moving === lead.id || ESTAGIOS.findIndex(e => e.value === lead.estagio) >= ESTAGIOS.length - 1} onClick={e => { e.stopPropagation(); moveLead(lead.id, 'next'); }}>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CrmKanban;
