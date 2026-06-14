import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Building2,
  Briefcase,
  Home,
  Loader2,
  Download,
  Info,
  Layers,
  MessageSquare,
  Instagram,
  Facebook,
  Copy,
  Check,
  Plus,
  Minus,
  Video,
  Calendar,
  ShieldCheck,
  Zap,
  Heart,
  Diamond,
  Trash2,
  Lock,
  Layout,
  MessageCircle,
  Send,
  AlertCircle,
  CreditCard,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { isMasterAccess, validatePassword } from "@/lib/eliteUtils";

// Senha de acesso validada server-side via edge function `validate-luiza-access`.

const MOODS = [
  {
    id: "luxury",
    name: "Luxo",
    icon: Diamond,
    description: "Cores sóbrias, exclusividade e alto padrão.",
    keywords: ["Exclusividade", "Alto Padrão", "Legado", "Sóbrio", "Elegância"],
    imageStyle: "Cores sóbrias, tons terrosos e metálicos, iluminação dramática e elegante.",
  },
  {
    id: "urgency",
    name: "Urgência",
    icon: Zap,
    description: "Foco em oportunidade única e antecipação.",
    keywords: ["Últimas Unidades", "Oportunidade Única", "Antecipe-se", "Agora ou Nunca"],
    imageStyle: "Iluminação vibrante, contrastes fortes, sensação de dinamismo.",
  },
  {
    id: "lifestyle",
    name: "Família/Lifestyle",
    icon: Heart,
    description: "Qualidade de vida e segurança para a família.",
    keywords: ["Qualidade de vida", "Segurança", "Família", "Bem-estar", "Lar"],
    imageStyle: "Cores quentes, iluminação natural suave, atmosfera acolhedora e feliz.",
  },
];

interface Scenario {
  id: string;
  name: string;
  icon: any;
  description: string;
  isCarousel?: boolean;
  basePrompts?: string[];
  prompt?: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "carousel",
    name: "1 - Modo Carrossel",
    icon: Layers,
    description: "MULTI-POST: Sequência personalizada para redes sociais.",
    isCarousel: true,
    basePrompts: [
      "posando de forma confiante com a fachada de um empreendimento imobiliário de luxo ao fundo. Estilo capa de revista, 8k.",
      "na área de lazer de um clube de campo privativo, com piscinas e jardins luxuosos ao fundo. Sorrindo e relaxado.",
      "na varanda gourmet de um apartamento de alto padrão durante o pôr do sol (golden hour), apreciando a vista.",
      "em uma reunião de negócios em um lounge luxuoso, apontando para um catálogo de imóveis.",
      "caminhando pelo jardim de um condomínio de luxo, visual moderno e sofisticado.",
      "em uma cozinha gourmet de conceito aberto, segurando uma taça de vinho, clima de celebração.",
      "na entrada monumental de um prédio de alto padrão, transmitindo autoridade e sucesso.",
      "em um escritório de design de interiores, discutindo acabamentos de luxo.",
      "na academia privativa de um empreendimento, visual fitness e dinâmico.",
      "no rooftop de um prédio icônico com vista panorâmica da cidade à noite.",
      "recebendo clientes em um hall de entrada suntuoso com mármore e iluminação quente.",
      "assinando um contrato em uma mesa de madeira nobre, foco em fechamento de negócio.",
    ],
  },
  {
    id: "templates",
    name: "2 - Templates",
    icon: Layout,
    description: "Templates redes sociais Facebook e Instagram.",
    prompt:
      "em um layout de design gráfico profissional para redes sociais, com bordas elegantes, tipografia de luxo e elementos visuais de marketing imobiliário. Fundo de alto padrão.",
  },
  {
    id: "optional",
    name: "3 - Opcional",
    icon: MessageSquare,
    description: "Descreva o cenário desejado.",
    prompt: "em um cenário personalizado conforme a descrição do usuário, mantendo o nível de luxo e sofisticação 8k.",
  },
  {
    id: "stand",
    name: "4 - Stand de Vendas",
    icon: Building2,
    description: "No stand de vendas luxuoso, segurando uma maquete.",
    prompt:
      "sorrindo e segurando uma maquete física de um prédio em um stand de vendas luxuoso e movimentado. Estilo Architectural Digest, 8k, iluminação cinematográfica.",
  },
  {
    id: "decorado",
    name: "5 - Apartamento Decorado",
    icon: Home,
    description: "Na varanda gourmet de um decorado no pôr do sol.",
    prompt:
      "em uma varanda gourmet de um apartamento decorado de alto padrão, olhando a vista da cidade durante o pôr do sol (golden hour). Estilo fotorrealista, luxo e sofisticação.",
  },
  {
    id: "linkedin",
    name: "6 - Perfil Profissional",
    icon: Briefcase,
    description: "Retrato corporativo elegante (Headshot).",
    prompt:
      "retrato profissional (headshot), vestindo um blazer elegante, com fundo de escritório moderno desfocado (bokeh). Iluminação de estúdio, 8k, alta definição.",
  },
];

interface CaptionsData {
  instagram: string;
  facebook: string;
  videoScript: { hook: string; content: string; cta: string };
  calendar: { day: string; action: string; engagement: string }[];
}

const LuizaEliteMarketing = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Credit system
  const FREE_MONTHLY_LIMIT = 24;
  const BONUS_CREDITS_AMOUNT = 30;

  const getCreditsData = useCallback(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
    const stored = localStorage.getItem("luiza_elite_credits");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.month === currentMonth) {
        return { month: currentMonth, used: parsed.used || 0, bonus: parsed.bonus || 0 };
      }
    }
    return { month: currentMonth, used: 0, bonus: 0 };
  }, []);

  const [creditsData, setCreditsData] = useState(getCreditsData);
  const [isBuyingCredits, setIsBuyingCredits] = useState(false);

  const remainingCredits = FREE_MONTHLY_LIMIT - creditsData.used + creditsData.bonus;

  const saveCredits = (data: typeof creditsData) => {
    localStorage.setItem("luiza_elite_credits", JSON.stringify(data));
    setCreditsData(data);
  };

  const consumeCredits = (count: number) => {
    const updated = { ...creditsData, used: creditsData.used + count };
    saveCredits(updated);
  };

  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [primaryReferenceIndex, setPrimaryReferenceIndex] = useState(0);
  const [projectContext, setProjectContext] = useState("");
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);
  const [carouselCount, setCarouselCount] = useState(3);

  const [showWatermark, setShowWatermark] = useState(false);
  const [brokerName, setBrokerName] = useState("");
  const [creci, setCreci] = useState("");
  const [showLaunchBadge, setShowLaunchBadge] = useState(false);

  // Composição Avançada
  const [gazeDirection, setGazeDirection] = useState("frente");
  const [bodyPose, setBodyPose] = useState("perfil");

  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedCaptions, setGeneratedCaptions] = useState<CaptionsData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("luiza_elite_auth");
    if (stored === "true" || isMasterAccess()) setIsAuthenticated(true);

    // Check for Mercado Pago return
    const params = new URLSearchParams(window.location.search);
    const creditsStatus = params.get("credits");
    if (creditsStatus === "success") {
      const current = getCreditsData();
      const updated = { ...current, bonus: current.bonus + BONUS_CREDITS_AMOUNT };
      saveCredits(updated);
      toast({ title: "Créditos adicionados!", description: `+${BONUS_CREDITS_AMOUNT} imagens disponíveis.` });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleAuth = async () => {
    try {
      const result = await validatePassword(password, "luiza_elite");
      if (result.valid) {
        setIsAuthenticated(true);
        sessionStorage.setItem("luiza_elite_auth", "true");
        setAuthError("");
      } else {
        setAuthError("Senha incorreta. Tente novamente.");
      }
    } catch {
      setAuthError("Falha ao validar senha. Tente novamente.");
    }
  };

  const processFiles = (files: FileList | File[]) => {
    const fileList = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 12 - referenceImages.length);
    if (fileList.length === 0) return;

    let processedCount = 0;
    const newImages: string[] = [];
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        processedCount++;
        if (processedCount === fileList.length) {
          setReferenceImages((prev) => [...prev, ...newImages].slice(0, 12));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) processFiles(files);
    }
  };

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [referenceImages]);

  const removeReferenceImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
    if (primaryReferenceIndex >= index && primaryReferenceIndex > 0) {
      setPrimaryReferenceIndex((prev) => prev - 1);
    }
  };

  const applyWatermark = (base64: string, text: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(base64);
          return;
        }
        ctx.drawImage(img, 0, 0);
        ctx.font = `${Math.floor(img.width * 0.025)}px serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(text, img.width - 20, img.height - 20);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = base64;
    });
  };

  const buyCredits = async () => {
    setIsBuyingCredits(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("mercadopago-checkout", {
        body: { userEmail: null },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (data?.init_point) {
        window.open(data.init_point, "_blank");
      } else {
        throw new Error("Link de pagamento não gerado");
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Falha ao gerar link de pagamento.", variant: "destructive" });
    } finally {
      setIsBuyingCredits(false);
    }
  };

  const generateHub = async () => {
    if (referenceImages.length === 0) {
      setError("Por favor, envie pelo menos uma foto de referência.");
      return;
    }
    if (!projectContext.trim()) {
      setError("Por favor, descreva o empreendimento e a mensagem de venda.");
      return;
    }

    const imagesNeeded = selectedScenario.isCarousel ? carouselCount : 1;
    if (remainingCredits < imagesNeeded) {
      setError(
        `Créditos insuficientes. Você precisa de ${imagesNeeded} crédito(s) mas tem ${Math.max(0, remainingCredits)}. Adquira mais créditos.`,
      );
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setGeneratedCaptions(null);
    setActiveSlide(0);

    try {
      const imageBase64 = referenceImages[primaryReferenceIndex].split(",")[1];
      const results: string[] = [];

      const gazeLabel = gazeDirection === "frente" ? "Olho Direto (Frente)" : "Olhar lateral";
      const poseLabel = bodyPose === "perfil" ? "Cumprimentando (Perfil)" : "Postura frontal";
      const compositionPrompt = `Direção do olhar: ${gazeLabel}. Postura corporal: ${poseLabel}.`;

      const prompts: string[] = [];
      if (selectedScenario.isCarousel && selectedScenario.basePrompts) {
        const promptsToUse = selectedScenario.basePrompts.slice(0, carouselCount);
        for (let i = 0; i < promptsToUse.length; i++) {
          const slideIndex = i + 1;
          let categoryPrompt = "";
          if (slideIndex <= 3)
            categoryPrompt =
              "Foco Aspiracional: Rosto do corretor em destaque com a fachada ou área de lazer luxuosa ao fundo.";
          else if (slideIndex <= 8)
            categoryPrompt =
              "Foco Técnico/Detalhes: Detalhes de acabamentos nobres, interiores suntuosos ou plantas humanizadas ao fundo.";
          else
            categoryPrompt =
              "Foco Fechamento: Rosto do corretor sorrindo de forma acolhedora e confiante, transmitindo sucesso.";

          prompts.push(`Uma fotografia de nível profissional da pessoa na foto de referência fornecida. 
          Contexto do empreendimento: ${projectContext}. 
          Mood: ${selectedMood.name} (${selectedMood.imageStyle}).
          ${compositionPrompt}
          ${categoryPrompt}
          Ela deve estar ${promptsToUse[i]}
          ${showLaunchBadge ? "Inclua um selo/badge elegante de 'LANÇAMENTO' no canto da imagem." : ""}`);
        }
      } else {
        prompts.push(`Uma fotografia de nível profissional da pessoa na foto de referência fornecida. 
        Contexto do empreendimento: ${projectContext}. 
        Mood: ${selectedMood.name} (${selectedMood.imageStyle}).
        ${compositionPrompt}
        Ela deve estar ${selectedScenario.prompt}
        ${showLaunchBadge ? "Inclua um selo/badge elegante de 'LANÇAMENTO' no canto da imagem." : ""}`);
      }

      for (const prompt of prompts) {
        const { data, error: fnErr } = await supabase.functions.invoke("luiza-elite-marketing", {
          body: { action: "generate-image", prompt, imageBase64 },
        });

        if (fnErr) throw new Error(fnErr.message);

        let finalImage = "";
        if (data?.type === "image" && data?.url) {
          finalImage = data.url;
        } else if (data?.content) {
          console.log("AI returned text instead of image:", data.content);
          continue;
        }

        if (finalImage && showWatermark && (brokerName || creci)) {
          finalImage = await applyWatermark(finalImage, `${brokerName} ${creci ? `| CRECI ${creci}` : ""}`);
        }
        if (finalImage) results.push(finalImage);
      }

      if (results.length === 0)
        throw new Error("Falha ao gerar imagens. O modelo pode não suportar geração de imagem neste momento.");
      setGeneratedImages(results);
      consumeCredits(results.length);

      const { data: captionData, error: capErr } = await supabase.functions.invoke("luiza-elite-marketing", {
        body: {
          action: "generate-captions",
          context: projectContext,
          mood: selectedMood,
          scenario: selectedScenario.name,
          imageCount: results.length,
        },
      });

      if (!capErr && captionData && !captionData.error) {
        setGeneratedCaptions(captionData);
      }
    } catch (err: any) {
      console.error("Erro no Hub:", err);
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadAll = () => {
    generatedImages.forEach((img, index) => {
      const link = document.createElement("a");
      link.href = img;
      link.download = `elite-post-${index + 1}.png`;
      link.click();
    });
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(`Olá! Vi o post sobre o ${projectContext} e gostaria de mais informações.`);
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const openCadastro = () => {
    alert(`Redirecionando para a página de cadastro do empreendimento: ${projectContext}`);
  };

  // ====== PASSWORD GATE ======
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-sm elite-gradient border-gold/30">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/20 flex items-center justify-center border border-gold/30">
                <Lock className="w-8 h-8 text-gold" />
              </div>
              <h2 className="text-xl font-bold text-gold tracking-wider">LUIZA ELITE</h2>
              <p className="text-xs text-gold/60 uppercase tracking-[3px]">Agente de Marketing IA</p>
            </div>

            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Senha de acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                className="text-center bg-primary/50 border-gold/30 text-gold placeholder:text-gold/30"
              />
              {authError && <p className="text-xs text-red-400 text-center">{authError}</p>}
              <Button onClick={handleAuth} className="w-full gold-gradient text-primary font-bold">
                ENTRAR
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ====== MAIN UI ======
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="elite-gradient border-b-2 border-gold/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center border border-gold/30">
            <Sparkles className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-gold tracking-wider uppercase">Luiza Elite — Hub de Marketing</h1>
            <p className="text-[10px] text-gold/50 tracking-[3px] uppercase">
              Agente Especialista em Marketing Imobiliário
            </p>
          </div>

          {/* Credits Display */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end gap-1">
              <a
                href="https://luiza.elitemkt.nom.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded border border-gold/60 text-gold hover:bg-gold/10 transition-colors whitespace-nowrap"
              >
                💎 Comprar no Site (Melhor Preço)
              </a>
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-gold/50 uppercase leading-none">Créditos</p>
                <p
                  className={cn("text-sm font-bold leading-tight", remainingCredits > 5 ? "text-gold" : "text-red-400")}
                >
                  {Math.max(0, remainingCredits)} img
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={buyCredits}
              disabled={isBuyingCredits}
              className="gold-gradient text-primary font-bold text-xs gap-1"
            >
              {isBuyingCredits ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShoppingCart className="w-3 h-3" />}
              <span className="hidden sm:inline">+ Créditos</span>
            </Button>
          </div>
        </div>

        {/* Credits Banner */}
        {remainingCredits <= 5 && (
          <div className="bg-red-900/30 border-t border-red-500/30 px-4 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {remainingCredits <= 0
                    ? "Seus créditos acabaram! Adquira mais para continuar gerando imagens."
                    : `Restam apenas ${remainingCredits} crédito(s) este mês.`}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={buyCredits}
                disabled={isBuyingCredits}
                className="border-red-500/50 text-red-300 text-xs whitespace-nowrap"
              >
                <span className="line-through text-red-400/60 mr-1">R$ 99,90</span> R$ 49,90 — 30 imagens
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN - Configuration */}
          <div className="lg:col-span-5 space-y-6">
            {/* Luiza Greeting */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 elite-gradient">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold/30 shrink-0">
                <img
                  src="https://lh3.googleusercontent.com/d/1wGD2gu7CgkvpwC8KY1lDPT-WejyJrSDk"
                  alt="Luiza"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gold">Olá, eu sou a Luiza!</p>
                <p className="text-xs text-gold/60 leading-relaxed">
                  Estou pronta para transformar seu contexto imobiliário em mídias de elite. Vamos começar?
                </p>
              </div>
            </div>

            {/* Section 1: Reference Photos & Context */}
            <section className="space-y-4" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-semibold">1. Identidade e Contexto</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {referenceImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-border group"
                    >
                      <img src={img} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button
                          onClick={() => setPrimaryReferenceIndex(idx)}
                          className={cn(
                            "p-1 rounded bg-gold text-white",
                            primaryReferenceIndex === idx && "ring-2 ring-white",
                          )}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeReferenceImage(idx)}
                          className="p-1 rounded bg-destructive text-white"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      {primaryReferenceIndex === idx && (
                        <div className="absolute top-1 left-1">
                          <Badge className="h-4 text-[8px] px-1 bg-gold">PRINCIPAL</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                  {referenceImages.length < 12 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-gold/50 transition-colors flex flex-col items-center justify-center text-muted-foreground"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-[8px] mt-1">ADD</span>
                    </button>
                  )}
                </div>

                {referenceImages.length === 0 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-gold/50 rounded-2xl p-8 cursor-pointer transition-all"
                  >
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-sm">Arraste, cole ou clique para enviar</p>
                        <p className="text-xs mt-1">Até 12 fotos de referência</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="context" className="text-sm font-medium">
                    Qual o empreendimento e a mensagem de venda?
                  </Label>
                  <Textarea
                    id="context"
                    placeholder="Ex: Empreendeimento. Cadastre-se e antecipe-se ao lançamento. Garanta condições especiais de pré-venda."
                    className="min-h-[100px] resize-none bg-card/50"
                    value={projectContext}
                    onChange={(e) => setProjectContext(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" />A Luiza usará isso para criar suas legendas e personalizar as imagens.
                  </p>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*"
                multiple
              />
            </section>

            {/* Section 2: Mood */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Diamond className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-semibold">2. Mood e Estilo</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MOODS.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => setSelectedMood(mood)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center group",
                      selectedMood.id === mood.id
                        ? "bg-secondary border-gold/50 ring-1 ring-gold/20"
                        : "bg-card border-border hover:border-gold/30",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        selectedMood.id === mood.id
                          ? "bg-gold text-white"
                          : "bg-secondary text-muted-foreground group-hover:text-gold",
                      )}
                    >
                      <mood.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{mood.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Section 3: Personalization */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-semibold">3. Personalização</h2>
              </div>
              <Card className="bg-card/50 border-border/40">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-5 text-[9px]">
                        SELO
                      </Badge>
                      <Label htmlFor="launch-badge" className="text-xs">
                        Selo de Lançamento
                      </Label>
                    </div>
                    <input
                      type="checkbox"
                      id="launch-badge"
                      checked={showLaunchBadge}
                      onChange={(e) => setShowLaunchBadge(e.target.checked)}
                      className="accent-gold h-4 w-4"
                    />
                  </div>
                  <Separator className="bg-border/20" />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-5 text-[9px]">
                          PROTEÇÃO
                        </Badge>
                        <Label htmlFor="watermark" className="text-xs">
                          Marca D'água (CRECI)
                        </Label>
                      </div>
                      <input
                        type="checkbox"
                        id="watermark"
                        checked={showWatermark}
                        onChange={(e) => setShowWatermark(e.target.checked)}
                        className="accent-gold h-4 w-4"
                      />
                    </div>
                    {showWatermark && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="grid grid-cols-2 gap-2 pt-1"
                      >
                        <Input
                          placeholder="Seu Nome"
                          className="h-8 text-xs bg-background/50"
                          value={brokerName}
                          onChange={(e) => setBrokerName(e.target.value)}
                        />
                        <Input
                          placeholder="CRECI"
                          className="h-8 text-xs bg-background/50"
                          value={creci}
                          onChange={(e) => setCreci(e.target.value)}
                        />
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 4: Scenario */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-semibold">4. Formato do Post</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {SCENARIOS.map((scenario) => (
                  <div key={scenario.id} className="space-y-3">
                    <button
                      onClick={() => setSelectedScenario(scenario)}
                      className={cn(
                        "w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left group",
                        selectedScenario.id === scenario.id
                          ? "bg-secondary border-gold/50 ring-1 ring-gold/20"
                          : "bg-card border-border hover:border-gold/30",
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          selectedScenario.id === scenario.id
                            ? "bg-gold text-white"
                            : "bg-secondary text-muted-foreground group-hover:text-gold",
                        )}
                      >
                        <scenario.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm">{scenario.name}</h3>
                          {scenario.isCarousel && (
                            <Badge variant="secondary" className="text-[9px] h-4">
                              MULTI-POST
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{scenario.description}</p>
                      </div>
                    </button>
                    {scenario.isCarousel && selectedScenario.id === scenario.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-4 py-3 bg-secondary/30 rounded-xl border border-border/40 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">Quantidade de Imagens</Label>
                          <Badge variant="outline" className="text-gold border-gold/30">
                            {carouselCount}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCarouselCount(Math.max(1, carouselCount - 1))}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gold transition-all duration-300"
                              style={{ width: `${(carouselCount / 12) * 100}%` }}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCarouselCount(Math.min(12, carouselCount + 1))}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center italic">
                          Slides 1-3: Aspiracional | 4-8: Detalhes | 9-12: Fechamento
                        </p>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5: COMPOSIÇÃO AVANÇADA */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-gold" />
                <h2 className="text-sm font-bold text-gold uppercase tracking-wider">COMPOSIÇÃO AVANÇADA</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Olhar da imagem</Label>
                  <Select value={gazeDirection} onValueChange={setGazeDirection}>
                    <SelectTrigger className="bg-card/50 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="frente">Olho Direto (Frente)</SelectItem>
                      <SelectItem value="lateral">Olhar Lateral</SelectItem>
                      <SelectItem value="baixo">Olhar para Baixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Pose do Modelo</Label>
                  <Select value={bodyPose} onValueChange={setBodyPose}>
                    <SelectTrigger className="bg-card/50 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perfil">Cumprimentando (Perfil)</SelectItem>
                      <SelectItem value="frontal">Postura Frontal</SelectItem>
                      <SelectItem value="sentado">Sentado Elegante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">Ajustes hiperpersonalizados específicos</p>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-gold/5 border border-gold/20 text-xs text-gold/80">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-gold" />
                <span>Dica: Hiperpersonalize ao máximo, enviando várias fotos de bons ângulos.</span>
              </div>
            </section>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={generateHub}
              disabled={isGenerating || referenceImages.length === 0 || !projectContext.trim()}
              className="w-full h-14 gold-gradient text-primary font-bold text-base uppercase tracking-wider gap-3 rounded-xl shadow-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Luiza está criando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Gerar Pacote Completo
                </>
              )}
            </Button>
          </div>

          {/* RIGHT COLUMN - Results */}
          <div className="lg:col-span-7">
            <Card className="border-border/60 bg-card/50 backdrop-blur-sm flex flex-col overflow-hidden min-h-[500px]">
              <Tabs defaultValue="images" className="w-full flex flex-col h-full">
                <div className="px-4 sm:px-6 pt-4 border-b border-border/40 flex items-center justify-between flex-wrap gap-2">
                  <TabsList className="bg-secondary/50">
                    <TabsTrigger value="images" className="gap-2 text-xs">
                      <ImageIcon className="w-4 h-4" /> Imagens
                    </TabsTrigger>
                    <TabsTrigger value="captions" className="gap-2 text-xs" disabled={!generatedCaptions}>
                      <MessageSquare className="w-4 h-4" /> Copys Prontas
                    </TabsTrigger>
                    <TabsTrigger value="strategy" className="gap-2 text-xs" disabled={!generatedCaptions}>
                      <Video className="w-4 h-4" /> Scripts & Cronograma
                    </TabsTrigger>
                  </TabsList>
                  {generatedImages.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={downloadAll} className="text-gold hover:text-gold gap-2">
                      <Download className="w-4 h-4" /> Baixar Tudo
                    </Button>
                  )}
                </div>

                <TabsContent value="images" className="flex-1 p-0 m-0 relative">
                  {generatedImages.length > 0 && (
                    <div className="absolute top-4 left-4 z-10">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setGeneratedImages([])}
                        className="h-8 gap-2 bg-destructive/80 backdrop-blur-sm"
                      >
                        <Trash2 className="w-4 h-4" /> Remover Mídia
                      </Button>
                    </div>
                  )}
                  <AnimatePresence mode="wait">
                    {isGenerating ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-[400px] flex flex-col items-center justify-center gap-4 text-center p-8"
                      >
                        <div className="relative">
                          <div className="w-20 h-20 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
                          <Sparkles className="w-6 h-6 text-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-lg font-medium">Luiza está criando sua mídia...</p>
                          <p className="text-sm text-muted-foreground max-w-xs mx-auto italic">
                            "Estou ajustando cada detalhe para que você brilhe nas redes sociais."
                          </p>
                        </div>
                      </motion.div>
                    ) : generatedImages.length > 0 ? (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-6 space-y-6"
                      >
                        <div className="relative group rounded-2xl overflow-hidden border border-gold/20 shadow-2xl shadow-gold/5 max-w-xl mx-auto">
                          <img
                            src={generatedImages[activeSlide]}
                            alt={`Slide ${activeSlide + 1}`}
                            className="w-full h-auto object-contain bg-black/5"
                          />
                          {generatedImages.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 backdrop-blur-md p-2 rounded-full max-w-[90%] overflow-x-auto">
                              {generatedImages.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setActiveSlide(i)}
                                  className={cn(
                                    "w-2 h-2 rounded-full transition-all shrink-0",
                                    activeSlide === i ? "bg-gold w-6" : "bg-white/40 hover:bg-white/60",
                                  )}
                                />
                              ))}
                            </div>
                          )}
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-black/60 backdrop-blur-md border-gold/30 text-gold">
                              {generatedImages.length > 1
                                ? `SLIDE ${activeSlide + 1}/${generatedImages.length}`
                                : "8K ELITE"}
                            </Badge>
                          </div>
                        </div>
                        {generatedImages.length > 1 && (
                          <ScrollArea className="w-full whitespace-nowrap rounded-xl border border-border/40 p-4">
                            <div className="flex gap-4">
                              {generatedImages.map((img, i) => (
                                <button
                                  key={i}
                                  onClick={() => setActiveSlide(i)}
                                  className={cn(
                                    "w-20 aspect-square rounded-lg overflow-hidden border-2 transition-all shrink-0",
                                    activeSlide === i
                                      ? "border-gold scale-105"
                                      : "border-transparent opacity-60 hover:opacity-100",
                                  )}
                                >
                                  <img src={img} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </motion.div>
                    ) : (
                      <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-muted-foreground text-center p-8">
                        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-2">
                          <ImageIcon className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-lg font-medium">Seu Hub de Mídia está vazio</p>
                        <p className="text-sm max-w-xs">
                          Preencha o contexto e clique em gerar para criar seu pacote de posts.
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="captions" className="flex-1 p-4 sm:p-6 m-0 overflow-auto">
                  {generatedCaptions && (
                    <div className="space-y-6 animate-in fade-in">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateHub}
                          className="h-8 gap-2 border-gold/30 text-gold hover:bg-gold/10"
                        >
                          <Sparkles className="w-4 h-4" /> Refazer com Luiza
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setGeneratedCaptions(null)}
                          className="h-8 gap-2 bg-destructive/80 backdrop-blur-sm"
                        >
                          <Trash2 className="w-4 h-4" /> Remover Legendas
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Instagram className="w-5 h-5 text-pink-500" />
                              <h3 className="font-semibold text-sm">Legenda Instagram</h3>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(generatedCaptions.instagram, "insta")}
                              className="h-8 gap-2"
                            >
                              {copied === "insta" ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                              {copied === "insta" ? "Copiado" : "Copiar Texto"}
                            </Button>
                          </div>
                          <Textarea
                            value={generatedCaptions.instagram}
                            onChange={(e) => setGeneratedCaptions({ ...generatedCaptions, instagram: e.target.value })}
                            className="min-h-[200px] bg-secondary/50 border-border/40 focus:border-gold/50 resize-none leading-relaxed"
                          />
                        </div>
                      </div>

                      <Separator className="bg-border/40" />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Facebook className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-sm">Legenda Facebook</h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(generatedCaptions.facebook, "fb")}
                            className="h-8 gap-2"
                          >
                            {copied === "fb" ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                            {copied === "fb" ? "Copiado" : "Copiar Texto"}
                          </Button>
                        </div>
                        <Textarea
                          value={generatedCaptions.facebook}
                          onChange={(e) => setGeneratedCaptions({ ...generatedCaptions, facebook: e.target.value })}
                          className="min-h-[200px] bg-secondary/50 border-border/40 focus:border-gold/50 resize-none leading-relaxed"
                        />
                      </div>

                      {/* WhatsApp & Cadastro buttons */}
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <Button
                          onClick={openCadastro}
                          className="h-12 gold-gradient text-primary gap-2 shadow-lg shadow-gold/10 font-bold"
                        >
                          <Send className="w-4 h-4" /> Cadastro
                        </Button>
                        <Button
                          onClick={openWhatsApp}
                          variant="outline"
                          className="h-12 border-green-500/50 text-green-600 hover:bg-green-500/10 hover:text-green-700 gap-2"
                        >
                          <MessageCircle className="w-4 h-4" /> WhatsApp
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="strategy" className="flex-1 p-4 sm:p-6 m-0 overflow-auto">
                  {generatedCaptions && (
                    <div className="space-y-8 animate-in fade-in">
                      {/* Video Script */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-gold/10">
                            <Video className="w-5 h-5 text-gold" />
                          </div>
                          <h3 className="font-semibold text-lg">Roteiro de Vídeo Curto (30s)</h3>
                        </div>
                        <Card className="bg-secondary/30 border-gold/10 overflow-hidden">
                          <CardContent className="p-0">
                            <div className="p-4 border-b border-gold/10">
                              <Badge variant="outline" className="mb-2 text-gold border-gold/30">
                                GANCHO (5s)
                              </Badge>
                              <p className="text-sm italic">"{generatedCaptions.videoScript.hook}"</p>
                            </div>
                            <div className="p-4 border-b border-gold/10 bg-gold/5">
                              <Badge variant="outline" className="mb-2 text-gold border-gold/30">
                                CONTEÚDO (20s)
                              </Badge>
                              <p className="text-sm leading-relaxed">{generatedCaptions.videoScript.content}</p>
                            </div>
                            <div className="p-4">
                              <Badge variant="outline" className="mb-2 text-gold border-gold/30">
                                CTA (5s)
                              </Badge>
                              <p className="text-sm font-medium">"{generatedCaptions.videoScript.cta}"</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Separator className="bg-border/40" />

                      {/* Posting Calendar */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-gold/10">
                            <Calendar className="w-5 h-5 text-gold" />
                          </div>
                          <h3 className="font-semibold text-lg">Cronograma de Postagem</h3>
                        </div>
                        <div className="grid gap-3">
                          {generatedCaptions.calendar.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex gap-4 p-4 rounded-xl bg-card border border-border/40 hover:border-gold/30 transition-colors"
                            >
                              <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-secondary shrink-0">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">DIA</span>
                                <span className="text-lg font-bold text-gold">{idx + 1}</span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{item.action}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-gold" />
                                  {item.engagement}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-12 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <p className="text-sm text-muted-foreground">© 2026 Luiza Elite Hub - Inteligência de Mídia Imobiliária</p>
          <div className="flex items-center justify-center gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-gold transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="text-xs text-muted-foreground hover:text-gold transition-colors">
              Privacidade
            </a>
            <a href="#" className="text-xs text-muted-foreground hover:text-gold transition-colors">
              Suporte Elite
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LuizaEliteMarketing;
