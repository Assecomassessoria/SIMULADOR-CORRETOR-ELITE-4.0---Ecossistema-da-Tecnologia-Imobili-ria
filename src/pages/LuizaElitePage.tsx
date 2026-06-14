import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send, User, Bot, Calculator, FileText, TrendingUp,
  MessageSquare, Sparkles, FileDown, History, Plus,
  Save, Trash2, HelpCircle, X, ArrowLeft, GraduationCap,
  Upload, Loader2, Building2, Network, ListChecks, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { checkLoginValid } from "@/lib/eliteUtils";
import LoginScreen from "@/components/LoginScreen";
import { setLoginDate } from "@/lib/eliteUtils";
import MermaidBlock from "@/components/MermaidBlock";
import luizaAvatar from "@/assets/luiza-elite-avatar.png";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdate: Date;
}

interface Treinamento {
  nomeEmpreendimento: string;
  construtora?: string | null;
  localizacao?: string | null;
  descricao?: string;
  diferenciais?: string[];
  tipologias?: string[];
  lazer?: string[];
  condicoesComerciais?: string;
  perguntasSugeridas?: string[];
  resumoExecutivo?: string;
  imagemCapa?: string; // dataURL opcional
  criadoEm: string;
}

const INITIAL_MESSAGE: Message = {
  id: "1",
  role: "model",
  text: 'Olá, corretor! Sou a **Luiza Elite**, sua Assistente de Alta Performance do **Simulador Corretor de Elite 4.0**. \n\nEstou pronta para analisar suas simulações, gerar documentos CAIXA (como a Ficha MO), calcular o Pró-Soluto e criar estratégias de fechamento imbatíveis. Como posso te ajudar a vender mais hoje?',
  timestamp: new Date(),
};

const QUICK_CHIPS = [
  { label: "Comparar SAC vs PRICE", icon: <Calculator size={14} /> },
  { label: "Gerar Ficha MO", icon: <FileText size={14} /> },
  { label: "Analisar Pró-Soluto", icon: <Sparkles size={14} /> },
  { label: "Script de Fechamento", icon: <TrendingUp size={14} /> },
  { label: "Resumo para WhatsApp", icon: <MessageSquare size={14} /> },
];

const DEFAULT_AVATAR = luizaAvatar;

export default function LuizaElitePage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(checkLoginValid);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState(Date.now().toString());
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [simulationData, setSimulationData] = useState("");
  const [simulationImage, setSimulationImage] = useState<string | null>(null);
  const [isDraggingSim, setIsDraggingSim] = useState(false);
  const simImageInputRef = useRef<HTMLInputElement>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const [trainingFiles, setTrainingFiles] = useState<File[]>([]);
  const [trainingImages, setTrainingImages] = useState<{ name: string; dataUrl: string }[]>([]);
  const trainingImageInputRef = useRef<HTMLInputElement>(null);
  const [chatImage, setChatImage] = useState<string | null>(null);
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const chatImageInputRef = useRef<HTMLInputElement>(null);
  const [trainingCover, setTrainingCover] = useState<string | null>(null);
  const [isProcessingTraining, setIsProcessingTraining] = useState(false);
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(false);
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);
  const [activeTreinamento, setActiveTreinamento] = useState<Treinamento | null>(null);
  const [trainingTermAccepted, setTrainingTermAccepted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Treinamentos persist
  useEffect(() => {
    const t = localStorage.getItem("luiza_elite_treinamentos");
    if (t) {
      try { setTreinamentos(JSON.parse(t)); } catch { /* ignore */ }
    }
    const a = localStorage.getItem("luiza_elite_treinamento_ativo");
    if (a) {
      try { setActiveTreinamento(JSON.parse(a)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("luiza_elite_treinamentos", JSON.stringify(treinamentos));
  }, [treinamentos]);

  useEffect(() => {
    if (activeTreinamento) {
      localStorage.setItem("luiza_elite_treinamento_ativo", JSON.stringify(activeTreinamento));
    } else {
      localStorage.removeItem("luiza_elite_treinamento_ativo");
    }
  }, [activeTreinamento]);

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("luiza_elite_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed.map((s: any) => ({
          ...s,
          lastUpdate: new Date(s.lastUpdate),
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
        })));
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("luiza_elite_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  const saveCurrentSession = useCallback((msgs: Message[]) => {
    setSessions((prev) => {
      const title = msgs.find((m) => m.role === "user")?.text.substring(0, 30) || "Nova Conversa";
      const existing = prev.find((s) => s.id === currentSessionId);
      if (existing) {
        return prev.map((s) => s.id === currentSessionId ? { ...s, messages: msgs, lastUpdate: new Date() } : s);
      }
      return [{ id: currentSessionId, title, messages: msgs, lastUpdate: new Date() }, ...prev];
    });
  }, [currentSessionId]);

  const startNewChat = () => {
    setCurrentSessionId(Date.now().toString());
    setMessages([INITIAL_MESSAGE]);
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) startNewChat();
  };

  // ===== TREINAMENTO =====
  const handleAddFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type === "application/pdf");
    setTrainingFiles((prev) => [...prev, ...arr].slice(0, 10));
  };

  const handleCoverChange = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setTrainingCover(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeTrainingFile = (idx: number) => {
    setTrainingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddTrainingImages = async (files: FileList | null) => {
    if (!files) return;
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const converted = await Promise.all(
      imgs.map(
        (f) =>
          new Promise<{ name: string; dataUrl: string }>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve({ name: f.name, dataUrl: r.result as string });
            r.onerror = reject;
            r.readAsDataURL(f);
          })
      )
    );
    setTrainingImages((prev) => [...prev, ...converted].slice(0, 10));
  };

  const removeTrainingImage = (idx: number) => {
    setTrainingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // strip data:...;base64,
        resolve(result.split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const processTraining = async () => {
    if ((trainingFiles.length === 0 && trainingImages.length === 0) || isProcessingTraining) return;
    setIsProcessingTraining(true);
    try {
      const { extractPdfText } = await import("@/lib/pdfExtract");
      const documentos = await Promise.all(
        trainingFiles.map(async (f) => ({ nome: f.name, texto: await extractPdfText(f) }))
      );

      // Upload paralelo dos PDFs ao Google Drive (pasta Luiz IA Treinamentos)
      const uploadResults = await Promise.allSettled(
        trainingFiles.map(async (f) => {
          const contentBase64 = await fileToBase64(f);
          const { data, error } = await supabase.functions.invoke("drive-upload-treinamento", {
            body: { fileName: f.name, contentBase64, mimeType: f.type || "application/pdf" },
          });
          if (error) throw error;
          return data;
        })
      );
      const enviados = uploadResults.filter((r) => r.status === "fulfilled").length;
      const falhas = uploadResults.length - enviados;

      const { data, error } = await supabase.functions.invoke("luiza-treinamento", {
        body: { documentos, imagens: trainingImages },
      });
      if (error) throw error;
      const t: Treinamento = {
        ...data.treinamento,
        imagemCapa: trainingCover || (trainingImages[0]?.dataUrl) || undefined,
        criadoEm: new Date().toISOString(),
      };
      setTreinamentos((prev) => [t, ...prev]);
      setActiveTreinamento(t);
      setIsTrainingOpen(false);
      setTrainingFiles([]);
      setTrainingImages([]);
      setTrainingCover(null);

      const arquivamento = trainingFiles.length === 0
        ? ""
        : enviados > 0
          ? `\n\n📁 **Documento arquivado com sucesso na Central de Inteligência Luiz IA. Disponível para treinamento por 36 meses.** (${enviados}/${uploadResults.length} arquivo(s) enviado(s)${falhas ? `, ${falhas} falha(s)` : ""})`
          : `\n\n⚠ Não foi possível arquivar os PDFs no Drive. Verifique a conexão Google Drive.`;

      const intro: Message = {
        id: Date.now().toString(),
        role: "model",
        text: `🎓 **Treinamento concluído: ${t.nomeEmpreendimento}**\n\n${t.resumoExecutivo || t.descricao || ""}${arquivamento}\n\n${t.perguntasSugeridas?.length ? "**Perguntas sugeridas:**\n" + t.perguntasSugeridas.map((p) => `- ${p}`).join("\n") : ""}`,
        timestamp: new Date(),
      };
      setMessages([INITIAL_MESSAGE, intro]);
    } catch (e) {
      console.error(e);
      alert("Falha ao processar treinamento. Tente novamente.");
    } finally {
      setIsProcessingTraining(false);
    }
  };

  const handleSend = async (text: string = input, imageOverride?: string | null) => {
    const image = imageOverride !== undefined ? imageOverride : null;
    if ((!text.trim() && !image) || isLoading) return;

    const userMsg: Message & { image?: string } = {
      id: Date.now().toString(),
      role: "user",
      text: text.trim() || (image ? "[Imagem anexada para análise]" : ""),
      timestamp: new Date(),
      ...(image ? { image } : {}),
    } as any;

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);

    try {
      const contextPrefix = activeTreinamento
        ? `[CONTEXTO ATIVO — Empreendimento: ${activeTreinamento.nomeEmpreendimento}${activeTreinamento.construtora ? " / " + activeTreinamento.construtora : ""}${activeTreinamento.localizacao ? " — " + activeTreinamento.localizacao : ""}. Resumo: ${activeTreinamento.resumoExecutivo || activeTreinamento.descricao || ""}. Diferenciais: ${(activeTreinamento.diferenciais || []).join("; ")}]`
        : "";
      const msgsWithCtx = contextPrefix
        ? [{ role: "model" as const, text: contextPrefix }, ...updated]
        : updated;
      const { data, error } = await supabase.functions.invoke("chat-luiza", {
        body: {
          messages: msgsWithCtx.map((m: any) => ({ role: m.role, text: m.text, ...(m.image ? { image: m.image } : {}) })),
        },
      });

      if (error) throw error;

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: data.reply,
        timestamp: new Date(),
      };
      const finalMsgs = [...updated, botMsg];
      setMessages(finalMsgs);
      saveCurrentSession(finalMsgs);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "model", text: "Desculpe, tive um problema técnico. Pode tentar novamente?", timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSimImageFile = async (file: File | null | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = await fileToDataUrl(file);
    setSimulationImage(url);
  };

  const handleSimDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSim(false);
    const file = e.dataTransfer.files?.[0];
    await handleSimImageFile(file);
  };

  const handleSimPaste = async (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((it) => it.type.startsWith("image/"));
    if (item) {
      e.preventDefault();
      await handleSimImageFile(item.getAsFile());
    }
  };

  const analyzeSimulation = () => {
    if (!simulationData.trim() && !simulationImage) return;
    const text = simulationData.trim()
      ? `Analise esta simulação imobiliária:\n\n${simulationData}`
      : "Analise a imagem da simulação anexada (extraia valores, prazo, taxa, parcelas e dê parecer técnico).";
    handleSend(text, simulationImage);
    setSimulationData("");
    setSimulationImage(null);
  };

  const handleLogin = () => {
    setLoginDate();
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      {showSidebar && (
        <aside className="w-72 lg:w-80 elite-gradient text-gold flex flex-col border-r border-gold/20 flex-shrink-0">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gold/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg gold-gradient flex items-center justify-center shadow-lg">
                <Calculator className="text-primary" size={20} />
              </div>
              <div>
                <h1 className="font-bold text-sm text-gold tracking-tight">Corretor Elite</h1>
                <p className="text-[9px] text-gold/60 uppercase tracking-[2px]">Simulador 4.0</p>
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div className="px-4 py-5 border-b border-gold/10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full border-2 border-gold p-0.5 shadow-xl overflow-hidden">
              <img src={DEFAULT_AVATAR} alt="Luiza Elite" className="w-full h-full object-cover rounded-full" />
            </div>
            <h3 className="font-bold text-xs text-gold mt-2">Luiza Elite</h3>
            <p className="text-[9px] text-gold/60 uppercase tracking-[2px]">Assistente de Alta Performance</p>
          </div>

          {/* Actions */}
          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            <h3 className="text-[10px] font-bold text-gold uppercase tracking-[2px]">Ações Rápidas</h3>
            <button onClick={startNewChat} className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs font-bold border border-white/10 text-gold">
              <Plus size={16} className="text-gold" /> Nova Conversa
            </button>
            <button
              onClick={() => setIsTrainingOpen(true)}
              className="w-full flex items-center gap-2 p-2.5 rounded-lg gold-gradient text-primary hover:opacity-90 transition-opacity text-xs font-bold shadow-md"
            >
              <GraduationCap size={16} /> Treinamentos
            </button>

            {/* Treinamentos salvos */}
            {treinamentos.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {treinamentos.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTreinamento(t)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-[11px] transition-all ${
                      activeTreinamento?.nomeEmpreendimento === t.nomeEmpreendimento
                        ? "bg-gold/20 border border-gold/40"
                        : "bg-white/5 hover:bg-white/10 border border-transparent"
                    }`}
                  >
                    <Building2 size={12} className="text-gold flex-shrink-0" />
                    <span className="truncate text-gold font-medium">{t.nomeEmpreendimento}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Chat History */}
            <h3 className="text-[10px] font-bold text-gold uppercase tracking-[2px] flex items-center gap-1 mt-4">
              <History size={12} /> Histórico
            </h3>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="text-[9px] text-gold/30 italic text-center py-3">Nenhuma conversa salva</p>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSession(s)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-[11px] transition-all group ${
                      currentSessionId === s.id ? "bg-gold/20 border border-gold/30" : "bg-white/5 hover:bg-white/10 border border-transparent"
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-medium text-gold">{s.title}</span>
                      <span className="text-[8px] text-gold/40">{s.lastUpdate.toLocaleDateString()}</span>
                    </div>
                    <Trash2 size={11} className="text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" onClick={(e) => deleteSession(e, s.id)} />
                  </button>
                ))
              )}
            </div>

            {/* Simulation Input */}
            <h3 className="text-[10px] font-bold text-gold uppercase tracking-[2px] mt-4 flex items-center gap-1">
              <FileText size={12} /> Dados da Simulação
            </h3>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingSim(true); }}
              onDragLeave={() => setIsDraggingSim(false)}
              onDrop={handleSimDrop}
              className={`relative rounded-lg border ${isDraggingSim ? "border-gold border-dashed bg-gold/10" : "border-gold/20"} transition-colors`}
            >
              <textarea
                className="w-full h-32 bg-white/5 rounded-lg p-3 text-xs text-gold focus:ring-1 focus:ring-gold focus:border-transparent outline-none placeholder:text-gold/30 resize-none border-0"
                placeholder="Cole o JSON da simulação, OU arraste/cole/anexe uma imagem (print) aqui..."
                value={simulationData}
                onChange={(e) => setSimulationData(e.target.value)}
                onPaste={handleSimPaste}
              />
              {isDraggingSim && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-lg bg-gold/20 text-gold text-xs font-bold">
                  Solte a imagem aqui
                </div>
              )}
            </div>
            <input
              ref={simImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleSimImageFile(e.target.files?.[0])}
            />
            <div className="flex gap-2">
              <button
                onClick={() => simImageInputRef.current?.click()}
                className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gold text-[11px] font-bold border border-gold/20 flex items-center justify-center gap-1.5"
              >
                <Upload size={12} /> Anexar imagem
              </button>
            </div>
            {simulationImage && (
              <div className="relative rounded-lg overflow-hidden border border-gold/30">
                <img src={simulationImage} alt="Simulação anexada" className="w-full h-auto max-h-32 object-contain bg-black/40" />
                <button
                  onClick={() => setSimulationImage(null)}
                  className="absolute top-1 right-1 bg-black/70 text-gold rounded-full p-1 hover:bg-black"
                  title="Remover"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <button
              onClick={analyzeSimulation}
              disabled={(!simulationData.trim() && !simulationImage) || isLoading}
              className="w-full py-2.5 rounded-lg gold-gradient text-primary font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Sparkles size={14} /> Analisar com Luiza
            </button>
          </div>

          {/* Back button */}
          <div className="p-3 border-t border-gold/20">
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-gold/80 hover:text-gold"
            >
              <ArrowLeft size={14} /> Voltar ao Simulador
            </button>
          </div>
        </aside>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="elite-gradient border-b border-gold/20 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gold/60 hover:text-gold lg:hidden"
            >
              <MessageSquare size={18} />
            </button>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gold/60 hover:text-gold hidden lg:block"
            >
              <MessageSquare size={18} />
            </button>
            <div>
              <h2 className="font-bold text-sm text-gold">Luiza Elite — Assistente IA</h2>
              <p className="text-[9px] text-gold/50 uppercase tracking-[2px]">Simulador Corretor de Elite 4.0</p>
            </div>
          </div>
          <button onClick={() => setIsHelpOpen(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gold/60 hover:text-gold flex items-center gap-1">
            <HelpCircle size={18} />
            <span className="text-[10px] font-medium hidden md:inline text-gold/60">Ajuda</span>
          </button>
        </header>

        {/* Card de contexto do empreendimento ativo */}
        {activeTreinamento && (
          <div className="elite-gradient border-b border-gold/20 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            {activeTreinamento.imagemCapa ? (
              <img src={activeTreinamento.imagemCapa} alt={activeTreinamento.nomeEmpreendimento} className="w-12 h-12 rounded-lg object-cover border border-gold/40 flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-white/10 border border-gold/40 flex items-center justify-center flex-shrink-0">
                <Building2 className="text-gold" size={20} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[9px] uppercase tracking-[2px] text-gold/60">Treinamento ativo</p>
              <p className="text-sm font-bold text-gold truncate">{activeTreinamento.nomeEmpreendimento}</p>
              {activeTreinamento.localizacao && (
                <p className="text-[10px] text-gold/60 truncate">{activeTreinamento.localizacao}</p>
              )}
            </div>
            <button
              onClick={() => setActiveTreinamento(null)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gold/60 hover:text-gold"
              title="Encerrar contexto"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-muted/30">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 max-w-3xl ${m.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border-2 ${
                  m.role === "user" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-gold"
                }`}>
                  {m.role === "user" ? <User size={18} /> : (
                    <img src={DEFAULT_AVATAR} alt="Luiza" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className={`p-4 rounded-2xl shadow-sm leading-relaxed ${
                  m.role === "user"
                    ? "elite-gradient text-gold rounded-tr-none"
                    : "bg-card border border-border text-foreground rounded-tl-none"
                }`}>
                  <div className="prose prose-sm max-w-none [&>p]:m-0 [&>ul]:mt-1 [&>ol]:mt-1 [&_strong]:text-gold-bright">
                    <ReactMarkdown
                      components={{
                        code({ className, children, ...props }: any) {
                          const lang = /language-(\w+)/.exec(className || "")?.[1];
                          const content = String(children).replace(/\n$/, "");
                          if (lang === "mermaid") return <MermaidBlock code={content} />;
                          return <code className={className} {...props}>{children}</code>;
                        },
                      }}
                    >{m.text}</ReactMarkdown>
                  </div>
                  <p className={`text-[9px] mt-2 ${m.role === "user" ? "text-gold/40 text-right" : "text-muted-foreground/50"}`}>
                    {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex gap-3 max-w-3xl">
              <div className="w-9 h-9 rounded-full border-2 border-gold overflow-hidden bg-card flex-shrink-0">
                <img src={DEFAULT_AVATAR} alt="Luiza" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border rounded-tl-none">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-card border-t border-border flex-shrink-0">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Chips contextuais — apenas com treinamento ativo */}
            {activeTreinamento && (
              <div className="flex flex-wrap gap-1.5">
                {/* Mapa Mental */}
                <button
                  onClick={() => handleSend(
                    `Gere um MAPA MENTAL do empreendimento "${activeTreinamento.nomeEmpreendimento}" usando sintaxe Mermaid (mindmap ou graph TD). ` +
                    `Responda assim: primeiro um BLOCO DE CÓDIGO mermaid completo entre \`\`\`mermaid e \`\`\`, depois um RESUMO em até 4 bullets explicando os ramos do diagrama. ` +
                    `Não invente dados — use apenas o contexto do treinamento.`
                  )}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 gold-gradient text-primary border border-gold/40 rounded-full text-[11px] font-bold hover:opacity-90 transition-all disabled:opacity-40"
                >
                  <Network size={14} /> Mapa Mental
                </button>

                {/* Perguntas sugeridas (dropdown) */}
                {(activeTreinamento.perguntasSugeridas?.length ?? 0) > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowSuggestedQuestions((v) => !v)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 text-gold border border-gold/40 rounded-full text-[11px] font-bold hover:bg-gold/20 transition-all disabled:opacity-40"
                    >
                      <ListChecks size={14} /> Perguntas sugeridas
                      <ChevronDown size={12} className={`transition-transform ${showSuggestedQuestions ? "rotate-180" : ""}`} />
                    </button>
                    {showSuggestedQuestions && (
                      <div className="absolute bottom-full mb-2 left-0 z-20 w-80 max-h-64 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl p-1.5">
                        {activeTreinamento.perguntasSugeridas!.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setShowSuggestedQuestions(false);
                              handleSend(q);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted rounded-lg transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.label)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-accent/10 border border-border hover:border-gold/30 rounded-full text-[11px] text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
                >
                  {chip.icon}
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Imagem anexada */}
            {chatImage && (
              <div className="relative inline-block rounded-lg overflow-hidden border border-gold/30 max-w-[180px]">
                <img src={chatImage} alt="anexo" className="w-full h-auto max-h-32 object-contain bg-black/40" />
                <button
                  onClick={() => setChatImage(null)}
                  className="absolute top-1 right-1 bg-black/70 text-gold rounded-full p-1 hover:bg-black"
                  title="Remover"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Input */}
            <div
              className={`relative flex items-center rounded-xl ${isDraggingChat ? "ring-2 ring-gold ring-offset-2" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingChat(true); }}
              onDragLeave={() => setIsDraggingChat(false)}
              onDrop={async (e) => {
                e.preventDefault(); setIsDraggingChat(false);
                const f = e.dataTransfer.files?.[0];
                if (f && f.type.startsWith("image/")) {
                  const url = await fileToDataUrl(f); setChatImage(url);
                }
              }}
            >
              <input
                ref={chatImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) { const url = await fileToDataUrl(f); setChatImage(url); }
                }}
              />
              <button
                onClick={() => chatImageInputRef.current?.click()}
                disabled={isLoading}
                title="Anexar imagem"
                className="absolute left-2 p-2 text-muted-foreground hover:text-gold transition-colors disabled:opacity-40"
              >
                <Upload size={16} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend(input, chatImage)}
                onPaste={async (e) => {
                  const item = Array.from(e.clipboardData.items).find((it) => it.type.startsWith("image/"));
                  if (item) {
                    e.preventDefault();
                    const f = item.getAsFile();
                    if (f) { const url = await fileToDataUrl(f); setChatImage(url); }
                  }
                }}
                placeholder={chatImage ? "Descreva ou pergunte sobre a imagem (opcional)..." : "Pergunte, cole/arraste imagem ou anexe um print..."}
                className="w-full pl-10 pr-14 py-3 bg-background border border-input rounded-xl text-sm focus:ring-1 focus:ring-ring focus:border-transparent outline-none transition-all placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <button
                onClick={() => { handleSend(input, chatImage); setChatImage(null); }}
                disabled={(!input.trim() && !chatImage) || isLoading}
                className="absolute right-2 p-2.5 gold-gradient text-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[9px] text-center text-muted-foreground/50">
              Luiza é uma IA e pode cometer erros. Sempre valide os cálculos finais com o simulador oficial.
            </p>
          </div>
        </div>
      </main>

      {/* Help Modal */}
      <AnimatePresence>
        {isHelpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsHelpOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl shadow-2xl max-w-xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-border elite-gradient flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg gold-gradient flex items-center justify-center">
                    <HelpCircle className="text-primary" size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-gold">Guia Rápido</h2>
                    <p className="text-[9px] text-gold/60">Domine o simulador em poucos minutos</p>
                  </div>
                </div>
                <button onClick={() => setIsHelpOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gold/60">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <section>
                  <h3 className="font-bold text-foreground flex items-center gap-2 text-sm mb-2">
                    <Calculator size={16} className="text-gold" /> 1. Como Simular
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Cole o <strong>JSON da simulação</strong> na área lateral e clique em <strong>"Analisar com Luiza"</strong> para receber consultoria técnica instantânea.
                  </p>
                </section>
                <section>
                  <h3 className="font-bold text-foreground flex items-center gap-2 text-sm mb-2">
                    <FileDown size={16} className="text-gold" /> 2. Chips Rápidos
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Use os botões rápidos abaixo do chat para comparar <strong>SAC vs PRICE</strong>, gerar Ficha MO, analisar Pró-Soluto ou criar scripts de fechamento.
                  </p>
                </section>
                <section>
                  <h3 className="font-bold text-foreground flex items-center gap-2 text-sm mb-2">
                    <History size={16} className="text-gold" /> 3. Histórico
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Suas conversas são salvas automaticamente. Use o <strong>Histórico</strong> na barra lateral para retomar atendimentos anteriores.
                  </p>
                </section>
                <section>
                  <h3 className="font-bold text-foreground flex items-center gap-2 text-sm mb-2">
                    <Sparkles size={16} className="text-gold" /> 4. Dicas
                  </h3>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                    <li>Peça para comparar tabelas <strong>SAC e PRICE</strong>.</li>
                    <li>Solicite um <strong>script de fechamento</strong> baseado na renda do cliente.</li>
                    <li>Pergunte sobre <strong>subsídios MCMV</strong> para cada faixa de renda.</li>
                  </ul>
                </section>
              </div>

              <div className="p-4 border-t border-border flex justify-end">
                <button onClick={() => setIsHelpOpen(false)} className="px-6 py-2.5 rounded-lg gold-gradient text-primary font-bold text-sm hover:opacity-90 transition-opacity">
                  Entendi, vamos vender!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Treinamentos */}
      <AnimatePresence>
        {isTrainingOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !isProcessingTraining && setIsTrainingOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-border elite-gradient flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg gold-gradient flex items-center justify-center">
                    <GraduationCap className="text-primary" size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-gold">Treinar Luiza com Empreendimento</h2>
                    <p className="text-[9px] text-gold/60">Envie até 10 PDFs e/ou 10 imagens (Memorial, Contrato, fotos, plantas...)</p>
                  </div>
                </div>
                <button
                  onClick={() => !isProcessingTraining && setIsTrainingOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gold/60"
                  disabled={isProcessingTraining}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Termo de Contribuição */}
                {trainingTermAccepted ? (
                  <div className="rounded-xl border border-gold/40 bg-gold/5 px-4 py-2.5 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <span className="text-gold">✓</span> Termo aceito — você concordou em compartilhar com a Rede Elite.
                    </span>
                    <button
                      type="button"
                      onClick={() => setTrainingTermAccepted(false)}
                      disabled={isProcessingTraining}
                      className="text-[10px] underline text-muted-foreground hover:text-foreground"
                    >
                      Rever
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-gold/40 bg-gold/5 p-4 space-y-2">
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <FileText size={14} className="text-gold" /> Termo de Contribuição de Conteúdo
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Ao realizar o upload deste material (PDF, Memorial ou Ebook), você declara estar ciente e concordar que:
                    </p>
                    <ul className="text-[11px] text-muted-foreground leading-relaxed space-y-1 list-disc pl-4">
                      <li><strong className="text-foreground">Acesso Compartilhado:</strong> O conteúdo será processado pela IA para treinar a base de dados comum, tornando as informações acessíveis a outros corretores e imobiliárias usuários da plataforma.</li>
                      <li><strong className="text-foreground">Direito de Uso:</strong> Você possui autorização para compartilhar estes documentos técnicos para fins de treinamento de vendas.</li>
                      <li><strong className="text-foreground">Propósito:</strong> Melhoria da precisão técnica das simulações e atendimentos da Luiza IA e Luna Messenger.</li>
                      <li><strong className="text-foreground">Armazenamento:</strong> Os dados serão arquivados por 36 meses no Google Drive Luiz IA Treinamentos.</li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => setTrainingTermAccepted(true)}
                      disabled={isProcessingTraining}
                      className="mt-2 w-full px-4 py-2 rounded-lg gold-gradient text-primary font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      ✓ Li e concordo em compartilhar este conhecimento com a Rede Elite
                    </button>
                  </div>
                )}

                {/* Capa */}
                <div>
                  <label className="text-xs font-bold text-foreground block mb-2">Foto de capa do empreendimento (opcional)</label>
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-border rounded-xl p-4 flex items-center gap-3 hover:border-gold/50 transition-colors"
                  >
                    {trainingCover ? (
                      <img src={trainingCover} alt="capa" className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="text-muted-foreground" size={28} />
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {trainingCover ? "Clique para trocar a imagem" : "Clique para fazer upload da capa"}
                    </div>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleCoverChange(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                {/* PDFs */}
                <div>
                  <label className="text-xs font-bold text-foreground block mb-2">
                    Documentos PDF ({trainingFiles.length}/10)
                  </label>
                  <button
                    onClick={() => {
                      if (!trainingTermAccepted) {
                        alert("Para selecionar PDFs, aceite o Termo de Contribuição de Conteúdo no topo da janela.");
                        return;
                      }
                      fileInputRef.current?.click();
                    }}
                    disabled={trainingFiles.length >= 10 || isProcessingTraining || !trainingTermAccepted}
                    className="w-full border-2 border-dashed border-gold/40 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title={!trainingTermAccepted ? "Aceite o termo para liberar o upload" : ""}
                  >
                    <Upload className="text-gold" size={28} />
                    <span className="text-xs font-bold text-foreground">Selecionar PDFs</span>
                    <span className="text-[10px] text-muted-foreground">
                      {trainingTermAccepted ? "Memorial Descritivo, Contrato, Tabela de Vendas, etc." : "🔒 Aceite o termo acima para liberar"}
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => handleAddFiles(e.target.files)}
                  />
                  {trainingFiles.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {trainingFiles.map((f, i) => (
                        <li key={i} className="flex items-center justify-between bg-muted px-3 py-2 rounded-lg text-xs">
                          <span className="flex items-center gap-2 truncate">
                            <FileText size={14} className="text-gold flex-shrink-0" />
                            <span className="truncate">{f.name}</span>
                            <span className="text-muted-foreground flex-shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
                          </span>
                          <button
                            onClick={() => removeTrainingFile(i)}
                            disabled={isProcessingTraining}
                            className="text-destructive hover:text-destructive/80 flex-shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Imagens (fotos do empreendimento, plantas, prints de tabela) */}
                <div>
                  <label className="text-xs font-bold text-foreground block mb-2">
                    Imagens ({trainingImages.length}/10) — fotos, plantas, prints de tabelas
                  </label>
                  <button
                    onClick={() => {
                      if (!trainingTermAccepted) {
                        alert("Para enviar imagens, aceite o Termo de Contribuição de Conteúdo no topo da janela.");
                        return;
                      }
                      trainingImageInputRef.current?.click();
                    }}
                    disabled={trainingImages.length >= 10 || isProcessingTraining || !trainingTermAccepted}
                    className="w-full border-2 border-dashed border-gold/40 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Upload className="text-gold" size={28} />
                    <span className="text-xs font-bold text-foreground">Selecionar imagens</span>
                    <span className="text-[10px] text-muted-foreground">
                      {trainingTermAccepted ? "Fotos, plantas humanizadas, tabelas, folders, etc." : "🔒 Aceite o termo acima para liberar"}
                    </span>
                  </button>
                  <input
                    ref={trainingImageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleAddTrainingImages(e.target.files)}
                  />
                  {trainingImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {trainingImages.map((img, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                          <img src={img.dataUrl} alt={img.name} className="w-full h-20 object-cover" />
                          <button
                            onClick={() => removeTrainingImage(i)}
                            disabled={isProcessingTraining}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-border flex justify-end gap-2">
                <button
                  onClick={() => setIsTrainingOpen(false)}
                  disabled={isProcessingTraining}
                  className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={processTraining}
                  disabled={(trainingFiles.length === 0 && trainingImages.length === 0) || isProcessingTraining || !trainingTermAccepted}
                  className="px-6 py-2.5 rounded-lg gold-gradient text-primary font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
                >
                  {isProcessingTraining ? (
                    <><Loader2 size={16} className="animate-spin" /> Processando...</>
                  ) : (
                    <><Sparkles size={16} /> Treinar Luiza</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
