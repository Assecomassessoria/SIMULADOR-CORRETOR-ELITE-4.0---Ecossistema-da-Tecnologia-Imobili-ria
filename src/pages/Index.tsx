import { useState, useEffect, useCallback } from "react";
import {
  Calculator,
  BarChart3,
  FileSpreadsheet,
  PieChart,
  Settings,
  LogOut,
  Users,
  Briefcase,
  Megaphone,
  Bot,
  Lightbulb,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CalculadoraPopup from "@/components/CalculadoraPopup";
import LoginScreen from "@/components/LoginScreen";
import SimulacaoTecnica from "@/components/SimulacaoTecnica";
import ProSoluto from "@/components/ProSoluto";
import GestaoVendas from "@/components/GestaoVendas";
import DashboardCharts from "@/components/DashboardCharts";
import AdminPanel from "@/components/AdminPanel";
import CrmTab from "@/components/CrmTab";
import PainelComercial from "@/components/PainelComercial";
import SugestoesModal from "@/components/SugestoesModal";

import {
  checkLoginValid,
  setLoginDate,
  isFullVersion,
  getAdminData,
  AdminData,
  parseCurrency,
  validateSession,
  logoutSession,
  getUserEmail,
  isVisitorMode,
  setVisitorMode,
  checkVisitorAction,
} from "@/lib/eliteUtils";

type Tab = "simulacao" | "crm" | "prosoluto" | "gestao" | "dashboard";

interface ChartDataState {
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

const Index = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(checkLoginValid);
  const [activeTab, setActiveTab] = useState<Tab>("simulacao");
  const [adminOpen, setAdminOpen] = useState(false);
  const [painelComercialOpen, setPainelComercialOpen] = useState(false);
  const [sugestoesOpen, setSugestoesOpen] = useState(false);
  const [adminData, setAdminData] = useState<AdminData>(getAdminData());
  const [chartData, setChartData] = useState<ChartDataState>({
    financiamento: 0,
    fgts: 0,
    subsidios: 0,
    entrada: 0,
    sinal: 0,
    intermediarias: 0,
    obras: 0,
    chaves: 0,
    avaliacao: 0,
    lancamento: 0,
  });
  const isFull = isFullVersion();
  const isVisitor = isVisitorMode();
  const [sessionKicked, setSessionKicked] = useState(false);
  const [showLicenseBanner, setShowLicenseBanner] = useState(true);
  const [calcOpen, setCalcOpen] = useState(false);

  // Banner: 30s visível, 90s ausente, ciclo
  useEffect(() => {
    if (isFull) return;
    const hideTimeout = setTimeout(() => setShowLicenseBanner(false), 30000);
    const interval = setInterval(() => {
      setShowLicenseBanner(true);
      setTimeout(() => setShowLicenseBanner(false), 30000);
    }, 120000); // 30s visível + 90s ausente = 120s ciclo
    return () => {
      clearTimeout(hideTimeout);
      clearInterval(interval);
    };
  }, [isFull]);

  // Validate session every 30 seconds (with tolerance for transient failures)
  useEffect(() => {
    const email = getUserEmail();
    if (!email || !isLoggedIn) return;

    let failCount = 0;
    const MAX_FAILS = 3; // Only logout after 3 consecutive failures

    const checkSession = async () => {
      try {
        const valid = await validateSession();
        if (valid) {
          failCount = 0; // Reset on success
        } else {
          failCount++;
          console.log(`[Session] Validation failed (${failCount}/${MAX_FAILS})`);
          if (failCount >= MAX_FAILS) {
            setSessionKicked(true);
            localStorage.removeItem("elite_login_date");
            setIsLoggedIn(false);
          }
        }
      } catch {
        failCount++;
        console.log(`[Session] Validation error (${failCount}/${MAX_FAILS})`);
        if (failCount >= MAX_FAILS) {
          setSessionKicked(true);
          localStorage.removeItem("elite_login_date");
          setIsLoggedIn(false);
        }
      }
    };

    // Delay first check to allow session to stabilize
    const initialTimeout = setTimeout(checkSession, 5000);

    const interval = setInterval(checkSession, 30000);
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isLoggedIn]);

  const handleSimulacaoUpdate = useCallback((fields: Record<string, string>, results: Record<string, number>) => {
    // Track Facebook Pixel: simulação realizada (apenas se houver valor de lançamento)
    const valorImovel = parseCurrency(fields.lancamento || "");
    if (valorImovel > 0) {
      import("@/lib/fbPixel").then(({ trackSimulacao }) => trackSimulacao({ valorImovel, tipo: "tecnica" }));
    }
    setChartData({
      financiamento: parseCurrency(fields.aprovacao || ""),
      fgts: parseCurrency(fields.fgts || ""),
      subsidios: parseCurrency(fields.subsidio || ""),
      entrada: results.entradaConstrutora || 0,
      sinal: results.sinalValor || 0,
      intermediarias: parseCurrency(fields.intermediarias || ""),
      obras: results.valorObras || 0,
      chaves: parseCurrency(fields.chaves || ""),
      avaliacao: parseCurrency(fields.avaliacao || ""),
      lancamento: parseCurrency(fields.lancamento || ""),
    });
  }, []);

  const handleLogin = () => {
    setLoginDate();
    setIsLoggedIn(true);
    import("@/lib/fbPixel").then(({ trackLogin }) => trackLogin("elite"));
  };

  // --- REMOVA O BLOCO DE RETURN REPETIDO QUE ESTAVA AQUI ---

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        sessionKicked={sessionKicked}
        onSessionKickedAck={() => setSessionKicked(false)}
      />
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "simulacao", label: "Simulação", icon: <Calculator className="w-5 h-5" /> },
    { id: "prosoluto", label: "Pró Soluto", icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: "gestao", label: "Gestão", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "dashboard", label: "Dashboard", icon: <PieChart className="w-5 h-5" /> },
    { id: "crm", label: "CRM", icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* VISITOR BANNER */}
      {isVisitor && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-600 text-white text-center py-2 text-xs font-bold tracking-wide shadow-lg">
          🔒 MODO DEMONSTRAÇÃO / VISITANTE — Fale com (11) 94677-0656 Lourenço Junior para ativar sua licença anual.
        </div>
      )}

      {/* ADQUIRA SUA LICENÇA */}
      {!isFull && !isVisitor && showLicenseBanner && (
        <a
          href="https://simuladorcorretorelite.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed top-3 right-3 px-4 py-2.5 rounded shadow-lg text-xs font-extrabold uppercase tracking-wider text-center leading-tight no-underline z-50 animate-[pulse_1.5s_ease-in-out_infinite]"
          style={{
            background: "linear-gradient(135deg, hsl(42 60% 50%) 0%, hsl(42 70% 40%) 100%)",
            color: "hsl(220 70% 10%)",
            border: "2px solid hsl(42 80% 60% / 0.7)",
            boxShadow: "0 0 15px hsl(42 60% 50% / 0.5), 0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          ⭐ Adquira Sua Licença
        </a>
      )}

      {/* Header */}
      <header
        className={`text-gold border-b-4 sticky z-40 ${isVisitor ? "top-8" : "top-0"} ${
          isFull ? "elite-gradient border-gold/50" : "bg-card border-gold-bright/50"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          {adminData.imgEmp && (
            <img src={adminData.imgEmp} alt="Empreendimento" className="w-10 h-10 object-cover rounded flex-shrink-0" />
          )}
          {isFull && <img src="/pwa-icon-192.png" alt="Elite" className="w-8 h-8 flex-shrink-0 rounded" />}
          <div className="min-w-0 flex-1">
            <h1
              className={`text-sm sm:text-base font-bold tracking-wider uppercase leading-tight truncate ${isFull ? "text-gold" : "text-primary"}`}
            >
              {isFull ? (
                "Simulador Corretor de Elite 4.0"
              ) : (
                <>
                  Simulador <span className="text-gold-bright">Corretor de Elite 4.0</span>
                </>
              )}
            </h1>
            <p className={`text-[10px] tracking-[3px] uppercase ${isFull ? "text-gold/60" : "text-primary/60"}`}>
              {isFull ? "Venda Segura" : "Venda Segura - DEMO"}
            </p>
          </div>
          {adminData.imgBroker && (
            <img
              src={adminData.imgBroker}
              alt="Corretor"
              className="w-10 h-10 object-cover rounded-full flex-shrink-0 border-2 border-gold/30"
            />
          )}
          <button
            onClick={() => navigate("/marketing")}
            className="p-2 text-gold/60 hover:text-gold transition-colors"
            title="Marketing"
          >
            <Megaphone className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate("/luiza")}
            className="p-2 text-gold/60 hover:text-gold transition-colors"
            title="Luiza IA"
          >
            <Bot className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSugestoesOpen(true)}
            className="p-2 text-gold/60 hover:text-gold transition-colors"
            title="Canal de Sugestões"
          >
            <Lightbulb className="w-5 h-5" />
          </button>
          {!isVisitor && (
            <button
              onClick={() => setPainelComercialOpen(true)}
              className="p-2 text-gold/60 hover:text-gold transition-colors"
              title="Painel Comercial"
            >
              <Briefcase className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setAdminOpen(true)}
            className="p-2 text-gold/60 hover:text-gold transition-colors"
            title="Configurações Administrativas"
          >
            <Settings className="w-5 h-5" />
          </button>

        </div>
        <p className="max-w-6xl mx-auto px-5 pb-2 italic text-[12px] text-white/40">
          "O diferencial do seu simulador não é apenas mostrar o valor da parcela, mas mostrar o cenário real para o
          cliente."
        </p>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4">
        <div style={{ display: activeTab === "simulacao" ? "block" : "none" }}>
          <SimulacaoTecnica adminData={adminData} onDataUpdate={handleSimulacaoUpdate} isVisitor={isVisitor} />
        </div>
        <div style={{ display: activeTab === "crm" ? "block" : "none" }}>
          <CrmTab isVisitor={isVisitor} />
        </div>
        <div style={{ display: activeTab === "prosoluto" ? "block" : "none" }}>
          <ProSoluto adminData={adminData} isVisitor={isVisitor} />
        </div>
        <div style={{ display: activeTab === "dashboard" ? "block" : "none" }}>
          <DashboardCharts data={chartData} />
        </div>
        <div style={{ display: activeTab === "gestao" ? "block" : "none" }}>
          <GestaoVendas isVisitor={isVisitor} />
        </div>
      </main>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-4 py-3 text-center border-t border-border">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          © Todos os direitos reservados <strong>INFORMETEC - Tecnologia em Informações</strong> - CNPJ
          00.921557/0001-65 | Apoio: <strong>RODRIGO DIAS</strong> - Gestão TI
        </p>
        <p className="text-[9px] text-muted-foreground/70 mt-0.5 italic">
          SIMULADOR CORRETOR DE ELITE 4.0 - Vendas Seguras - Informetec
        </p>
      </div>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 elite-gradient border-t-2 border-gold/30">
        <div className="max-w-6xl mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${
                activeTab === tab.id ? "text-gold-bright" : "text-gold/40 hover:text-gold/70"
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-semibold uppercase tracking-wider">{tab.label}</span>
              {activeTab === tab.id && <div className="absolute top-0 w-12 h-0.5 gold-gradient rounded-full" />}
            </button>
          ))}
          <button
            onClick={() => setCalcOpen(true)}
            className="flex-1 flex flex-col items-center gap-1 py-3 transition-all text-gold/40 hover:text-gold/70"
          >
            <Calculator className="w-5 h-5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Calculadora</span>
          </button>
          <button
            onClick={async () => {
              setVisitorMode(false);
              await logoutSession();
              localStorage.removeItem("elite_login_date");
              setIsLoggedIn(false);
            }}
            className="flex-1 flex flex-col items-center gap-1 py-3 transition-all text-red-400/70 hover:text-red-400"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Sair</span>
          </button>
        </div>
      </nav>

      {/* Modals & Chat */}
      <AdminPanel
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        onDataUpdate={setAdminData}
        isVisitor={isVisitor}
      />
      {calcOpen && <CalculadoraPopup onClose={() => setCalcOpen(false)} />}
      <PainelComercial isOpen={painelComercialOpen} onClose={() => setPainelComercialOpen(false)} />
      <SugestoesModal isOpen={sugestoesOpen} onClose={() => setSugestoesOpen(false)} />

      {/* LUIZA DENTRO DO SIMULADOR */}
    </div>
  );
};

export default Index;
