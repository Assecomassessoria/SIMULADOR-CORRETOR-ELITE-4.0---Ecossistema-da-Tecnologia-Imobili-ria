import { jsPDF } from "jspdf";
import { OFFICIAL_LOGO_LOCAL, OFFICIAL_LOGO_PWA, OFFICIAL_LOGO_URL } from "@/components/SystemLogo";

async function loadLogoDataUrl(): Promise<string | null> {
  const sources = [OFFICIAL_LOGO_LOCAL, OFFICIAL_LOGO_PWA, OFFICIAL_LOGO_URL];
  for (const src of sources) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.crossOrigin = "anonymous";
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Image load failed"));
        el.src = src;
      });
      const size = 360;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0, size, size);
      ctx.restore();

      return canvas.toDataURL("image/png");
    } catch {
      // Try next fallback
    }
  }
  return null;
}

interface FeatureCard {
  title: string;
  subtitle: string;
  bullets: string[];
}

const PAGE2_FEATURES: FeatureCard[] = [
  {
    title: "1. Simulação Técnica Completa (5 Blocos)",
    subtitle: "Precisão total do financiamento CAIXA até a entrega das chaves",
    bullets: [
      "Identificação do empreendimento, unidade, área (m²), cliente e CRECI do corretor.",
      "Cálculo CAIXA completo: aprovação, FGTS, Subsídio Federal (MCMV) e Estadual.",
      "Composição detalhada da Entrada Construtora: ato, sinal, parcelas de obras, intermediárias e chaves.",
      "Planejamento de Parcelas Pós-Entrega com prazo configurável e prestação estimada.",
    ],
  },
  {
    title: "2. Proposta para o Cliente em 1 Clique",
    subtitle: "Documento pronto para fechamento comercial imediato",
    bullets: [
      "Preenchimento automático com todos os dados da simulação técnica.",
      "Número de proposta, validade em dias ajustável, construtora e campo de observações.",
      "Impressão A4 em folha única, download de PDF vetorial e envio formatado para WhatsApp.",
      "Marca d'água suave oficial do simulador, assinaturas (Cliente e Corretor/CRECI) e aviso legal.",
    ],
  },
  {
    title: "3. Simulação Rápida 4.0 (MCMV 2026 & SBPE)",
    subtitle: "Atendimento ágil em segundos na mesa de negociação",
    bullets: [
      "Enquadramento automático nas Faixas 1, 2, 3, 4 (Classe Média) do MCMV e SBPE.",
      "Sistemas PRICE e SAC com cálculo de subsídio, cota de 80% e limite de 30% da renda.",
      "Ajuste automático do prazo máximo conforme a idade do comprador (regra dos 80 anos e 6 meses).",
      "Painel administrativo interno para atualização de taxas e limites das faixas MCMV.",
    ],
  },
  {
    title: "4. Simulação Customizável & Pró-Soluto Inteligente",
    subtitle: "Flexibilidade comercial para qualquer tabela de construtora",
    bullets: [
      "Comparativo instantâneo SAC × PRICE e ajustes personalizados de percentuais e entrada.",
      "Pró-Soluto com 4 cenários simultâneos de parcelamento e validação de comprometimento de renda.",
      "Cálculo de evolução de obra e parcelamento sob medida para fechamento sem ruído.",
      "Relatórios de vencimentos e modelos prontos de apresentação para o cliente.",
    ],
  },
];

const PAGE3_FEATURES: FeatureCard[] = [
  {
    title: "5. Fluxo / Proposta Cliente (Condições Propostas com %)",
    subtitle: "Planilha interativa com percentuais automáticos sobre o contrato",
    bullets: [
      "Digitação direta em Reais (R$) para Valor do Contrato e cada série de pagamento.",
      "Séries padrão (Ato, Mensal, Semestral, Anual, Financiamento, FGTS) + adição livre de novas séries.",
      "Cálculo em tempo real de cada percentual (PORC. %), subtotal das parcelas e fechamento 100%.",
      "Exportação em Impressão A4, PDF no padrão comercial de construtoras e WhatsApp.",
    ],
  },
  {
    title: "6. Gestão de Vendas & Ficha Cadastral Completa",
    subtitle: "Organização profissional da carteira do corretor e da imobiliária",
    bullets: [
      "Ficha cadastral completa do comprador (dados pessoais, endereço, renda bruta/informal, FGTS).",
      "Cálculo automático de desconto comercial e geração de Senha Master da venda.",
      "Busca instantânea por nome, CPF ou e-mail, impressão da ficha em A4 e exportação CSV.",
      "Histórico de vendas sempre acessível no computador, tablet ou celular.",
    ],
  },
  {
    title: "7. Dashboard Executivo & CRM Pessoal com Kanban",
    subtitle: "Visibilidade de funil, metas e acompanhamento de leads",
    bullets: [
      "Dashboard visual com composição de financiamento, entrada e desempenho comercial.",
      "CRM com cadastro de leads, bloqueio de duplicidade e funil Kanban da prospecção ao fechamento.",
      "Agenda de tarefas e follow-ups com controle de vencimentos e histórico de atendimentos.",
      "Cadastro de construtoras, empreendimentos e relatórios gerenciais de conversão.",
    ],
  },
  {
    title: "8. Documentos Oficiais CAIXA Prontos para Imprimir",
    subtitle: "Agilidade documental sem retrabalho manual",
    bullets: [
      "Ficha Cadastral CAIXA (padrão e editável) preenchida a partir da simulação.",
      "Ficha MO (Autorização para Pesquisa Cadastral), Declaração de Renda Informal e Residência.",
      "Carta de Cancelamento SICAQ e envio rápido de instruções pelo WhatsApp.",
      "Tour guiado interativo para onboarding rápido de novos corretores na equipe.",
    ],
  },
];

const PAGE4_FEATURES: FeatureCard[] = [
  {
    title: "9. Luiza IA & Central de Marketing Imobiliário",
    subtitle: "Produtividade e comunicação profissional todos os dias",
    bullets: [
      "Assistente Luiza Elite voltada à rotina comercial imobiliária e atendimento consultivo.",
      "Central de Marketing integrada para campanhas, scripts e materiais de divulgação.",
      "Apresentação comercial interativa e exportável para apresentação a clientes e parceiros.",
      "Aplicativo PWA instalável: funciona com fluidez em Desktop, Tablet e Smartphone.",
    ],
  },
  {
    title: "10. Arquitetura Multi-Tenant & Segurança de Acesso",
    subtitle: "Isolamento total de dados entre imobiliárias e corretores",
    bullets: [
      "Acesso exclusivo para clientes e corretores autorizados após confirmação em simuladorcorretorelite.com.br.",
      "Cada Imobiliária (IMOB-XXXX) e cada Corretor (CORR-XXXX) possui ID próprio e ambiente isolado.",
      "Autenticação híbrida: criação de senha pessoal ou login com Google vinculado ao contrato.",
      "Bancos dedicados (Corretor Elite e Administrativo) com gestão de planos, limites e vigência.",
    ],
  },
];

/**
 * Generates a polished, multi-page A4 commercial/marketing PDF showcasing all
 * capabilities of Simulador Corretor de Elite 4.0.
 */
export async function exportSistemaMarketingPdf(): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const contentW = pageW - margin * 2;

  const NAVY: [number, number, number] = [10, 25, 47];
  const NAVY_CARD: [number, number, number] = [16, 36, 66];
  const GOLD: [number, number, number] = [197, 160, 40];
  const GOLD_SOFT: [number, number, number] = [236, 206, 114];
  const SLATE_DARK: [number, number, number] = [15, 23, 42];
  const SLATE_TEXT: [number, number, number] = [51, 65, 85];
  const SLATE_MUTED: [number, number, number] = [100, 116, 139];

  const logoDataUrl = await loadLogoDataUrl();

  const drawContentHeader = (pageTitle: string, pageSubtitle: string, pageNum: number) => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setFillColor(...GOLD);
    doc.rect(0, 28, pageW, 1.4, "F");

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", margin, 5, 18, 18, undefined, "FAST");
    }

    const textX = logoDataUrl ? margin + 22 : margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...GOLD_SOFT);
    doc.text(pageTitle, textX, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(pageSubtitle, textX, 19.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text(`Página ${pageNum} / 4`, pageW - margin, 15.5, { align: "right" });
  };

  const drawFooter = () => {
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 16, pageW - margin, pageH - 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text("SIMULADOR CORRETOR DE ELITE 4.0  ·  VENDA SEGURA", margin, pageH - 10.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_MUTED);
    doc.text("simuladorcorretorelite.com.br  |  (11) 94677-0656", pageW - margin, pageH - 10.5, {
      align: "right",
    });
  };

  const drawFeatureCard = (y: number, card: FeatureCard): number => {
    const bulletLines: string[][] = card.bullets.map((b) =>
      doc.splitTextToSize(`•  ${b}`, contentW - 12),
    );
    const totalBulletLines = bulletLines.reduce((acc, l) => acc + l.length, 0);
    const cardH = 19 + totalBulletLines * 4.7 + card.bullets.length * 1.4;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.roundedRect(margin, y, contentW, cardH, 2.5, 2.5, "FD");

    // Top gold rule inside card
    doc.setFillColor(...GOLD);
    doc.rect(margin, y, contentW, 1.2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...NAVY);
    doc.text(card.title, margin + 5, y + 7.5);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.2);
    doc.setTextColor(146, 114, 24);
    doc.text(card.subtitle, margin + 5, y + 12.5);

    let lineY = y + 18.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.6);
    doc.setTextColor(...SLATE_TEXT);

    bulletLines.forEach((lines) => {
      doc.text(lines, margin + 5, lineY);
      lineY += lines.length * 4.7 + 1.4;
    });

    return y + cardH + 5.5;
  };

  /* ═══════════════════════ PÁGINA 1 — CAPA COMERCIAL ═══════════════════════ */
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, pageH, "F");

  // Outer gold frame
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.roundedRect(10, 10, pageW - 20, pageH - 20, 4, 4, "S");

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", (pageW - 46) / 2, 26, 46, 46, undefined, "FAST");
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...GOLD);
  doc.text("APRESENTAÇÃO COMERCIAL  ·  CATÁLOGO DE FUNCIONALIDADES", pageW / 2, 84, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text("SIMULADOR CORRETOR", pageW / 2, 100, { align: "center" });
  doc.setTextColor(...GOLD_SOFT);
  doc.text("DE ELITE 4.0", pageW / 2, 112, { align: "center" });

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(pageW / 2 - 36, 119, pageW / 2 + 36, 119);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11.5);
  doc.setTextColor(226, 232, 240);
  const heroDesc = doc.splitTextToSize(
    "A plataforma completa para Construtoras, Imobiliárias e Corretores simularem financiamentos CAIXA (MCMV 2026 & SBPE), montarem fluxos de pagamento com percentuais, emitirem propostas A4/PDF/WhatsApp e gerenciarem vendas com segurança Multi-Tenant.",
    154,
  );
  doc.text(heroDesc, pageW / 2, 130, { align: "center" });

  // 4 highlight pillar cards on cover
  const pillars = [
    {
      k: "SIMULAÇÕES 4.0",
      t: "Técnica, Rápida & Custom",
      d: "PRICE/SAC, Faixas 1 a 4 MCMV, SBPE, subsídio, FGTS e Pró-Soluto em 4 cenários.",
    },
    {
      k: "FECHAMENTO IMEDIATO",
      t: "Proposta A4, PDF & WhatsApp",
      d: "Proposta comercial do cliente + Fluxo com percentuais sobre o contrato prontos para envio.",
    },
    {
      k: "GESTÃO & CRM",
      t: "Vendas, Funil & Dashboard",
      d: "Ficha cadastral completa, CRM Kanban, documentos CAIXA prontos e indicadores visuais.",
    },
    {
      k: "MULTI-TENANT",
      t: "Acesso Isolado e Seguro",
      d: "ID exclusivo por Imobiliária e Corretor, senha pessoal, login Google e zero vazamento de dados.",
    },
  ];

  const pGap = 6;
  const pW = (contentW - pGap) / 2;
  const pH = 34;
  const py = 160;
  pillars.forEach((p, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const px = margin + col * (pW + pGap);
    const cy = py + row * (pH + 6);

    doc.setFillColor(...NAVY_CARD);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.35);
    doc.roundedRect(px, cy, pW, pH, 2.5, 2.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...GOLD);
    doc.text(p.k, px + 5, cy + 7.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text(p.t, px + 5, cy + 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(203, 213, 225);
    const wrapped = doc.splitTextToSize(p.d, pW - 10);
    doc.text(wrapped, px + 5, cy + 20.5);
  });

  // Bottom CTA box on cover
  const ctaY = 244;
  doc.setFillColor(...GOLD);
  doc.roundedRect(margin, ctaY, contentW, 24, 2.5, 2.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text("VENDA SEGURA · IMPLANTAÇÃO & SUPORTE ESPECIALIZADO", pageW / 2, ctaY + 9, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(
    "simuladorcorretorelite.com.br   |   INFORMETEC — Lourenço Junior   |   WhatsApp: (11) 94677-0656",
    pageW / 2,
    ctaY + 17.5,
    { align: "center" },
  );

  /* ═══════════════════════ PÁGINA 2 — SIMULAÇÃO & PROPOSTA ═══════════════════════ */
  doc.addPage();
  drawContentHeader(
    "SIMULAÇÕES FINANCEIRAS & PROPOSTAS COMERCIAIS",
    "Motores de cálculo calibrados para vendas imobiliárias de alta conversão",
    2,
  );
  let y = 36;
  PAGE2_FEATURES.forEach((card) => {
    y = drawFeatureCard(y, card);
  });
  drawFooter();

  /* ═══════════════════════ PÁGINA 3 — GESTÃO, FLUXO & CRM ═══════════════════════ */
  doc.addPage();
  drawContentHeader(
    "FLUXO COM PERCENTUAIS, GESTÃO DE VENDAS & CRM",
    "Do primeiro atendimento ao fechamento documental em um único ambiente",
    3,
  );
  y = 36;
  PAGE3_FEATURES.forEach((card) => {
    y = drawFeatureCard(y, card);
  });
  drawFooter();

  /* ═══════════════════════ PÁGINA 4 — IA, SEGURANÇA & CONTATO ═══════════════════════ */
  doc.addPage();
  drawContentHeader(
    "INTELIGÊNCIA ARTIFICIAL, SEGURANÇA & IMPLANTAÇÃO",
    "Tecnologia Multi-Tenant pronta para corretores autônomos, imobiliárias e construtoras",
    4,
  );
  y = 36;
  PAGE4_FEATURES.forEach((card) => {
    y = drawFeatureCard(y, card);
  });

  // Compatibility & Audience summary box
  const boxY = y + 2;
  const boxH = 44;
  doc.setFillColor(...NAVY);
  doc.roundedRect(margin, boxY, contentW, boxH, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...GOLD_SOFT);
  doc.text("IDEAL PARA TODOS OS PERFIS DO MERCADO IMOBILIÁRIO", margin + 6, boxY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.8);
  doc.setTextColor(226, 232, 240);
  const profiles = [
    "•  Corretores Individuais Autônomos: conta própria isolada, simulações rápidas e propostas com seu CRECI.",
    "•  Imobiliárias e Equipes de Vendas: painel do gestor, vínculo de corretores por ID e controle de planos.",
    "•  Construtoras e Incorporadoras: tabelas padronizadas, fluxos com percentuais e fechamento transparente.",
    "•  100% Responsivo (PWA): acesso otimizado para Computador, Tablet e Celular sem instalação complexa.",
  ];
  let pyProfile = boxY + 16.5;
  profiles.forEach((line) => {
    doc.text(line, margin + 6, pyProfile);
    pyProfile += 6.2;
  });

  // Final Commercial Call-To-Action Box
  const contactY = boxY + boxH + 8;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.7);
  doc.roundedRect(margin, contactY, contentW, 42, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text("SOLICITE SUA LICENÇA OU DEMONSTRAÇÃO PERSONALIZADA", pageW / 2, contactY + 10.5, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...SLATE_DARK);
  doc.text("Site oficial: www.simuladorcorretorelite.com.br", pageW / 2, contactY + 19, {
    align: "center",
  });
  doc.text("Atendimento & Implantação: INFORMETEC — Lourenço Junior", pageW / 2, contactY + 25.5, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(146, 114, 24);
  doc.text("WhatsApp Comercial: (11) 94677-0656", pageW / 2, contactY + 34, { align: "center" });

  drawFooter();

  doc.save("Simulador_Corretor_Elite_4.0_Marketing_Funcoes.pdf");
}
