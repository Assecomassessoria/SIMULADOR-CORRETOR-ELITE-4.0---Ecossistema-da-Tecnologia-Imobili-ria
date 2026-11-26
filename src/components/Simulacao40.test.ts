import { describe, it, expect } from "vitest";
import {
  calcularPrazoMaxPorIdade,
  calcularSimulacaoRapida40,
  formatarMoedaSimulacao40,
  parseMoedaSimulacao40,
} from "./Simulacao40";
import { DEFAULT_MCMV_RULES } from "@/lib/eliteUtils";

describe("Simulacao40 (Simulação Rápida 4.0)", () => {
  const fixedToday = new Date(2026, 10, 26);

  it("calculates PRICE simulation accurately without throwing ReferenceError", () => {
    const res = calcularSimulacaoRapida40({
      imovel: 250000,
      renda: 4200,
      dataNascimento: "1995-06-15",
      dependentes: true,
      prazoInformado: 420,
      sistema: "PRICE",
      rules: DEFAULT_MCMV_RULES,
      hoje: fixedToday,
    });

    expect(res.ok).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data!.faixa).toBe("Faixa 2");
    expect(res.data!.meses).toBe(420);
    expect(res.data!.vFinan).toBeGreaterThan(0);
    expect(res.data!.vFinan).toBeLessThanOrEqual(250000 * 0.8);
    expect(res.data!.prestacao).toBeGreaterThan(0);
    expect(Number.isFinite(res.data!.prestacao)).toBe(true);
    expect(res.data!.entrada).toBeGreaterThanOrEqual(0);
  });

  it("calculates SAC simulation and applies age limit accurately", () => {
    const prazoMax = calcularPrazoMaxPorIdade("1960-01-10", fixedToday);
    expect(prazoMax).not.toBeNull();
    expect(prazoMax!).toBeLessThan(420);
    expect(prazoMax!).toBeGreaterThan(100);

    const res = calcularSimulacaoRapida40({
      imovel: 350000,
      renda: 8500,
      dataNascimento: "1960-01-10",
      dependentes: false,
      prazoInformado: 420,
      sistema: "SAC",
      rules: DEFAULT_MCMV_RULES,
      hoje: fixedToday,
    });

    expect(res.ok).toBe(true);
    expect(res.data!.faixa).toBe("Faixa 3");
    expect(res.data!.meses).toBe(prazoMax);
    expect(res.data!.prestacao).toBeGreaterThan(0);
  });

  it("returns friendly validation errors for missing fields or age above limit", () => {
    expect(
      calcularSimulacaoRapida40({
        imovel: 0,
        renda: 5000,
        dataNascimento: "1990-01-01",
        dependentes: true,
        prazoInformado: 420,
        sistema: "PRICE",
        rules: DEFAULT_MCMV_RULES,
        hoje: fixedToday,
      }).ok,
    ).toBe(false);

    expect(
      calcularSimulacaoRapida40({
        imovel: 250000,
        renda: 0,
        dataNascimento: "1990-01-01",
        dependentes: true,
        prazoInformado: 420,
        sistema: "PRICE",
        rules: DEFAULT_MCMV_RULES,
        hoje: fixedToday,
      }).ok,
    ).toBe(false);

    expect(
      calcularSimulacaoRapida40({
        imovel: 250000,
        renda: 5000,
        dataNascimento: "",
        dependentes: true,
        prazoInformado: 420,
        sistema: "PRICE",
        rules: DEFAULT_MCMV_RULES,
        hoje: fixedToday,
      }).ok,
    ).toBe(false);

    expect(
      calcularSimulacaoRapida40({
        imovel: 250000,
        renda: 5000,
        dataNascimento: "1940-01-01",
        dependentes: true,
        prazoInformado: 420,
        sistema: "PRICE",
        rules: DEFAULT_MCMV_RULES,
        hoje: fixedToday,
      }).ok,
    ).toBe(false);
  });

  it("formats and parses currency safely without NaN", () => {
    expect(formatarMoedaSimulacao40("")).toBe("");
    expect(formatarMoedaSimulacao40("25000000")).toBe("250.000,00");
    expect(parseMoedaSimulacao40("250.000,00")).toBe(250000);
  });
});
