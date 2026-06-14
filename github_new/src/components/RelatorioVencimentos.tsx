import React, { useState } from "react";
import { Calendar as CalendarIcon, Printer, X, Plus, Trash2 } from "lucide-react";
import { format, addMonths, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/eliteUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface VencimentoItem {
  tipo: string;
  valor: number;
  data: Date;
}

interface ParcelaIntermediaria {
  valor: number;
  data: Date | undefined;
}

interface RelatorioVencimentosProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "simulacao" | "prosoluto";
  simulacaoData?: {
    entradaConstrutora: number;
    atoClienteValor: number;
    sinalValor: number;
    intermediarias: number;
    parcInterm: number;
    valorIntermParc: number;
    chaves: number;
    valorObras: number;
    parcelasObras: number;
    fluxoObras: number;
    fluxoConstAdicional: number;
    totalFluxoObrasConst: number;
  };
  prosolutoData?: {
    opcao: number;
    entrada: number;
    sinal: number;
    intermediarias: number;
    qInter: number;
    parcInter: number;
    chaves: number;
    saldoObras: number;
    qObras: number;
    mensalObras: number;
  };
}

function DatePickerField({
  label,
  date,
  onSelect,
}: {
  label: string;
  date: Date | undefined;
  onSelect: (d: Date | undefined) => void;
}) {
  const [inputValue, setInputValue] = useState(date ? format(date, "dd/MM/yyyy") : "");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.slice(0, 8);
    if (val.length >= 5) {
      val = val.slice(0, 2) + "/" + val.slice(2, 4) + "/" + val.slice(4);
    } else if (val.length >= 3) {
      val = val.slice(0, 2) + "/" + val.slice(2);
    }
    setInputValue(val);

    if (val.length === 10) {
      const parsed = parse(val, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
        onSelect(parsed);
      }
    }
  };

  const handleCalendarSelect = (d: Date | undefined) => {
    onSelect(d);
    if (d) setInputValue(format(d, "dd/MM/yyyy"));
    else setInputValue("");
  };

  // Sync input when date changes externally
  React.useEffect(() => {
    if (date) setInputValue(format(date, "dd/MM/yyyy"));
  }, [date]);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-muted-foreground uppercase">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="DD/MM/AAAA"
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleCalendarSelect}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default function RelatorioVencimentos({
  isOpen,
  onClose,
  mode,
  simulacaoData,
  prosolutoData,
}: RelatorioVencimentosProps) {
  const [dataSinal, setDataSinal] = useState<Date | undefined>();
  const [dataChaves, setDataChaves] = useState<Date | undefined>();
  const [dataObrasInicio, setDataObrasInicio] = useState<Date | undefined>();
  const [parcIntermed, setParcIntermed] = useState<ParcelaIntermediaria[]>([
    { valor: 0, data: undefined },
  ]);

  const data = mode === "simulacao" ? simulacaoData : undefined;
  const dataPro = mode === "prosoluto" ? prosolutoData : undefined;

  const entradaValor = data?.entradaConstrutora ?? dataPro?.entrada ?? 0;
  const atoClienteValor = data?.atoClienteValor ?? 0;
  const sinalValor = data?.sinalValor ?? dataPro?.sinal ?? 0;
  const chavesValor = data?.chaves ?? dataPro?.chaves ?? 0;
  const qObras = data?.parcelasObras ?? dataPro?.qObras ?? 0;
  const mensalObras = data?.valorObras ?? dataPro?.mensalObras ?? 0;
  const totalInterm = data?.intermediarias ?? dataPro?.intermediarias ?? 0;
  const qInter = data?.parcInterm ?? dataPro?.qInter ?? 1;
  const valorParcInter = data?.valorIntermParc ?? dataPro?.parcInter ?? 0;
  const fluxoObras = data?.fluxoObras ?? 0;
  const fluxoConstAdicional = data?.fluxoConstAdicional ?? 0;
  const totalFluxoObrasConst = data?.totalFluxoObrasConst ?? 0;

  // Initialize intermediárias with correct quantity
  const syncParcelas = () => {
    const qty = qInter || 1;
    const valorUnitario = valorParcInter;
    const newParcs: ParcelaIntermediaria[] = [];
    for (let i = 0; i < qty; i++) {
      newParcs.push({
        valor: parcIntermed[i]?.valor || valorUnitario,
        data: parcIntermed[i]?.data,
      });
    }
    setParcIntermed(newParcs);
  };

  const addParcela = () => {
    setParcIntermed((prev) => [...prev, { valor: valorParcInter, data: undefined }]);
  };

  const removeParcela = (idx: number) => {
    setParcIntermed((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateParcelaData = (idx: number, d: Date | undefined) => {
    setParcIntermed((prev) => prev.map((p, i) => (i === idx ? { ...p, data: d } : p)));
  };

  const updateParcelaValor = (idx: number, v: number) => {
    setParcIntermed((prev) => prev.map((p, i) => (i === idx ? { ...p, valor: v } : p)));
  };

  const gerarRelatorio = () => {
    const items: VencimentoItem[] = [];

    // Sinal
    if (sinalValor > 0 && dataSinal) {
      items.push({ tipo: "Sinal", valor: sinalValor, data: dataSinal });
    }

    // Intermediárias
    parcIntermed.forEach((p, i) => {
      if (p.data && p.valor > 0) {
        items.push({ tipo: `Parcela Intermediária ${i + 1}`, valor: p.valor, data: p.data });
      }
    });

    // Chaves
    if (chavesValor > 0 && dataChaves) {
      items.push({ tipo: "Parcela de Chaves", valor: chavesValor, data: dataChaves });
    }

    // Obras
    if (mensalObras > 0 && dataObrasInicio && qObras > 0) {
      for (let i = 0; i < qObras; i++) {
        const dataVenc = addMonths(dataObrasInicio, i);
        items.push({ tipo: `Parcela Construtora ${i + 1}/${qObras}`, valor: mensalObras, data: dataVenc });
      }
    }

    // Sort chronologically
    items.sort((a, b) => a.data.getTime() - b.data.getTime());

    printRelatorio(items);
  };

  const printRelatorio = (items: VencimentoItem[]) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const totalGeral = items.reduce((acc, i) => acc + i.valor, 0);
    const titulo = mode === "prosoluto"
      ? `PRÓ-SOLUTO – Opção ${dataPro?.opcao ?? ""}`
      : "SIMULAÇÃO TÉCNICA";

    const rowsHtml = items
      .map(
        (item, idx) => `
      <tr>
        <td style="text-align:center;padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;">${idx + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;font-weight:600;">${item.tipo}</td>
        <td style="text-align:center;padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;">${format(item.data, "dd/MM/yyyy")}</td>
        <td style="text-align:right;padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;font-weight:700;">${formatCurrency(item.valor)}</td>
      </tr>`
      )
      .join("");

    printWindow.document.write(`<html><head><title>Relatório de Vencimentos</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        body { font-family: 'Poppins', Arial, sans-serif; padding: 20px; color: #0A192F; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 16px; text-align: center; border-bottom: 2px solid #C5A028; padding-bottom: 8px; margin-bottom: 4px; }
        h2 { font-size: 13px; text-align: center; color: #666; margin-bottom: 16px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; padding: 8px 12px; background: #f8f8f8; border-radius: 6px; font-size: 12px; }
        .info-row span { font-weight: 700; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #0A192F; color: #C5A028; padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        .total-row { background: #f0f0f0; font-weight: 700; }
        .total-row td { padding: 10px 8px; font-size: 13px; border-top: 2px solid #C5A028; }
        .footer { text-align: center; font-size: 9px; color: #888; margin-top: 24px; border-top: 1px solid #ddd; padding-top: 8px; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h1>💎 SIMULADOR CORRETOR DE ELITE 4.0</h1>
      <h2>RELATÓRIO DE VENCIMENTOS – ${titulo}</h2>

      <div class="info-row">
        <div>Entrada do Cliente: <span>${formatCurrency(entradaValor)}</span></div>
        ${atoClienteValor > 0 ? `<div>Ato Cliente: <span>${formatCurrency(atoClienteValor)}</span></div>` : ""}
        <div>Saldo Entrada: <span>${formatCurrency(Math.max(0, entradaValor - atoClienteValor))}</span></div>
      </div>
      ${fluxoObras > 0 || fluxoConstAdicional > 0 || totalFluxoObrasConst > 0 ? `
      <div class="info-row">
        <div>Fluxo Obras Const.: <span>${formatCurrency(fluxoObras)}</span></div>
        ${fluxoConstAdicional > 0 ? `<div>Fluxo Const. Adicional: <span>${formatCurrency(fluxoConstAdicional)}</span></div>` : ""}
        ${totalFluxoObrasConst > 0 ? `<div>Total Fluxo Obras: <span>${formatCurrency(totalFluxoObrasConst)}</span></div>` : ""}
      </div>` : ""}
      ${totalInterm > 0 ? `
      <div class="info-row">
        <div>Total Intermediárias: <span>${formatCurrency(totalInterm)}</span></div>
        <div>Parcelas: <span>${qInter}x de ${formatCurrency(valorParcInter)}</span></div>
      </div>` : ""}
      ${chavesValor > 0 ? `
      <div class="info-row">
        <div>Parcela Chaves: <span>${formatCurrency(chavesValor)}</span></div>
      </div>` : ""}
      <div class="info-row">
        <div>Total Parcelas: <span>${items.length}</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align:center;width:40px;">#</th>
            <th style="text-align:left;">Tipo de Parcela</th>
            <th style="text-align:center;width:120px;">Data Vencimento</th>
            <th style="text-align:right;width:140px;">Valor (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="total-row">
            <td colspan="3" style="text-align:right;">TOTAL GERAL</td>
            <td style="text-align:right;">${formatCurrency(totalGeral)}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        Data de emissão: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}<br/>
        © INFORMETEC - Tecnologia das Informações Mercantis - CNPJ 00.921.557/0001-95<br/>
        LOURENCO JUNIOR - Consultor Imobiliário (CRECI/SP 237.626-F) | Simulador Corretor de Elite 4.0
      </div>
    </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleOpen = () => {
    // Sync intermediárias quantity on open
    const qty = qInter || 1;
    const newParcs: ParcelaIntermediaria[] = [];
    for (let i = 0; i < qty; i++) {
      newParcs.push({
        valor: parcIntermed[i]?.valor || valorParcInter,
        data: parcIntermed[i]?.data,
      });
    }
    setParcIntermed(newParcs);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); else handleOpen(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold uppercase tracking-wider text-primary">
            📋 Relatório de Vencimentos
            {mode === "prosoluto" && dataPro && (
              <span className="text-gold ml-2">– Opção {dataPro.opcao}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Entrada (read-only) */}
          <div className="bg-muted p-3 rounded-md space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase">Entrada do Cliente</label>
              <p className="text-sm font-bold text-primary">{formatCurrency(entradaValor)}</p>
            </div>
            {atoClienteValor > 0 && (
              <div className="flex justify-between">
                <label className="text-xs text-muted-foreground">Ato Cliente</label>
                <p className="text-sm font-semibold text-primary">{formatCurrency(atoClienteValor)}</p>
              </div>
            )}
            <div className="flex justify-between">
              <label className="text-xs text-muted-foreground">Saldo Entrada</label>
              <p className="text-sm font-semibold text-primary">{formatCurrency(Math.max(0, entradaValor - atoClienteValor))}</p>
            </div>
            {(fluxoObras > 0 || totalFluxoObrasConst > 0) && (
              <>
                <div className="flex justify-between">
                  <label className="text-xs text-muted-foreground">Fluxo Obras Const.</label>
                  <p className="text-sm font-semibold text-primary">{formatCurrency(fluxoObras)}</p>
                </div>
                {fluxoConstAdicional > 0 && (
                  <div className="flex justify-between">
                    <label className="text-xs text-muted-foreground">Fluxo Const. Adicional</label>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(fluxoConstAdicional)}</p>
                  </div>
                )}
                <div className="flex justify-between">
                  <label className="text-xs text-muted-foreground">Total Fluxo Obras</label>
                  <p className="text-sm font-semibold text-primary">{formatCurrency(totalFluxoObrasConst)}</p>
                </div>
              </>
            )}
          </div>

          {/* Sinal */}
          {sinalValor > 0 && (
            <div className="bg-card border border-border p-3 rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase">Sinal</span>
                <span className="text-sm font-bold text-primary">{formatCurrency(sinalValor)}</span>
              </div>
              <DatePickerField label="Data do Sinal" date={dataSinal} onSelect={setDataSinal} />
            </div>
          )}

          {/* Parcelas Intermediárias */}
          {totalInterm > 0 && (
            <div className="bg-card border border-border p-3 rounded-md space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase">Parcelas Intermediárias</span>
                <button
                  onClick={addParcela}
                  className="flex items-center gap-1 text-[10px] font-bold text-gold hover:text-gold-bright"
                >
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>
              {parcIntermed.map((p, idx) => (
                <div key={idx} className="flex items-end gap-2 bg-muted p-2 rounded">
                  <div className="flex-1">
                    <DatePickerField
                      label={`Parcela ${idx + 1} – ${formatCurrency(p.valor)}`}
                      date={p.data}
                      onSelect={(d) => updateParcelaData(idx, d)}
                    />
                  </div>
                  {parcIntermed.length > 1 && (
                    <button
                      onClick={() => removeParcela(idx)}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Chaves */}
          {chavesValor > 0 && (
            <div className="bg-card border border-border p-3 rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase">Parcela de Chaves</span>
                <span className="text-sm font-bold text-primary">{formatCurrency(chavesValor)}</span>
              </div>
              <DatePickerField label="Data das Chaves" date={dataChaves} onSelect={setDataChaves} />
            </div>
          )}

          {/* Parcelas Obras */}
          {qObras > 0 && mensalObras > 0 && (
            <div className="bg-card border border-border p-3 rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase">
                  Saldo Parcela Construtora ({qObras}x)
                </span>
                <span className="text-sm font-bold text-primary">{formatCurrency(mensalObras)}/mês</span>
              </div>
              <DatePickerField
                label="Data da 1ª Parcela Construtora"
                date={dataObrasInicio}
                onSelect={setDataObrasInicio}
              />
              <p className="text-[10px] text-muted-foreground">
                As demais parcelas serão geradas automaticamente a cada 30 dias.
              </p>
            </div>
          )}

          {/* Gerar button */}
          <Button
            onClick={gerarRelatorio}
            className="w-full gold-gradient text-primary font-bold uppercase tracking-wider"
          >
            <Printer className="w-4 h-4 mr-2" /> Gerar Relatório de Vencimentos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
