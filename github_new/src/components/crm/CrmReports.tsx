import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, FileText, Users, TrendingUp, DollarSign, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/eliteUtils';

interface CrmReportsProps {
  leads: any[];
}

const CrmReports = ({ leads }: CrmReportsProps) => {
  const total = leads.length;
  const prospeccao = leads.filter(l => l.estagio === 'prospeccao').length;
  const qualificacao = leads.filter(l => l.estagio === 'qualificacao').length;
  const proposta = leads.filter(l => l.estagio === 'proposta').length;
  const negociacao = leads.filter(l => l.estagio === 'negociacao').length;
  const ganhos = leads.filter(l => l.estagio === 'fechado_ganho').length;
  const perdidos = leads.filter(l => l.estagio === 'fechado_perdido').length;
  const valorTotal = leads.reduce((s, l) => s + (l.valor_negociacao || 0), 0);
  const valorGanho = leads.filter(l => l.estagio === 'fechado_ganho').reduce((s, l) => s + (l.valor_negociacao || 0), 0);
  const taxaConversao = total > 0 ? ((ganhos / total) * 100).toFixed(1) : '0';

  const origens = leads.reduce((acc: Record<string, number>, l) => {
    acc[l.origem || 'manual'] = (acc[l.origem || 'manual'] || 0) + 1;
    return acc;
  }, {});

  const handlePrint = () => window.print();

  const handleExportPDF = () => {
    // Use print dialog as PDF export
    window.print();
  };

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="flex items-center justify-between print:hidden">
        <h3 className="font-bold text-lg">Relatórios e Performance</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" /> Imprimir</Button>
          <Button size="sm" variant="outline" onClick={handleExportPDF}><FileText className="w-4 h-4 mr-1" /> PDF</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <Users className="w-6 h-6 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Total Leads</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Target className="w-6 h-6 mx-auto mb-1 text-green-500" />
          <p className="text-2xl font-bold">{taxaConversao}%</p>
          <p className="text-[10px] text-muted-foreground uppercase">Conversão</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <DollarSign className="w-6 h-6 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold">{formatCurrency(valorGanho)}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Receita Fechada</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-1 text-orange-500" />
          <p className="text-lg font-bold">{formatCurrency(valorTotal)}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Pipeline Total</p>
        </CardContent></Card>
      </div>

      {/* Funil */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Funil de Vendas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: 'Prospecção', count: prospeccao, color: 'bg-blue-500' },
            { label: 'Qualificação', count: qualificacao, color: 'bg-yellow-500' },
            { label: 'Proposta', count: proposta, color: 'bg-orange-500' },
            { label: 'Negociação', count: negociacao, color: 'bg-purple-500' },
            { label: 'Ganhos', count: ganhos, color: 'bg-green-600' },
            { label: 'Perdidos', count: perdidos, color: 'bg-red-500' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs w-24">{item.label}</span>
              <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                <div className={`${item.color} h-full rounded-full transition-all`} style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }} />
              </div>
              <span className="text-xs font-bold w-8 text-right">{item.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Origens */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Leads por Origem</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(origens).map(([origem, count]) => (
              <div key={origem} className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{count as number}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{origem}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Leads para impressão */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Cadastro Completo de Leads</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Nome</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">WhatsApp</th>
                <th className="text-left py-2">CPF/CNPJ</th>
                <th className="text-left py-2">Estágio</th>
                <th className="text-right py-2">Valor</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id} className="border-b border-muted">
                  <td className="py-1">{l.nome}</td>
                  <td className="py-1">{l.email || '—'}</td>
                  <td className="py-1">{l.whatsapp || '—'}</td>
                  <td className="py-1">{l.cpf_cnpj || '—'}</td>
                  <td className="py-1">{l.estagio}</td>
                  <td className="py-1 text-right">{l.valor_negociacao ? formatCurrency(l.valor_negociacao) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CrmReports;
