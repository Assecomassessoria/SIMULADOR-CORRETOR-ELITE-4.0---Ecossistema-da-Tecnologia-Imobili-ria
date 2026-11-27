import { describe, it, expect } from "vitest";
import {
  applyRowFocusMensalSaldo,
  applyRowManualValorChange,
  applyRowQtdChange,
  applySerieNameChange,
  applyUsarSaldoNaLinha,
  buildFluxoPrintHtml,
  buildFluxoWhatsAppMessage,
  computeFluxoProposta,
  createBlankSeries,
  createMensalSeriesWithSaldo,
  createModeloSeries,
  formatBrlInputFromNumber,
  formatPercentBr,
  isMensalSerie,
  maskBrlCurrencyInput,
  maskDateBrInput,
  type FluxoSerieRow,
} from "./FluxoPropostaCliente";
import {
  PROPOSTA_DISCLAIMER_LINE_1,
  PROPOSTA_DISCLAIMER_LINE_2,
} from "./PropostaClienteModal";

describe("FluxoPropostaCliente calculations and helpers", () => {
  it("matches every exact percentage and total from the R$ 275.000,00 reference model", () => {
    const summary = computeFluxoProposta("R$ 275.000,00", createModeloSeries());

    expect(summary.valorContrato).toBe(275000);
    expect(summary.rows.map((r) => [r.serie, r.percentualTexto])).toEqual([
      ["Ato", "1,45%"],
      ["Mensal", "9,84%"],
      ["Semestral", "6,55%"],
      ["Anual", "4,12%"],
      ["Financiamento", "74,18%"],
      ["FGTS", "3,86%"],
    ]);
    expect(summary.totalValor).toBe(275000);
    expect(formatPercentBr(summary.totalPercentual)).toBe("100,00%");
    expect(summary.diferencaValor).toBe(0);
    expect(summary.isBalanced).toBe(true);
  });

  it("formats R$ currency typing safely without NaN", () => {
    expect(maskBrlCurrencyInput("")).toBe("");
    expect(maskBrlCurrencyInput("000")).toBe("");
    expect(maskBrlCurrencyInput("67630")).toBe("R$ 676,30");
    expect(maskBrlCurrencyInput("400000")).toBe("R$ 4.000,00");
    expect(maskBrlCurrencyInput("27500000")).toBe("R$ 275.000,00");
    expect(maskBrlCurrencyInput("R$ 11.320,95")).toBe("R$ 11.320,95");
    expect(formatBrlInputFromNumber(3000)).toBe("R$ 3.000,00");
    expect(formatBrlInputFromNumber(300)).toBe("R$ 300,00");
    expect(formatBrlInputFromNumber(0)).toBe("");
  });

  it("formats dd/mm/aaaa date typing cleanly", () => {
    expect(maskDateBrInput("12112026")).toBe("12/11/2026");
    expect(maskDateBrInput("2512")).toBe("25/12");
    expect(maskDateBrInput("25/01/2030")).toBe("25/01/2030");
  });

  it("recalculates percentages and reports remaining balance when contract value changes", () => {
    const summary = computeFluxoProposta("R$ 300.000,00", [
      { id: "1", serie: "Ato", qtd: "1", valor: "R$ 30.000,00", vencimento: "10/12/2026" },
      { id: "2", serie: "Mensal", qtd: "20", valor: "R$ 1.500,00", vencimento: "10/01/2027" },
    ]);

    expect(summary.rows[0].percentualTexto).toBe("10,00%");
    expect(summary.rows[1].subtotal).toBe(30000);
    expect(summary.rows[1].percentualTexto).toBe("10,00%");
    expect(summary.totalValor).toBe(60000);
    expect(formatPercentBr(summary.totalPercentual)).toBe("20,00%");
    expect(summary.diferencaValor).toBe(240000);
    expect(summary.isBalanced).toBe(false);
  });

  it("pulls Saldo pendente when typing or including Mensal and divides automatically by QTD", () => {
    expect(isMensalSerie("Mensal")).toBe(true);
    expect(isMensalSerie("  mensal  ")).toBe(true);
    expect(isMensalSerie("Mensais")).toBe(true);
    expect(isMensalSerie("Semestral")).toBe(false);

    const valorContrato = "R$ 10.000,00";
    const initialRows: FluxoSerieRow[] = [
      { id: "ato", serie: "Ato", qtd: "1", valor: "R$ 7.000,00", vencimento: "" },
      { id: "extra", serie: "", qtd: "1", valor: "", vencimento: "" },
    ];

    // Typing "Mensal" automatically pulls Saldo pendente (R$ 3.000,00)
    const afterName = applySerieNameChange(valorContrato, initialRows, "extra", "Mensal");
    expect(afterName[1].valor).toBe("R$ 3.000,00");
    expect(afterName[1].autoDivideSaldo).toBe(true);

    // Backspacing QTD ("") and typing "10" divides R$ 3.000,00 by 10 -> R$ 300,00
    const afterClearQtd = applyRowQtdChange(valorContrato, afterName, "extra", "");
    expect(afterClearQtd[1].qtd).toBe("");
    expect(afterClearQtd[1].autoDivideSaldo).toBe(true);

    const afterQtd10 = applyRowQtdChange(valorContrato, afterClearQtd, "extra", "10");
    expect(afterQtd10[1].qtd).toBe("10");
    expect(afterQtd10[1].valor).toBe("R$ 300,00");

    const summary = computeFluxoProposta(valorContrato, afterQtd10);
    expect(summary.rows[1].subtotal).toBe(3000);
    expect(summary.totalValor).toBe(10000);
    expect(summary.isBalanced).toBe(true);
  });

  it("populates blank Mensal row on focus/incluir and preserves manual edits with 1-click re-sync", () => {
    const valorContrato = "R$ 3.000,00";
    const blank = createBlankSeries();

    // Focusing blank Mensal pulls R$ 3.000,00
    const afterFocus = applyRowFocusMensalSaldo(valorContrato, blank, "mensal");
    const mensalAfterFocus = afterFocus.find((r) => r.id === "mensal")!;
    expect(mensalAfterFocus.valor).toBe("R$ 3.000,00");

    // Setting QTD to 10 divides to R$ 300,00 (100,00% of R$ 3.000,00)
    const afterQtd10 = applyRowQtdChange(valorContrato, afterFocus, "mensal", "10");
    const summary10 = computeFluxoProposta(valorContrato, afterQtd10);
    const mensal10 = summary10.rows.find((r) => r.id === "mensal")!;
    expect(mensal10.valor).toBe("R$ 300,00");
    expect(mensal10.subtotal).toBe(3000);
    expect(mensal10.percentualTexto).toBe("100,00%");

    // Manual edit disables auto-division so broker's custom value is respected
    const afterManual = applyRowManualValorChange(afterQtd10, "mensal", "25000");
    const mensalManual = afterManual.find((r) => r.id === "mensal")!;
    expect(mensalManual.valor).toBe("R$ 250,00");
    expect(mensalManual.autoDivideSaldo).toBe(false);

    // Changing QTD after manual edit keeps the manual R$ 250,00 unit price
    const afterQtd12Manual = applyRowQtdChange(valorContrato, afterManual, "mensal", "12");
    expect(afterQtd12Manual.find((r) => r.id === "mensal")!.valor).toBe("R$ 250,00");

    // 1-click "Dividir saldo" restores exact division for current QTD
    const afterReSync = applyUsarSaldoNaLinha(valorContrato, afterQtd12Manual, "mensal");
    expect(afterReSync.find((r) => r.id === "mensal")!.valor).toBe("R$ 250,00");

    const afterQtd15 = applyRowQtdChange(valorContrato, afterReSync, "mensal", "15");
    expect(afterQtd15.find((r) => r.id === "mensal")!.valor).toBe("R$ 200,00");

    // Including a brand-new Mensal row directly pre-fills Saldo pendente
    const newMensal = createMensalSeriesWithSaldo(
      "R$ 5.000,00",
      [{ id: "ato", serie: "Ato", qtd: "1", valor: "R$ 2.000,00", vencimento: "" }],
      "mensal-new",
    );
    expect(newMensal.serie).toBe("Mensal");
    expect(newMensal.valor).toBe("R$ 3.000,00");
    expect(newMensal.autoDivideSaldo).toBe(true);
  });

  it("builds formatted WhatsApp text and sanitized A4 print HTML with watermark and footer", () => {
    const summary = computeFluxoProposta("R$ 275.000,00", createModeloSeries());

    const wa = buildFluxoWhatsAppMessage({
      cliente: "Maria Oliveira",
      empreendimento: "Residencial Elite",
      summary,
    });
    expect(wa).toContain("CONDIÇÕES PROPOSTAS");
    expect(wa).toMatch(/R\$\s*275\.000,00/);
    expect(wa).toContain("1,45%");
    expect(wa).toContain("74,18%");
    expect(wa).toContain(PROPOSTA_DISCLAIMER_LINE_1);
    expect(wa).toContain(PROPOSTA_DISCLAIMER_LINE_2);

    const html = buildFluxoPrintHtml({
      cliente: '<script>alert("xss")</script>Maria',
      empreendimento: "Residencial Elite",
      summary,
      watermarkSrc: "/logo-elite.jpg",
      autoPrint: true,
    });
    expect(html).toContain("CONDIÇÕES PROPOSTAS");
    expect(html).toContain("CONTRATO:");
    expect(html).toContain("size: A4 portrait");
    expect(html).toContain("/logo-elite.jpg");
    expect(html).toContain("window.print()");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain(PROPOSTA_DISCLAIMER_LINE_1);
    expect(html).toContain(PROPOSTA_DISCLAIMER_LINE_2);
  });
});

