import { useEffect, useCallback } from "react";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";

interface TourGuiadoProps {
  onTabChange?: (tab: "simulacao" | "crm" | "prosoluto" | "gestao" | "dashboard") => void;
}

const TOUR_STORAGE_KEY = "elite_tour_completed";

export const TourGuiado = ({ onTabChange }: TourGuiadoProps) => {
  const startTour = useCallback(() => {
    // Switch to simulation tab first
    if (onTabChange) {
      onTabChange("simulacao");
    }

    const driverObj: Driver = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: "rgba(10, 15, 29, 0.82)",
      nextBtnText: "Próximo →",
      prevBtnText: "← Anterior",
      doneBtnText: "Concluir Tour ✨",
      progressText: "{{current}} de {{total}}",
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_STORAGE_KEY, "true");
        driverObj.destroy();
      },
      steps: [
        {
          element: "#tour-header",
          popover: {
            title: "🏆 Bem-vindo ao Simulador Elite 4.0",
            description:
              "O ecossistema definitivo para corretores de alta performance. Vamos fazer um tour rápido de 1 minuto para você dominar todas as ferramentas.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#tour-tab-simulacao",
          popover: {
            title: "📐 1. Simulação Técnica Caixa",
            description:
              "Calcule com precisão matemática o Financiamento Caixa (SAC/PRICE), Subsídios Minha Casa Minha Vida (MCMV), FGTS e capacidade máxima de renda.",
            side: "top",
            align: "center",
          },
        },
        {
          element: "#tour-tab-prosoluto",
          popover: {
            title: "🤝 2. Pró-Soluto & Negociação Construtora",
            description:
              "Estruture opções inteligentes de fluxo de pagamento: Entrada facilitada, mensais em obras, intermediárias/balões e parcelamento pós-chaves.",
            side: "top",
            align: "center",
          },
        },
        {
          element: "#tour-tab-crm",
          popover: {
            title: "👥 3. CRM Imobiliário & Funil de Vendas",
            description:
              "Gerencie seus leads, agendamentos, pipeline Kanban e histórico de atendimentos sem perder nenhuma oportunidade de venda.",
            side: "top",
            align: "center",
          },
        },
        {
          element: "#tour-tab-dashboard",
          popover: {
            title: "📊 4. Dashboard Visual e Métricas",
            description:
              "Gráficos intuitivos para demonstrar ao cliente a composição visual de cada centavo da negociação e os percentuais aprovados.",
            side: "top",
            align: "center",
          },
        },
        {
          element: "#tour-tab-gestao",
          popover: {
            title: "📁 5. Gestão de Propostas e Vendas",
            description:
              "Armazene fichas de clientes, histórico de simulações salvas, gere PDFs profissionais e compartilhe propostas via WhatsApp.",
            side: "top",
            align: "center",
          },
        },
        {
          element: "#tour-btn-luiza",
          popover: {
            title: "🤖 6. Luiza IA - Assistente Especialista",
            description:
              "Tire dúvidas instantâneas sobre regras da Caixa, cálculos de subsídio, estratégias de contorno de objeções e dicas de fechamento com inteligência artificial.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "#tour-btn-marketing",
          popover: {
            title: "📢 7. Central de Marketing & Copywriting",
            description:
              "Modelos de anúncios, copys prontas para redes sociais, roteiros de ligação e argumentos matadores para captação de clientes.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "#tour-btn-admin",
          popover: {
            title: "⚙️ 8. Personalização & Configurações",
            description:
              "Configure sua foto, logotipo do empreendimento, dados de contato do corretor, CRECI e tabelas de juros personalizadas.",
            side: "bottom",
            align: "end",
          },
        },
        {
          element: "#tour-btn-start",
          popover: {
            title: "🚀 Tudo Pronto para Vender Mais!",
            description:
              "Você pode rever este tour a qualquer momento clicando neste botão com o ícone de bússola no cabeçalho. Bons negócios!",
            side: "bottom",
            align: "center",
          },
        },
      ],
    });

    driverObj.drive();
  }, [onTabChange]);

  useEffect(() => {
    // Auto start on first visit after slight delay
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => {
        startTour();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [startTour]);

  return (
    <button
      id="tour-btn-start"
      type="button"
      onClick={startTour}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-gold/40 text-gold-bright hover:bg-gold/20 transition-all shadow-sm group"
      title="Iniciar Tour Guiado do Sistema"
    >
      <span className="text-sm transition-transform group-hover:scale-110">🧭</span>
      <span className="hidden sm:inline text-[11px] font-medium tracking-wide">Tour Guiado</span>
    </button>
  );
};

export default TourGuiado;
