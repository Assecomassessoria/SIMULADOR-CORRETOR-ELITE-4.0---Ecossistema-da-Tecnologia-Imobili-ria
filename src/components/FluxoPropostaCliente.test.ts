import { describe, it, expect } from "vitest";
import {
  buildFluxoPrintHtml,
  buildFluxoWhatsAppMessage,
  computeFluxoProposta,
  createModeloSeries,
  formatPercentBr,
  maskBrlCurrencyInput,
  maskDateBrInput,
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
