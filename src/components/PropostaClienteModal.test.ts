import { describe, it, expect } from "vitest";
import {
  PROPOSTA_DISCLAIMER_LINE_1,
  PROPOSTA_DISCLAIMER_LINE_2,
  buildPropostaClienteData,
  buildPropostaPrintHtml,
  buildPropostaWhatsAppMessage,
  buildPropostaWhatsAppUrl,
  computePropostaDates,
  escapeHtml,
  generatePropostaNumero,
  normalizeBrazilianWhatsApp,
} from "./PropostaClienteModal";

const sampleFields = {
  infoEmp: "Residencial Vista Verde",
  infoCli: "Maria Oliveira",
  infoM2: "48",
  infoAndar: "8º Andar",
  infoApto: "Apto 804",
  infoCons: "João Silva",
  infoCreci: "237.626-F",
  infoCpf: "123.456.789-00",
  avaliacao: "R$ 320.000,00",
  lancamento: "R$ 295.000,00",
  campanha: "R$ 5.000,00",
  aprovacao: "R$ 210.000,00",
  fgts: "R$ 25.000,00",
  subsidio: "R$ 10.000,00",
  casa: "R$ 5.000,00",
  parcelaCaixa: "R$ 1.850,00",
  resultPercentual: "5",
  atoCliente: "R$ 5.000,00",
  intermediarias: "R$ 6.000,00",
  chaves: "R$ 4.000,00",
  parcInterm: "2",
  parcelasObras: "24",
  planoMesesPosObras: "36",
  valorObrasManual: "",
};

const sampleResults = {
  totalAprov: 250000,
  entradaConstrutora: 40000,
  atoClienteValor: 5000,
  sinalValor: 14500,
  valorIntermParc: 3000,
  valorObras: 437.5,
  totalPosObras: 14500,
  prestacaoEstimadaPosObras: 402.78,
};

describe("PropostaClienteModal helpers", () => {
  it("generates a formatted proposal number matching PROP-YYYYMMDD-XXXX", () => {
    const fixedDate = new Date(2026, 10, 20);
    const num = generatePropostaNumero(fixedDate);
    expect(num).toMatch(/^PROP-20261120-\d{4}$/);
  });

  it("computes emission and validity dates accurately", () => {
    const fixedDate = new Date(2026, 10, 20);
    const { emitidaEm, validaAte } = computePropostaDates(7, fixedDate);
    expect(emitidaEm).toBe("20/11/2026");
    expect(validaAte).toBe("27/11/2026");
  });

  it("normalizes Brazilian WhatsApp phone numbers and rejects invalid short inputs", () => {
    expect(normalizeBrazilianWhatsApp("(11) 98765-4321")).toBe("5511987654321");
    expect(normalizeBrazilianWhatsApp("5511987654321")).toBe("5511987654321");
    expect(normalizeBrazilianWhatsApp("12345")).toBe("");
  });

  it("builds complete proposal data and formatted WhatsApp message with official footer", () => {
    const data = buildPropostaClienteData({
      fields: sampleFields,
      results: sampleResults,
      numeroProposta: "PROP-20261120-1142",
      validadeDias: 7,
      construtora: "Construtora Elite",
      observacoes: "Documentação grátis na campanha.",
      baseDate: new Date(2026, 10, 20),
    });

    expect(data.unidadeAndar).toBe("Apto 804 / 8º Andar");
    expect(data.areaM2).toBe("48 m²");
    expect(data.planoPosEntregaTexto).toBe("36 meses");
    expect(data.corretorNome).toBe("João Silva");
    expect(data.corretorCreci).toBe("237.626-F");

    const msg = buildPropostaWhatsAppMessage(data);
    expect(msg).toContain("PROP-20261120-1142");
    expect(msg).toContain("Maria Oliveira");
    expect(msg).toContain("Residencial Vista Verde");
    expect(msg).toContain("FINANCIAMENTO CAIXA");
    expect(msg).toContain("ENTRADA CONSTRUTORA");
    expect(msg).toContain("PARC. PÓS-ENTREGA");
    expect(msg).toContain("Documentação grátis na campanha.");
    expect(msg).toContain("CRECI: 237.626-F");
    expect(msg).toContain(PROPOSTA_DISCLAIMER_LINE_1);
    expect(msg).toContain(PROPOSTA_DISCLAIMER_LINE_2);

    const url = buildPropostaWhatsAppUrl("(11) 98765-4321", msg);
    expect(url).toMatch(/^https:\/\/wa\.me\/5511987654321\?text=/);
  });

  it("generates sanitized A4 print HTML with watermark and exact disclaimer", () => {
    const data = buildPropostaClienteData({
      fields: { ...sampleFields, infoCli: '<script>alert("x")</script>Maria' },
      results: sampleResults,
      numeroProposta: "PROP-20261120-1142",
      validadeDias: 7,
      construtora: "Construtora Elite",
      observacoes: "",
      baseDate: new Date(2026, 10, 20),
    });

    const html = buildPropostaPrintHtml(data, "/logo-elite.jpg");
    expect(html).toContain("size: A4 portrait");
    expect(html).toContain("/logo-elite.jpg");
    expect(html).toContain(PROPOSTA_DISCLAIMER_LINE_1);
    expect(html).toContain(PROPOSTA_DISCLAIMER_LINE_2);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain(escapeHtml('<script>alert("x")</script>Maria'));

    const autoPrintHtml = buildPropostaPrintHtml(data, "/logo-elite.jpg", null, { autoPrint: true });
    expect(autoPrintHtml).toContain("Selecionar Impressora / Imprimir A4");
    expect(autoPrintHtml).toContain("window.print()");
  });
});

