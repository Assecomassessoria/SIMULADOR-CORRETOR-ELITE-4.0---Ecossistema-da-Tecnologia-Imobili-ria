import { useState, useMemo } from 'react';
import { Search, Download, Plus, Trash2, ChevronDown, ChevronUp, FileText, X } from 'lucide-react';

import {
  type Venda, getVendas, saveVendas, checkExpiration, exportCSV,
  formatCurrency, formatCurrencyInput, parseCurrency, calcularSenhaMaster, calcularDesconto, formatCPF,
} from '@/lib/eliteUtils';

/* ─── Options ─── */
const ESCOLARIDADE = ['Fundamental', 'Médio', 'Superior', 'Pós-graduação'];
const ESTADO_CIVIL = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'];
const REGIME_CASAMENTO = ['Comunhão Parcial', 'Comunhão Universal', 'Separação Total', 'Participação Final'];
const COMO_CONHECEU = ['Facebook', 'Instagram', 'Outdoor', 'Rádio', 'Site', 'Folheto', 'Passagem', 'Indicação'];

const today = () => new Date().toISOString().split('T')[0];

const blank = () => ({
  data: today(), corretor: '', torre: '', unidade: '',
  cliente: '', telResidencial: '', celular: '', recados: '', email: '',
  dataNascimento: '', cpf: '', rg: '', profissao: '',
  escolaridade: '', estadoCivil: '', regimeCasamento: '',
  endRua: '', endNumero: '', endComplemento: '', endCep: '', endBairro: '', endCidade: '',
  rendaBrutaLiquida: '', rendaBrutaIR: '', rendaBrutaMesRef: '',
  rendaInformalLiquida: '', rendaInformalIR: '', rendaInformalMesRef: '',
  possuiImovel: false, compromissoFinanceiro: 'nao',
  modalidade: '', valorImovel: '', valorFgts: '',
  fgts3Anos: false, possuiDependente: false,
  comoConheceu: [] as string[], comoConheceuOutros: '',
  ordem: '', valorNormal: '', valorVenda: '',
});

/* ─── Tiny reusable pieces ─── */
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 pt-1">
    <div className="h-px flex-1 bg-border" />
    <h4 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-secondary whitespace-nowrap">{children}</h4>
    <div className="h-px flex-1 bg-border" />
  </div>
);

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
    {children}{required && <span className="text-destructive ml-0.5">*</span>}
  </label>
);

const inputCls = "w-full px-3 py-[7px] border border-border rounded-md text-xs bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-all";
const selectCls = `${inputCls} appearance-none`;

const Radio = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
  <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none hover:text-foreground transition-colors">
    <input type="radio" checked={checked} onChange={onChange} className="w-3.5 h-3.5 accent-secondary" />
    {label}
  </label>
);

const Check = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
  <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none hover:text-foreground transition-colors">
    <input type="checkbox" checked={checked} onChange={onChange} className="w-3.5 h-3.5 accent-secondary rounded" />
    {label}
  </label>
);

export default function GestaoVendas({ isVisitor = false }: { isVisitor?: boolean }) {
  const [vendas, setVendas] = useState<Venda[]>(getVendas);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vendas.filter(v =>
      v.cliente.toLowerCase().includes(q) ||
      v.cpf.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q)
    );
  }, [vendas, search]);

  const set = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }));

  const toggleComo = (opt: string) => {
    setForm(p => ({
      ...p,
      comoConheceu: p.comoConheceu.includes(opt)
        ? p.comoConheceu.filter(o => o !== opt)
        : [...p.comoConheceu, opt],
    }));
  };

  /* ── Save ── */
  const handleAdd = async () => {
    const vN = parseCurrency(form.valorNormal);
    const vV = parseCurrency(form.valorVenda);
    const errs: Record<string, string> = {};
    if (!form.cliente.trim()) errs.cliente = 'Obrigatório';
    if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(form.cpf)) errs.cpf = 'CPF inválido';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'E-mail inválido';
    if (!form.ordem.trim()) errs.ordem = 'Obrigatório';
    if (vN <= 0) errs.valorNormal = 'Obrigatório';
    if (vV <= 0) errs.valorVenda = 'Obrigatório';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    const desconto = calcularDesconto(vN, vV);
    const senhaMaster = await calcularSenhaMaster(form.cpf, form.ordem);

    const nova: Venda = {
      id: Date.now().toString(),
      data: form.data || today(),
      corretor: form.corretor, torre: form.torre, unidade: form.unidade,
      cliente: form.cliente.trim(), telResidencial: form.telResidencial, celular: form.celular,
      recados: form.recados, email: form.email.trim(), dataNascimento: form.dataNascimento,
      cpf: form.cpf, rg: form.rg, profissao: form.profissao,
      escolaridade: form.escolaridade, estadoCivil: form.estadoCivil, regimeCasamento: form.regimeCasamento,
      endRua: form.endRua, endNumero: form.endNumero, endComplemento: form.endComplemento,
      endCep: form.endCep, endBairro: form.endBairro, endCidade: form.endCidade,
      rendaBrutaLiquida: form.rendaBrutaLiquida, rendaBrutaIR: form.rendaBrutaIR, rendaBrutaMesRef: form.rendaBrutaMesRef,
      rendaInformalLiquida: form.rendaInformalLiquida, rendaInformalIR: form.rendaInformalIR, rendaInformalMesRef: form.rendaInformalMesRef,
      possuiImovel: form.possuiImovel, compromissoFinanceiro: form.compromissoFinanceiro,
      modalidade: form.modalidade,
      valorImovel: parseCurrency(form.valorImovel), valorFgts: parseCurrency(form.valorFgts),
      fgts3Anos: form.fgts3Anos, possuiDependente: form.possuiDependente,
      comoConheceu: form.comoConheceu, comoConheceuOutros: form.comoConheceuOutros,
      ordem: form.ordem.trim(), valorNormal: vN, valorVenda: vV,
      desconto, senhaMaster,
      dataCompra: today(), status: 'Demo Ativa',
    };
    const updated = [...vendas, nova];
    setVendas(updated);
    saveVendas(updated);
    // Track Facebook Pixel: nova venda criada
    import('@/lib/fbPixel').then(({ trackVendaCriada }) =>
      trackVendaCriada({ valorVenda: vV, valorNormal: vN, desconto, modalidade: form.modalidade })
    );
    setForm(blank());
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    const updated = vendas.filter(v => v.id !== id);
    setVendas(updated);
    saveVendas(updated);
  };

  /* ── Build temp venda for PDF preview ── */
  const buildTemp = (): Venda => ({
    id: 'temp', data: form.data || today(),
    corretor: form.corretor, torre: form.torre, unidade: form.unidade,
    cliente: form.cliente, telResidencial: form.telResidencial, celular: form.celular,
    recados: form.recados, email: form.email, dataNascimento: form.dataNascimento,
    cpf: form.cpf, rg: form.rg, profissao: form.profissao,
    escolaridade: form.escolaridade, estadoCivil: form.estadoCivil, regimeCasamento: form.regimeCasamento,
    endRua: form.endRua, endNumero: form.endNumero, endComplemento: form.endComplemento,
    endCep: form.endCep, endBairro: form.endBairro, endCidade: form.endCidade,
    rendaBrutaLiquida: form.rendaBrutaLiquida, rendaBrutaIR: form.rendaBrutaIR, rendaBrutaMesRef: form.rendaBrutaMesRef,
    rendaInformalLiquida: form.rendaInformalLiquida, rendaInformalIR: form.rendaInformalIR, rendaInformalMesRef: form.rendaInformalMesRef,
    possuiImovel: form.possuiImovel, compromissoFinanceiro: form.compromissoFinanceiro,
    modalidade: form.modalidade, valorImovel: parseCurrency(form.valorImovel), valorFgts: parseCurrency(form.valorFgts),
    fgts3Anos: form.fgts3Anos, possuiDependente: form.possuiDependente,
    comoConheceu: form.comoConheceu, comoConheceuOutros: form.comoConheceuOutros,
    ordem: form.ordem, valorNormal: parseCurrency(form.valorNormal), valorVenda: parseCurrency(form.valorVenda),
    desconto: 0, senhaMaster: '', dataCompra: today(), status: '',
  });

  /* ─── Impressão HTML ─── */
  const handleImprimirFicha = (venda: Venda) => {
    const dataStr = venda.data || today();
    const [yy, mm, dd] = dataStr.split('-');
    const dataFormatada = `${dd}/${mm}/${yy}`;
    const dataNascFormatada = venda.dataNascimento ? (() => { const [y,m,d] = venda.dataNascimento.split('-'); return `${d}/${m}/${y}`; })() : '-';

    const row = (label: string, value: string, label2?: string, value2?: string) => {
      if (label2 !== undefined) {
        return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:2px;">
          <div><span class="lbl">${label}</span><div class="val">${value || '-'}</div></div>
          <div><span class="lbl">${label2}</span><div class="val">${value2 || '-'}</div></div>
        </div>`;
      }
      return `<div style="margin-bottom:2px;"><span class="lbl">${label}</span><div class="val">${value || '-'}</div></div>`;
    };

    const row3 = (l1:string,v1:string,l2:string,v2:string,l3:string,v3:string) =>
      `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-bottom:2px;">
        <div><span class="lbl">${l1}</span><div class="val">${v1||'-'}</div></div>
        <div><span class="lbl">${l2}</span><div class="val">${v2||'-'}</div></div>
        <div><span class="lbl">${l3}</span><div class="val">${v3||'-'}</div></div>
      </div>`;

    const row4 = (l1:string,v1:string,l2:string,v2:string,l3:string,v3:string,l4:string,v4:string) =>
      `<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:24px;margin-bottom:2px;">
        <div><span class="lbl">${l1}</span><div class="val">${v1||'-'}</div></div>
        <div><span class="lbl">${l2}</span><div class="val">${v2||'-'}</div></div>
        <div><span class="lbl">${l3}</span><div class="val">${v3||'-'}</div></div>
        <div><span class="lbl">${l4}</span><div class="val">${v4||'-'}</div></div>
      </div>`;

    const section = (title: string, content: string) =>
      `<div style="border:1px solid #ddd;border-radius:4px;padding:6px 10px;margin-bottom:6px;">
        <div style="font-weight:700;font-size:10px;margin-bottom:4px;border-bottom:1.5px solid #d4a017;padding-bottom:2px;">${title}</div>
        ${content}
      </div>`;

    const comoList = [...(venda.comoConheceu||[]), venda.comoConheceuOutros].filter(Boolean).join(', ') || '-';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ficha Cadastral - ${venda.cliente}</title>
<style>
  @page{size:A4;margin:8mm 12mm;}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:9px;color:#222;padding:8px;max-width:800px;margin:0 auto;}
  .lbl{font-size:7px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:0.3px;display:block;line-height:1.1;}
  .val{font-size:9px;font-weight:500;color:#111;min-height:12px;border-bottom:1px dotted #ccc;padding:0 0 1px;line-height:1.3;}
  .header{text-align:center;margin-bottom:8px;}
  .header h1{font-size:12px;font-weight:800;color:#1a237e;margin-bottom:2px;}
  .header .sub{font-size:8px;color:#888;border-top:1.5px solid #d4a017;border-bottom:1.5px solid #d4a017;padding:2px 0;display:inline-block;}
  @media print{body{padding:0;}}
</style></head><body>

<div class="header">
  <h1>💎 FICHA CADASTRAL — SIMULADOR CORRETOR DE ELITE 4.0</h1>
  <div class="sub">DATA: ${dataFormatada}</div>
</div>

${section('Dados Pessoais',
  row('Nome', venda.cliente.toUpperCase(), 'E-mail', venda.email) +
  row3('CPF', venda.cpf, 'RG', venda.rg, 'Data Nasc.', dataNascFormatada) +
  row3('Tel. Residencial', venda.telResidencial, 'Celular', venda.celular, 'Recados', venda.recados) +
  row4('Profissão', venda.profissao, 'Escolaridade', venda.escolaridade, 'Estado Civil', venda.estadoCivil, 'Regime', venda.regimeCasamento || '-')
)}

${section('Endereço',
  row4('Rua', venda.endRua, 'Nº', venda.endNumero, 'Complemento', venda.endComplemento, 'CEP', venda.endCep) +
  row('Bairro', venda.endBairro, 'Cidade', venda.endCidade)
)}

${section('Imóvel e Financiamento',
  row4('Possui Imóvel?', venda.possuiImovel ? 'Sim' : 'Não', 'Comprom. Financeiro', venda.compromissoFinanceiro === 'nao' ? 'Não' : venda.compromissoFinanceiro === 'emprestimo' ? 'Empréstimo' : 'Financiamento', 'Modalidade', venda.modalidade ? venda.modalidade.toUpperCase() : '-', '3 anos FGTS?', venda.fgts3Anos ? 'Sim' : 'Não') +
  row3('Valor Imóvel', venda.valorImovel > 0 ? formatCurrency(venda.valorImovel) : '-', 'Valor FGTS', venda.valorFgts > 0 ? formatCurrency(venda.valorFgts) : '-', 'Dependente/2 part.?', venda.possuiDependente ? 'Sim' : 'Não')
)}

${section('Renda',
  `<div style="display:grid;grid-template-columns:60px 1fr 1fr 1fr;gap:8px;margin-bottom:1px;align-items:end;">
    <div style="font-weight:600;font-size:8px;color:#d4a017;">BRUTA</div>
    <div><span class="lbl">Valor Renda</span><div class="val">${venda.rendaBrutaLiquida||'-'}</div></div>
    <div><span class="lbl">IR</span><div class="val">${venda.rendaBrutaIR||'-'}</div></div>
    <div><span class="lbl">Mês Ref.</span><div class="val">${venda.rendaBrutaMesRef||'-'}</div></div>
  </div>
  <div style="display:grid;grid-template-columns:60px 1fr 1fr 1fr;gap:8px;align-items:end;">
    <div style="font-weight:600;font-size:8px;color:#d4a017;">INFORMAL</div>
    <div><span class="lbl">Valor Renda</span><div class="val">${venda.rendaInformalLiquida||'-'}</div></div>
    <div><span class="lbl">IR</span><div class="val">${venda.rendaInformalIR||'-'}</div></div>
    <div><span class="lbl">Mês Ref.</span><div class="val">${venda.rendaInformalMesRef||'-'}</div></div>
  </div>`
)}

${section('Como Conheceu', `<div class="val" style="font-size:9px;">${comoList}</div>`)}

${section('Dados do Sistema',
  row4('Empreendimento', `<b>${venda.ordem||'-'}</b>`, 'Valor Normal', formatCurrency(venda.valorNormal), 'Valor Venda', formatCurrency(venda.valorVenda), 'Desconto', venda.desconto ? venda.desconto.toFixed(1)+'%' : '-') +
  row3('Senha Master', venda.senhaMaster || '-', 'Corretor', venda.corretor, 'Torre/Unidade', (venda.torre||'-')+' / '+(venda.unidade||'-'))
)}

<div style="margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:60px;text-align:center;">
  <div style="border-top:1px solid #333;padding-top:4px;font-size:8px;">Assinatura do Cliente</div>
  <div style="border-top:1px solid #333;padding-top:4px;font-size:8px;">Assinatura do Corretor</div>
</div>

<script>window.onload=function(){window.print();}</script>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const Err = ({ f }: { f: string }) => errors[f] ? <p className="text-destructive text-[10px] mt-0.5">{errors[f]}</p> : null;

  /* ═══════════════════════════════════ RENDER ═══════════════════════════════════ */
  return (
    <div className={`space-y-4 animate-fade-in ${isVisitor ? '[&_input]:pointer-events-none [&_input]:opacity-60 [&_select]:pointer-events-none [&_select]:opacity-60 [&_button]:pointer-events-none [&_button]:opacity-60' : ''}`}>
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar por nome, CPF ou e-mail..." value={search}
            onChange={e => setSearch(e.target.value)} maxLength={100}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring bg-card" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(vendas)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => { setShowForm(!showForm); setErrors({}); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-bold uppercase hover:opacity-90 transition-opacity">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Fechar' : 'Nova Venda'}
          </button>
        </div>
      </div>

      {/* ═══════════════════ FORMULÁRIO FICHA CADASTRAL ═══════════════════ */}
      {showForm && (
        <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden animate-fade-in">
          {/* Title bar */}
          <div className="bg-primary px-6 py-3">
            <h3 className="text-center text-sm font-extrabold text-primary-foreground uppercase tracking-[0.2em]">Ficha Cadastral</h3>
          </div>

          <div className="p-5 space-y-4">
            {/* ROW 1 — Data / Corretor / Torre / Unidade */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><Label>Data</Label><input type="date" value={form.data} onChange={e => set('data', e.target.value)} className={inputCls} /></div>
              <div><Label>Corretor(a)</Label><input value={form.corretor} onChange={e => set('corretor', e.target.value)} maxLength={80} className={inputCls} /></div>
              <div><Label>Torre</Label><input value={form.torre} onChange={e => set('torre', e.target.value)} maxLength={10} className={inputCls} /></div>
              <div><Label>Unidade</Label><input value={form.unidade} onChange={e => set('unidade', e.target.value)} maxLength={10} className={inputCls} /></div>
            </div>

            {/* Nome */}
            <div>
              <Label required>Nome</Label>
              <input value={form.cliente} onChange={e => set('cliente', e.target.value)} maxLength={100} className={inputCls} />
              <Err f="cliente" />
            </div>

            {/* Tel / Cel / Recados */}
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Tel. Residencial</Label><input value={form.telResidencial} onChange={e => set('telResidencial', e.target.value)} maxLength={15} className={inputCls} /></div>
              <div><Label>Cel.</Label><input value={form.celular} onChange={e => set('celular', e.target.value)} maxLength={15} className={inputCls} /></div>
              <div><Label>Recados</Label><input value={form.recados} onChange={e => set('recados', e.target.value)} maxLength={15} className={inputCls} /></div>
            </div>

            {/* Email / Data Nasc */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>E-mail</Label><input value={form.email} onChange={e => set('email', e.target.value)} maxLength={255} className={inputCls} /><Err f="email" /></div>
              <div><Label>Data Nasc.</Label><input type="date" value={form.dataNascimento} onChange={e => set('dataNascimento', e.target.value)} className={inputCls} /></div>
            </div>

            {/* CPF / RG / Profissão */}
            <div className="grid grid-cols-3 gap-3">
              <div><Label required>CPF</Label><input value={form.cpf} onChange={e => set('cpf', formatCPF(e.target.value))} maxLength={14} placeholder="000.000.000-00" className={inputCls} /><Err f="cpf" /></div>
              <div><Label>RG</Label><input value={form.rg} onChange={e => set('rg', e.target.value)} maxLength={20} className={inputCls} /></div>
              <div><Label>Profissão</Label><input value={form.profissao} onChange={e => set('profissao', e.target.value)} maxLength={60} className={inputCls} /></div>
            </div>

            {/* Escolaridade / Estado Civil / Regime */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Escolaridade</Label>
                <select value={form.escolaridade} onChange={e => set('escolaridade', e.target.value)} className={selectCls}>
                  <option value="">Selecione</option>
                  {ESCOLARIDADE.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <Label>Estado Civil</Label>
                <select value={form.estadoCivil} onChange={e => set('estadoCivil', e.target.value)} className={selectCls}>
                  <option value="">Selecione</option>
                  {ESTADO_CIVIL.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <Label>Regime de Casamento</Label>
                <select value={form.regimeCasamento} onChange={e => set('regimeCasamento', e.target.value)} className={selectCls}>
                  <option value="">Selecione</option>
                  {REGIME_CASAMENTO.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* ── Endereço ── */}
            <SectionTitle>Endereço</SectionTitle>
            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-3"><Label>End. Rua</Label><input value={form.endRua} onChange={e => set('endRua', e.target.value)} maxLength={120} className={inputCls} /></div>
              <div className="col-span-1"><Label>Nº</Label><input value={form.endNumero} onChange={e => set('endNumero', e.target.value)} maxLength={10} className={inputCls} /></div>
              <div className="col-span-2"><Label>Complemento</Label><input value={form.endComplemento} onChange={e => set('endComplemento', e.target.value)} maxLength={60} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>CEP</Label><input value={form.endCep} onChange={e => set('endCep', e.target.value)} maxLength={10} className={inputCls} /></div>
              <div><Label>Bairro</Label><input value={form.endBairro} onChange={e => set('endBairro', e.target.value)} maxLength={60} className={inputCls} /></div>
              <div><Label>Cidade</Label><input value={form.endCidade} onChange={e => set('endCidade', e.target.value)} maxLength={60} className={inputCls} /></div>
            </div>

            {/* ── Possui Imóvel / Compromisso ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Possui Imóvel?</span>
                <Radio label="Sim" checked={form.possuiImovel} onChange={() => set('possuiImovel', true)} />
                <Radio label="Não" checked={!form.possuiImovel} onChange={() => set('possuiImovel', false)} />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Comprom. Financeiro</span>
                <Radio label="Não" checked={form.compromissoFinanceiro === 'nao'} onChange={() => set('compromissoFinanceiro', 'nao')} />
                <Radio label="Empréstimo" checked={form.compromissoFinanceiro === 'emprestimo'} onChange={() => set('compromissoFinanceiro', 'emprestimo')} />
                <Radio label="Financiamento" checked={form.compromissoFinanceiro === 'financiamento'} onChange={() => set('compromissoFinanceiro', 'financiamento')} />
              </div>
            </div>

            {/* ── Dados do Financiamento ── */}
            <SectionTitle>Dados do Financiamento / Modalidade</SectionTitle>
            <div className="bg-muted/20 rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                <div className="flex items-center gap-4 pt-1">
                  <Radio label="NPMCMV" checked={form.modalidade === 'npmcmv'} onChange={() => set('modalidade', 'npmcmv')} />
                  <Radio label="SBPE" checked={form.modalidade === 'sbpe'} onChange={() => set('modalidade', 'sbpe')} />
                </div>
                <div><Label>Valor Imóvel</Label><input value={form.valorImovel} onChange={e => set('valorImovel', formatCurrencyInput(e.target.value))} placeholder="R$ 0,00" className={inputCls} /></div>
                <div><Label>Valor FGTS</Label><input value={form.valorFgts} onChange={e => set('valorFgts', formatCurrencyInput(e.target.value))} placeholder="R$ 0,00" className={inputCls} /></div>
                <div />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">3 anos de FGTS?</span>
                  <Radio label="Sim" checked={form.fgts3Anos} onChange={() => set('fgts3Anos', true)} />
                  <Radio label="Não" checked={!form.fgts3Anos} onChange={() => set('fgts3Anos', false)} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Dependente / 2 participantes?</span>
                  <Radio label="Sim" checked={form.possuiDependente} onChange={() => set('possuiDependente', true)} />
                  <Radio label="Não" checked={!form.possuiDependente} onChange={() => set('possuiDependente', false)} />
                </div>
              </div>
            </div>

            {/* ── Renda ── */}
            <SectionTitle>Renda</SectionTitle>
            <div className="bg-muted/20 rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-4 gap-3 items-end">
                <span className="text-[10px] font-extrabold text-secondary uppercase tracking-wider self-end pb-2">Bruta</span>
                <div><Label>Valor Renda</Label><input value={form.rendaBrutaLiquida} onChange={e => set('rendaBrutaLiquida', formatCurrencyInput(e.target.value))} placeholder="R$ 0,00" className={inputCls} /></div>
                <div><Label>IR</Label><input value={form.rendaBrutaIR} onChange={e => set('rendaBrutaIR', formatCurrencyInput(e.target.value))} placeholder="R$ 0,00" className={inputCls} /></div>
                <div><Label>Mês Ref.</Label><input value={form.rendaBrutaMesRef} onChange={e => set('rendaBrutaMesRef', e.target.value)} maxLength={10} placeholder="03/2026" className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-4 gap-3 items-end">
                <span className="text-[10px] font-extrabold text-secondary uppercase tracking-wider self-end pb-2">Informal</span>
                <div><input value={form.rendaInformalLiquida} onChange={e => set('rendaInformalLiquida', formatCurrencyInput(e.target.value))} placeholder="R$ 0,00" className={inputCls} /></div>
                <div><input value={form.rendaInformalIR} onChange={e => set('rendaInformalIR', formatCurrencyInput(e.target.value))} placeholder="R$ 0,00" className={inputCls} /></div>
                <div><input value={form.rendaInformalMesRef} onChange={e => set('rendaInformalMesRef', e.target.value)} maxLength={10} placeholder="03/2026" className={inputCls} /></div>
              </div>
            </div>

            {/* ── Como Conheceu ── */}
            <SectionTitle>Como Conheceu Nosso Empreendimento?</SectionTitle>
            <div className="bg-muted/20 rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                {COMO_CONHECEU.map(opt => (
                  <Check key={opt} label={opt} checked={form.comoConheceu.includes(opt)} onChange={() => toggleComo(opt)} />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Label>Outros:</Label>
                <input value={form.comoConheceuOutros} onChange={e => set('comoConheceuOutros', e.target.value)} maxLength={80} className={`${inputCls} flex-1`} />
              </div>
            </div>

            {/* ── Dados do Sistema ── */}
            <SectionTitle>Dados do Sistema</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              <div><Label required>Empreendimento</Label><input value={form.ordem} onChange={e => set('ordem', e.target.value)} maxLength={60} className={inputCls} /><Err f="ordem" /></div>
              <div><Label required>Valor Normal</Label><input value={form.valorNormal} onChange={e => set('valorNormal', formatCurrencyInput(e.target.value))} placeholder="R$ 0,00" className={inputCls} /><Err f="valorNormal" /></div>
              <div><Label required>Valor Venda</Label><input value={form.valorVenda} onChange={e => set('valorVenda', formatCurrencyInput(e.target.value))} placeholder="R$ 0,00" className={inputCls} /><Err f="valorVenda" /></div>
            </div>

            {/* ── Actions ── */}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-border">
              <button onClick={handleAdd}
                className="flex-1 min-w-[140px] py-2.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
                Cadastrar Venda
              </button>
              <button onClick={() => handleImprimirFicha(buildTemp())}
                className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground border border-border text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center gap-2">
                <FileText className="w-4 h-4" /> Imprimir Ficha
              </button>
              <button onClick={() => { setForm(blank()); setErrors({}); }}
                className="px-5 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
                Limpar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ LISTA DE VENDAS ═══════════════════ */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Nenhuma venda encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(venda => {
            const status = checkExpiration(venda);
            const isExpired = status === 'Expirado';
            const isExpanded = expandedId === venda.id;
            return (
              <div key={venda.id} className="bg-card rounded-lg border border-border p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : venda.id)}>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-primary text-sm truncate">{venda.cliente}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isExpired ? 'bg-red-100 text-destructive' : 'bg-green-100 text-success'}`}>
                        {status}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">CPF: {venda.cpf} | {venda.email}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                      <span>Normal: <strong>{formatCurrency(venda.valorNormal)}</strong></span>
                      <span>Venda: <strong>{formatCurrency(venda.valorVenda)}</strong></span>
                      <span>Desconto: <strong className="text-success">{venda.desconto.toFixed(1)}%</strong></span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Senha Master: <strong className="text-primary">{venda.senhaMaster}</strong>
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleImprimirFicha(venda)} title="Imprimir Ficha Cadastral"
                      className="text-secondary hover:text-primary transition-colors p-1">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(venda.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs animate-fade-in">
                    {venda.corretor && <div><span className="text-muted-foreground">Corretor:</span> {venda.corretor}</div>}
                    {venda.torre && <div><span className="text-muted-foreground">Torre:</span> {venda.torre}</div>}
                    {venda.unidade && <div><span className="text-muted-foreground">Unidade:</span> {venda.unidade}</div>}
                    {venda.rg && <div><span className="text-muted-foreground">RG:</span> {venda.rg}</div>}
                    {venda.dataNascimento && <div><span className="text-muted-foreground">Nasc:</span> {venda.dataNascimento}</div>}
                    {venda.celular && <div><span className="text-muted-foreground">Cel:</span> {venda.celular}</div>}
                    {venda.telResidencial && <div><span className="text-muted-foreground">Tel:</span> {venda.telResidencial}</div>}
                    {venda.profissao && <div><span className="text-muted-foreground">Profissão:</span> {venda.profissao}</div>}
                    {venda.escolaridade && <div><span className="text-muted-foreground">Escolaridade:</span> {venda.escolaridade}</div>}
                    {venda.estadoCivil && <div><span className="text-muted-foreground">Estado Civil:</span> {venda.estadoCivil}</div>}
                    {venda.endRua && <div className="col-span-2"><span className="text-muted-foreground">Endereço:</span> {venda.endRua}, {venda.endNumero} {venda.endComplemento} — {venda.endBairro}, {venda.endCidade} {venda.endCep}</div>}
                    {venda.modalidade && <div><span className="text-muted-foreground">Modalidade:</span> {venda.modalidade.toUpperCase()}</div>}
                    {(venda.valorImovel > 0) && <div><span className="text-muted-foreground">Valor Imóvel:</span> {formatCurrency(venda.valorImovel)}</div>}
                    {(venda.valorFgts > 0) && <div><span className="text-muted-foreground">Valor FGTS:</span> {formatCurrency(venda.valorFgts)}</div>}
                    {venda.comoConheceu?.length > 0 && <div className="col-span-2"><span className="text-muted-foreground">Como conheceu:</span> {venda.comoConheceu.join(', ')}{venda.comoConheceuOutros ? `, ${venda.comoConheceuOutros}` : ''}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
