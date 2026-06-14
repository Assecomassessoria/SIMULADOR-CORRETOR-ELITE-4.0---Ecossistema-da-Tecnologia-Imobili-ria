import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/eliteUtils';

interface ChartData {
  financiamento: number;
  fgts: number;
  subsidios: number;
  entrada: number;
  sinal: number;
  intermediarias: number;
  obras: number;
  chaves: number;
  avaliacao: number;
  lancamento: number;
}

const COLORS_COMPOSICAO = ['hsl(213, 100%, 12%)', 'hsl(40, 39%, 55%)', '#34B7F1', '#EA4335'];
const COLORS_FLUXO = ['#25D366', '#34B7F1', '#9C27B0', 'hsl(213, 100%, 12%)'];

export default function DashboardCharts({ data }: { data: ChartData }) {
  const composicaoData = useMemo(() => [
    { name: 'Financiamento', value: data.financiamento },
    { name: 'FGTS', value: data.fgts },
    { name: 'Subsídios', value: data.subsidios },
    { name: 'Entrada', value: data.entrada },
  ].filter(d => d.value > 0), [data]);

  const fluxoData = useMemo(() => [
    { name: 'Sinal', value: data.sinal },
    { name: 'Intermediárias', value: data.intermediarias },
    { name: 'Obras', value: data.obras },
    { name: 'Chaves', value: data.chaves },
  ].filter(d => d.value > 0), [data]);

  const beneficioData = useMemo(() => {
    const custoFinal = data.lancamento - data.subsidios;
    const vantagem = data.avaliacao - custoFinal;
    return [
      { name: 'Mercado', valor: data.avaliacao },
      { name: 'Custo', valor: custoFinal > 0 ? custoFinal : 0 },
      { name: 'Vantagem', valor: vantagem > 0 ? vantagem : 0 },
    ];
  }, [data]);

  const hasComposicao = composicaoData.some(d => d.value > 0);
  const hasFluxo = fluxoData.some(d => d.value > 0);
  const hasBeneficio = beneficioData.some(d => d.valor > 0);

  if (!hasComposicao && !hasFluxo && !hasBeneficio) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Preencha a simulação para visualizar os gráficos</p>
      </div>
    );
  }

  const renderLabel = ({ name, value }: { name: string; value: number }) => {
    return `${name}: ${formatCurrency(value)}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Composição do Investimento */}
      {hasComposicao && (
        <ChartCard title="Composição do Investimento" description="Distribuição das fontes de recursos">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={composicaoData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                {composicaoData.map((_, i) => (
                  <Cell key={i} fill={COLORS_COMPOSICAO[i % COLORS_COMPOSICAO.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Fluxo de Pagamento */}
      {hasFluxo && (
        <ChartCard title="Fluxo de Pagamento" description="Distribuição da entrada ao longo do tempo">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={fluxoData} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
                {fluxoData.map((_, i) => (
                  <Cell key={i} fill={COLORS_FLUXO[i % COLORS_FLUXO.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Análise de Benefícios */}
      {hasBeneficio && (
        <ChartCard title="Análise de Benefícios" description="Comparativo entre valor de mercado e custo real">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={beneficioData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                {beneficioData.map((_, i) => (
                  <Cell key={i} fill={['hsl(213, 100%, 12%)', 'hsl(40, 39%, 55%)', '#34B7F1'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      <div className="bg-primary text-gold px-4 py-3 border-l-4 border-l-gold">
        <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
        <p className="text-[10px] text-gold/60 mt-0.5">{description}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
