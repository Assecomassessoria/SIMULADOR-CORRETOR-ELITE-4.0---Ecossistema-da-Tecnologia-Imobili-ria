import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  Image,
  Send,
  Pencil,
  LayoutGrid,
  Settings,
  LogOut,
  Upload,
  X,
  Download,
  Wand2,
  FileText,
  Film,
  User,
  LayoutTemplate,
  Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { applyTextOverlay } from "@/lib/textOverlay";
import ImageEditor from "./ImageEditor";
import TemplateSelector from "./TemplateSelector";
import { isMasterAccess } from "@/lib/eliteUtils";

type Step = "form" | "preview" | "publishing";
type Status = "idle" | "loading" | "success" | "error";
type PostType = "single" | "carousel";

interface UploadedFile {
  dataUrl: string;
  type: "image" | "video" | "pdf";
  name: string;
}

const MONTHLY_IMAGE_LIMIT = 24;

const getMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const getImageUsageKey = (userId: string) => `admanager_img_usage_${userId}_${getMonthKey()}`;

const loadImageUsage = (userId: string): number => {
  try {
    return parseInt(localStorage.getItem(getImageUsageKey(userId)) || "0", 10) || 0;
  } catch {
    return 0;
  }
};

const incrementImageUsage = (userId: string, count: number): number => {
  const current = loadImageUsage(userId);
  const next = current + count;
  localStorage.setItem(getImageUsageKey(userId), String(next));
  return next;
};

const audiencePresets = [
  { value: "interesses_imoveis", label: "Interessados em Imóveis" },
  { value: "alto_padrao", label: "Investidores Alto Padrão" },
  { value: "corretor_imoveis", label: "Corretor Imóveis" },
  { value: "corretora_imoveis", label: "Corretora Imóveis" },
  { value: "imobiliaria_imob", label: "Imobiliária" },
  { value: "construtora_const", label: "Construtoras" },
];

const AdManagerForm = () => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [metaConnected, setMetaConnected] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  const [descricao, setDescricao] = useState("");
  const [orcamento, setOrcamento] = useState("");
  const [publicoPreset, setPublicoPreset] = useState("interesses_imoveis");
  const [publicoCustom, setPublicoCustom] = useState("");
  const [useCustomAudience, setUseCustomAudience] = useState(false);
  const [postType, setPostType] = useState<PostType>("single");
  const [carouselSlides, setCarouselSlides] = useState(12);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<Step>("form");

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedCaption, setGeneratedCaption] = useState<string | null>(null);
  const [editableCaption, setEditableCaption] = useState("");
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [generateLogs, setGenerateLogs] = useState<string[]>([]);

  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [rawCarouselImages, setRawCarouselImages] = useState<string[]>([]);
  const [carouselPublicUrls, setCarouselPublicUrls] = useState<string[]>([]);
  const [carouselSlideTitles, setCarouselSlideTitles] = useState<string[]>([]);
  const [overlayApplied, setOverlayApplied] = useState(false);
  const [applyingOverlay, setApplyingOverlay] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editInstruction, setEditInstruction] = useState("");
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorImageIndex, setEditorImageIndex] = useState<number | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [videoOverlayText, setVideoOverlayText] = useState("");
  const [videoOverlayLoading, setVideoOverlayLoading] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoOverlayPosition, setVideoOverlayPosition] = useState<"top" | "center" | "bottom">("bottom");

  const [profileSuggestion, setProfileSuggestion] = useState<string | null>(null);
  const [imageUsage, setImageUsage] = useState(0);

  const remainingImages = Math.max(0, MONTHLY_IMAGE_LIMIT - imageUsage);
  const limitReached = imageUsage >= MONTHLY_IMAGE_LIMIT;

  const currentAudience = useCustomAudience ? publicoCustom : publicoPreset;

  const getFileType = (file: File): "image" | "video" | "pdf" | null => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type === "application/pdf") return "pdf";
    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const fileType = getFileType(file);
      if (!fileType) return;
      if (file.size > 20 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedFiles((prev) => [...prev, { dataUrl: reader.result as string, type: fileType, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const downloadImage = (src: string, filename: string) => {
    const link = document.createElement("a");
    link.href = src;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openEditDialog = (imageIndex: number | null) => {
    setEditingImageIndex(imageIndex);
    setEditInstruction("");
    setEditDialogOpen(true);
  };

  const handleEditImage = async () => {
    if (!editInstruction.trim()) return;
    setEditLoading(true);

    const imageToEdit = editingImageIndex === null ? generatedImage : carouselImages[editingImageIndex];

    if (!imageToEdit) {
      setEditLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("edit-image", {
        body: { imageUrl: imageToEdit, instruction: editInstruction },
      });

      if (error) throw new Error(error.message);
      if (!data?.sucesso) throw new Error(data?.error || "Erro ao editar imagem");

      if (editingImageIndex === null) {
        setGeneratedImage(data.imagemEditada);
      } else {
        setCarouselImages((prev) => prev.map((img, i) => (i === editingImageIndex ? data.imagemEditada : img)));
      }

      setEditDialogOpen(false);
      setEditInstruction("");
    } catch (err) {
      setMessage(`❌ ${err instanceof Error ? err.message : "Erro ao editar imagem"}`);
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const isMaster = isMasterAccess() || sessionStorage.getItem("luiza_elite_auth") === "true";
      if (isMaster) {
        setUser({ id: "master_user_id", email: "lourencoljritu@gmail.com" } as any);
        setMetaConnected(false);
        setImageUsage({ count: 0, lastReset: new Date().toISOString() });
        setAuthLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/marketing/auth");
        return;
      }
      setUser(user);
      setImageUsage(loadImageUsage(user.id));

      const { data: profile } = await supabase
        .from("profiles" as any)
        .select("meta_access_token, ig_user_id, email")
        .eq("id", user.id)
        .single();

      const p = profile as any;
      setMetaConnected(!!(p?.meta_access_token && p?.ig_user_id));

      if (p?.email) {
        const emailUser = (p.email as string).split("@")[0] || "";
        const emailDomain = (p.email as string).split("@")[1] || "";
        let suggestion = "Imóveis de luxo com acabamento premium";
        if (emailUser.toLowerCase().includes("consultor") || emailUser.toLowerCase().includes("corretor")) {
          suggestion = "Fotos profissionais do imóvel com foco em diferenciais, iluminação natural e ambientes amplos";
        }
        if (emailDomain.includes("imob") || emailDomain.includes("realt")) {
          suggestion = "Imagens institucionais da imobiliária com destaque para portfólio e atendimento";
        }
        setProfileSuggestion(suggestion);
      }

      setAuthLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const isMaster = isMasterAccess() || sessionStorage.getItem("luiza_elite_auth") === "true";
      if (!session && !isMaster) navigate("/marketing/auth");
    });

    checkAuth();
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGenerate = async () => {
    if (!descricao || !orcamento) {
      setStatus("error");
      setMessage("Por favor, preencha a descrição e o orçamento.");
      return;
    }
    if (useCustomAudience && !publicoCustom.trim()) {
      setStatus("error");
      setMessage("Por favor, digite o público-alvo personalizado.");
      return;
    }

    const imagesToConsume = postType === "carousel" ? carouselSlides : 1;
    if (!user?.id) {
      setStatus("error");
      setMessage("Sessão inválida. Faça login novamente.");
      return;
    }
    const currentUsage = loadImageUsage(user.id);
    if (currentUsage + imagesToConsume > MONTHLY_IMAGE_LIMIT) {
      setStatus("error");
      setMessage(
        `❌ Limite mensal de ${MONTHLY_IMAGE_LIMIT} imagens atingido (${currentUsage}/${MONTHLY_IMAGE_LIMIT}). Esta geração consumiria ${imagesToConsume}. Aguarde o próximo mês ou contate o suporte.`,
      );
      return;
    }

    setStatus("loading");
    setGeneratedImage(null);
    setGeneratedCaption(null);
    setCarouselImages([]);
    setRawCarouselImages([]);
    setCarouselPublicUrls([]);
    setCarouselSlideTitles([]);
    setOverlayApplied(false);

    const imageDataUrls = uploadedFiles.filter((f) => f.type === "image").map((f) => f.dataUrl);

    if (postType === "carousel") {
      setMessage(`🤖 Gerando carrossel com ${carouselSlides} slides...\nIsso pode levar alguns minutos.`);
      try {
        const { data, error } = await supabase.functions.invoke("generate-carousel", {
          body: { descricaoImovel: descricao, numSlides: carouselSlides },
        });
        if (error) throw new Error(error.message || "Erro ao gerar carrossel");
        if (!data?.sucesso) throw new Error(data?.error || "Erro ao gerar carrossel");

        setGenerateLogs(data.logs || []);
        setGeneratedCaption(data.legenda);
        setEditableCaption(data.legenda || "");
        setCarouselPublicUrls(data.publicUrls || []);

        const titles: string[] = data.slideTitles || [];
        setCarouselSlideTitles(titles);

        const rawImages: string[] = data.imagens || [];
        setRawCarouselImages(rawImages);
        setCarouselImages(rawImages);
        setOverlayApplied(false);

        if (user?.id && rawImages.length > 0) {
          setImageUsage(incrementImageUsage(user.id, rawImages.length));
        }

        setStatus("success");
        setMessage((data.logs || []).join("\n"));
        setStep("preview");
      } catch (error) {
        setStatus("error");
        setMessage(`❌ ${error instanceof Error ? error.message : "Erro de conexão."}`);
      }
    } else {
      setMessage("🤖 Gerando legenda e imagem com IA...\nIsso pode levar até 1 minuto.");
      try {
        const { data: aiData, error: aiError } = await supabase.functions.invoke("generate-ad-content", {
          body: { descricaoImovel: descricao, images: imageDataUrls },
        });
        if (aiError) throw new Error(aiError.message || "Erro ao gerar conteúdo");
        if (!aiData?.sucesso) throw new Error(aiData?.error || "Erro ao gerar conteúdo");

        setGenerateLogs(aiData.logs || []);
        setGeneratedCaption(aiData.legenda);
        setEditableCaption(aiData.legenda || "");
        setPublicUrl(aiData.publicUrl);
        if (aiData.imagemBase64) {
          setGeneratedImage(aiData.imagemBase64);
          if (user?.id) setImageUsage(incrementImageUsage(user.id, 1));
        }

        setStatus("success");
        setMessage((aiData.logs || []).join("\n"));
        setStep("preview");
      } catch (error) {
        setStatus("error");
        setMessage(`❌ ${error instanceof Error ? error.message : "Erro de conexão."}`);
      }
    }
  };

  const handlePublish = async () => {
    setStep("publishing");
    setStatus("loading");
    setMessage("📤 Publicando no Instagram e criando anúncio...");

    try {
      const body: Record<string, unknown> = {
        legenda: editableCaption,
        orcamentoAnuncio: orcamento,
        publicoAlvo: currentAudience,
        isCustomAudience: useCustomAudience,
        userId: user?.id,
      };

      if (postType === "carousel") {
        body.imageUrls = carouselPublicUrls;
        body.isCarousel = true;
      } else {
        body.imageUrl = publicUrl;
      }

      const { data: metaData, error: metaError } = await supabase.functions.invoke("post-to-instagram", { body });

      const logs = [...generateLogs];
      if (metaError) {
        logs.push(`⚠️ Erro na publicação: ${metaError.message}`);
      } else if (metaData?.sucesso) {
        logs.push(...(metaData.logs || []));
      } else {
        logs.push(`⚠️ ${metaData?.error || "Erro na publicação Meta"}`);
      }

      setStatus("success");
      setMessage(logs.join("\n"));
    } catch (error) {
      setStatus("error");
      setMessage(`❌ ${error instanceof Error ? error.message : "Erro de conexão."}`);
    }
  };

  const handleBack = () => {
    setStep("form");
    setStatus("idle");
    setMessage("");
  };
  const handleReset = () => {
    setStep("form");
    setStatus("idle");
    setMessage("");
    setDescricao("");
    setOrcamento("");
    setGeneratedImage(null);
    setGeneratedCaption(null);
    setEditableCaption("");
    setPublicUrl(null);
    setGenerateLogs([]);
    setCarouselImages([]);
    setRawCarouselImages([]);
    setCarouselPublicUrls([]);
    setCarouselSlideTitles([]);
    setOverlayApplied(false);
    setUploadedFiles([]);
  };

  const handleApplyOverlay = async () => {
    if (rawCarouselImages.length === 0) return;
    setApplyingOverlay(true);
    setMessage("🖌️ Aplicando textos nos slides...");
    setStatus("loading");

    const overlayedImages: string[] = [];
    for (let i = 0; i < rawCarouselImages.length; i++) {
      try {
        const overlayed = await applyTextOverlay(
          rawCarouselImages[i],
          carouselSlideTitles[i] || `Slide ${i + 1}`,
          i === 0,
        );
        overlayedImages.push(overlayed);
      } catch {
        overlayedImages.push(rawCarouselImages[i]);
      }
    }

    setCarouselImages(overlayedImages);
    setOverlayApplied(true);
    setApplyingOverlay(false);
    setStatus("success");
    setMessage("✅ Textos aplicados com sucesso!");
  };

  const openImageEditor = (index: number | null) => {
    setEditorImageIndex(index);
    setEditorOpen(true);
  };

  const handleEditorSave = (dataUrl: string) => {
    if (editorImageIndex === null) {
      setGeneratedImage(dataUrl);
    } else {
      setCarouselImages((prev) => prev.map((img, i) => (i === editorImageIndex ? dataUrl : img)));
    }
    setEditorOpen(false);
  };

  const handleTemplateGenerate = (dataUrl: string) => {
    setGeneratedImage(dataUrl);
    setTemplateOpen(false);
    setStep("preview");
    setPostType("single");
    setStatus("success");
    setMessage("✅ Template gerado com sucesso!");
  };

  const handleVideoOverlay = async () => {
    const videoFile = uploadedFiles.find((f) => f.type === "video");
    if (!videoFile || !videoOverlayText.trim()) return;
    setVideoOverlayLoading(true);
    setStatus("loading");
    setMessage("🎬 Processando vídeo com FFmpeg...");

    try {
      const { data, error } = await supabase.functions.invoke("process-video", {
        body: {
          videoBase64: videoFile.dataUrl,
          overlayText: videoOverlayText,
          position: videoOverlayPosition,
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.sucesso) throw new Error(data?.error || "Erro ao processar vídeo");

      setStatus("success");
      setMessage(`✅ Vídeo processado! URL: ${data.publicUrl}`);
      setVideoDialogOpen(false);
    } catch (err) {
      setStatus("error");
      setMessage(`❌ ${err instanceof Error ? err.message : "Erro ao processar vídeo"}`);
    } finally {
      setVideoOverlayLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(210,100%,12%)]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(43,72%,53%)]" />
      </div>
    );
  }

  const fileTypeIcon = (type: string) => {
    if (type === "video") return <Film className="h-4 w-4" />;
    if (type === "pdf") return <FileText className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[hsl(210,100%,12%)]">
      <div className="w-full max-w-lg rounded-2xl border-2 border-[hsl(43,72%,53%)] bg-[hsl(210,100%,18%)] p-8 shadow-2xl shadow-[hsl(43,72%,53%)/0.1]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-[hsl(43,72%,53%)]" />
            <h1
              className="text-2xl font-bold text-[hsl(43,72%,53%)]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              IA Social Ad Manager
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block mr-1">
              <p className="text-[10px] text-[hsl(43,72%,53%)/0.7] uppercase leading-none">Créditos/mês</p>
              <p className={`text-sm font-bold leading-tight ${limitReached ? "text-destructive" : "text-[hsl(43,72%,53%)]"}`}>
                {remainingImages}/{MONTHLY_IMAGE_LIMIT} img
              </p>
            </div>
            <button
              onClick={() => navigate("/marketing/settings")}
              className="p-2 rounded-lg text-[hsl(0,0%,67%)] hover:text-white hover:bg-[hsl(210,50%,30%)/0.3] transition-colors"
              title="Configurações"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/marketing/auth");
              }}
              className="p-2 rounded-lg text-[hsl(0,0%,67%)] hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Meta not connected warning */}
        {!metaConnected && (
          <div className="mb-6 rounded-lg border border-[hsl(43,72%,53%)/0.5] bg-[hsl(43,72%,53%)/0.1] p-4 text-sm">
            <p className="text-white font-medium mb-2">⚠️ Instagram/Meta Ads não conectado</p>
            <p className="text-[hsl(0,0%,67%)] text-xs mb-3">
              Você pode gerar conteúdo com IA, mas precisa conectar sua conta Meta para publicar.
            </p>
            <button
              onClick={() => navigate("/marketing/settings")}
              className="rounded-lg bg-[hsl(43,72%,53%)] px-4 py-2 text-xs font-bold text-[hsl(210,100%,12%)] hover:brightness-110 transition-all"
            >
              Conectar Agora
            </button>
          </div>
        )}

        {/* Step 1: Form */}
        {step === "form" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[hsl(0,0%,67%)] mb-2">Tipo de Postagem</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPostType("single")}
                  className={`flex-1 rounded-lg p-3 text-sm font-medium border transition-all flex items-center justify-center gap-2 ${postType === "single" ? "border-[hsl(43,72%,53%)] bg-[hsl(43,72%,53%)/0.1] text-[hsl(43,72%,53%)]" : "border-[hsl(210,50%,30%)] text-[hsl(0,0%,67%)] hover:bg-[hsl(210,50%,30%)/0.3]"}`}
                >
                  <Image className="h-4 w-4" /> Imagem Única
                </button>
                <button
                  type="button"
                  onClick={() => setPostType("carousel")}
                  className={`flex-1 rounded-lg p-3 text-sm font-medium border transition-all flex items-center justify-center gap-2 ${postType === "carousel" ? "border-[hsl(43,72%,53%)] bg-[hsl(43,72%,53%)/0.1] text-[hsl(43,72%,53%)]" : "border-[hsl(210,50%,30%)] text-[hsl(0,0%,67%)] hover:bg-[hsl(210,50%,30%)/0.3]"}`}
                >
                  <LayoutGrid className="h-4 w-4" /> Carrossel ({carouselSlides} slides)
                </button>
              </div>
            </div>

            {postType === "carousel" && (
              <div>
                <label className="block text-sm font-medium text-[hsl(0,0%,67%)] mb-2">Número de Slides</label>
                <input
                  type="range"
                  min={3}
                  max={12}
                  value={carouselSlides}
                  onChange={(e) => setCarouselSlides(Number(e.target.value))}
                  className="w-full accent-[hsl(43,72%,53%)]"
                />
                <div className="flex justify-between text-xs text-[hsl(0,0%,67%)] mt-1">
                  <span>3</span>
                  <span className="font-bold text-[hsl(43,72%,53%)]">{carouselSlides} slides</span>
                  <span>12</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[hsl(0,0%,67%)] mb-2">
                Descrição da Postagem (Para IA)
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Casa duplex moderna, 4 suítes, piscina na Barra da Tijuca..."
                className="w-full rounded-lg border border-[hsl(210,50%,30%)] bg-[hsl(210,30%,25%)] p-3 text-white placeholder:text-[hsl(0,0%,67%)/0.5] focus:outline-none focus:ring-2 focus:ring-[hsl(43,72%,53%)] resize-none h-28"
                maxLength={1000}
              />
              <p className="text-xs text-[hsl(0,0%,67%)] mt-1 text-right">{descricao.length}/1000</p>

              {profileSuggestion && !descricao && (
                <button
                  type="button"
                  onClick={() => setDescricao(profileSuggestion)}
                  className="mt-2 w-full rounded-lg border border-[hsl(43,72%,53%)/0.3] bg-[hsl(43,72%,53%)/0.05] p-2.5 text-xs text-[hsl(43,72%,53%)] hover:bg-[hsl(43,72%,53%)/0.1] transition-all flex items-center gap-2 text-left"
                >
                  <User className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>Sugestão do perfil:</strong> {profileSuggestion}
                  </span>
                </button>
              )}

              {/* File upload area */}
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,application/pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-[hsl(210,50%,30%)] hover:border-[hsl(43,72%,53%)/0.5] p-3 text-sm text-[hsl(0,0%,67%)] hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Enviar referências (imagens, vídeos ou PDFs)
                </button>
                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {uploadedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-lg overflow-hidden border border-[hsl(210,50%,30%)] bg-[hsl(210,50%,30%)/0.2] flex items-center justify-center"
                      >
                        {file.type === "image" ? (
                          <img src={file.dataUrl} alt={`Ref ${i + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 p-1 text-center">
                            {fileTypeIcon(file.type)}
                            <span className="text-[10px] text-[hsl(0,0%,67%)] truncate w-full px-1">{file.name}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeUploadedFile(i)}
                          className="absolute top-1 right-1 bg-[hsl(210,100%,12%)/0.8] rounded-full p-0.5 hover:bg-destructive hover:text-white transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {uploadedFiles.length > 0 && (
                  <p className="text-xs text-[hsl(0,0%,67%)] mt-1">
                    {uploadedFiles.filter((f) => f.type === "image").length} imagem(ns),{" "}
                    {uploadedFiles.filter((f) => f.type === "video").length} vídeo(s),{" "}
                    {uploadedFiles.filter((f) => f.type === "pdf").length} PDF(s)
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(0,0%,67%)] mb-2">
                Orçamento Diário de Anúncio (R$)
              </label>
              <input
                type="number"
                value={orcamento}
                onChange={(e) => setOrcamento(e.target.value)}
                placeholder="Ex: 50"
                min={10}
                className="w-full rounded-lg border border-[hsl(210,50%,30%)] bg-[hsl(210,30%,25%)] p-3 text-white placeholder:text-[hsl(0,0%,67%)/0.5] focus:outline-none focus:ring-2 focus:ring-[hsl(43,72%,53%)]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[hsl(0,0%,67%)]">Público-Alvo</label>
                <button
                  type="button"
                  onClick={() => setUseCustomAudience(!useCustomAudience)}
                  className="text-xs text-[hsl(43,72%,53%)] hover:underline"
                >
                  {useCustomAudience ? "← Usar predefinido" : "Digitar personalizado →"}
                </button>
              </div>
              {useCustomAudience ? (
                <input
                  type="text"
                  value={publicoCustom}
                  onChange={(e) => setPublicoCustom(e.target.value)}
                  placeholder="Ex: Jovens casais de 25-35 anos, classe A..."
                  className="w-full rounded-lg border border-[hsl(210,50%,30%)] bg-[hsl(210,30%,25%)] p-3 text-white placeholder:text-[hsl(0,0%,67%)/0.5] focus:outline-none focus:ring-2 focus:ring-[hsl(43,72%,53%)]"
                />
              ) : (
                <select
                  value={publicoPreset}
                  onChange={(e) => setPublicoPreset(e.target.value)}
                  className="w-full rounded-lg border border-[hsl(210,50%,30%)] bg-[hsl(210,30%,25%)] p-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(43,72%,53%)]"
                >
                  {audiencePresets.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Template & Video buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTemplateOpen(true)}
                className="flex-1 rounded-lg border border-[hsl(43,72%,53%)/0.4] p-3 text-sm font-medium text-[hsl(43,72%,53%)] hover:bg-[hsl(43,72%,53%)/0.1] transition-all flex items-center justify-center gap-2"
              >
                <LayoutTemplate className="h-4 w-4" /> Templates
              </button>
              {uploadedFiles.some((f) => f.type === "video") && (
                <button
                  type="button"
                  onClick={() => setVideoDialogOpen(true)}
                  className="flex-1 rounded-lg border border-[hsl(43,72%,53%)/0.4] p-3 text-sm font-medium text-[hsl(43,72%,53%)] hover:bg-[hsl(43,72%,53%)/0.1] transition-all flex items-center justify-center gap-2"
                >
                  <Film className="h-4 w-4" /> Overlay Vídeo
                </button>
              )}
            </div>

            {limitReached && (
              <div className="rounded-lg border border-[hsl(43,72%,53%)/0.5] bg-[hsl(43,72%,53%)/0.1] p-3 text-center">
                <p className="text-xs font-semibold" style={{ color: "#B8860B" }}>
                  Você atingiu o limite de {MONTHLY_IMAGE_LIMIT} imagens mensais. Entre em contato para suporte completo.
                </p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={status === "loading" || limitReached}
              className="w-full rounded-lg bg-[hsl(43,72%,53%)] p-4 text-lg font-bold text-[hsl(210,100%,12%)] transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : postType === "carousel" ? (
                <LayoutGrid className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              {postType === "carousel" ? "Gerar Carrossel com IA" : "Gerar Preview com IA"}
            </button>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && (
          <div className="space-y-5">
            {postType === "single" && generatedImage && (
              <div className="rounded-lg border border-[hsl(43,72%,53%)/0.3] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-[hsl(43,72%,53%)/0.1]">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-[hsl(43,72%,53%)]" />
                    <span className="text-xs font-medium text-[hsl(43,72%,53%)]">Imagem Gerada pela IA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openImageEditor(null)}
                      className="flex items-center gap-1 text-xs text-[hsl(43,72%,53%)] hover:underline font-medium"
                    >
                      <Layers className="h-3.5 w-3.5" /> Canvas
                    </button>
                    <button
                      onClick={() => openEditDialog(null)}
                      className="flex items-center gap-1 text-xs text-[hsl(43,72%,53%)] hover:underline font-medium"
                    >
                      <Wand2 className="h-3.5 w-3.5" /> IA
                    </button>
                    <button
                      onClick={() => downloadImage(generatedImage, `imagem_ia_${Date.now()}.png`)}
                      className="flex items-center gap-1 text-xs text-[hsl(43,72%,53%)] hover:underline font-medium"
                    >
                      <Download className="h-3.5 w-3.5" /> Baixar
                    </button>
                  </div>
                </div>
                <img
                  src={generatedImage}
                  alt="Imagem gerada pela IA"
                  className="w-full cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openImageEditor(null)}
                  title="Clique para editar a imagem"
                />
              </div>
            )}
            {postType === "carousel" && carouselImages.length > 0 && (
              <div className="rounded-lg border border-[hsl(43,72%,53%)/0.3] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-[hsl(43,72%,53%)/0.1]">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-[hsl(43,72%,53%)]" />
                    <span className="text-xs font-medium text-[hsl(43,72%,53%)]">
                      Carrossel ({carouselImages.length} slides)
                      {!overlayApplied && " — Revise os títulos abaixo"}
                    </span>
                  </div>
                  {overlayApplied && (
                    <button
                      onClick={() =>
                        carouselImages.forEach((img, i) => downloadImage(img, `slide_${i + 1}_${Date.now()}.png`))
                      }
                      className="flex items-center gap-1 text-xs text-[hsl(43,72%,53%)] hover:underline font-medium"
                    >
                      <Download className="h-3.5 w-3.5" /> Baixar Todos
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1 p-1">
                  {carouselImages.map((img, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded group">
                      <img src={img} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 bg-[hsl(210,100%,12%)/0.8] text-white text-xs font-bold px-1.5 py-0.5 rounded">
                        {i + 1}
                      </span>
                      <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openImageEditor(i)}
                          className="bg-[hsl(210,100%,12%)/0.8] rounded-full p-1 hover:bg-[hsl(43,72%,53%)] hover:text-[hsl(210,100%,12%)]"
                          title="Editar no Canvas"
                        >
                          <Layers className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => openEditDialog(i)}
                          className="bg-[hsl(210,100%,12%)/0.8] rounded-full p-1 hover:bg-[hsl(43,72%,53%)] hover:text-[hsl(210,100%,12%)]"
                          title="Editar com IA"
                        >
                          <Wand2 className="h-3 w-3" />
                        </button>
                        {overlayApplied && (
                          <button
                            onClick={() => downloadImage(img, `slide_${i + 1}_${Date.now()}.png`)}
                            className="bg-[hsl(210,100%,12%)/0.8] rounded-full p-1 hover:bg-[hsl(43,72%,53%)] hover:text-[hsl(210,100%,12%)]"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Editable slide titles - review step */}
            {postType === "carousel" && carouselImages.length > 0 && !overlayApplied && (
              <div className="rounded-lg border-2 border-[#FFD700]/50 p-4 bg-[hsl(210,100%,18%)]/50 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Pencil className="h-4 w-4 text-[#FFD700]" />
                  <span className="text-sm font-semibold text-white">✏️ Revise os títulos dos slides</span>
                </div>
                <p className="text-xs text-[hsl(0,0%,67%)]">
                  Edite os textos abaixo antes de aplicar nas imagens. O Slide 1 é a capa.
                </p>
                <div className="space-y-2">
                  {carouselSlideTitles.map((title, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[hsl(43,72%,53%)] w-16 shrink-0">
                        {i === 0 ? "Capa" : `Slide ${i + 1}`}
                      </span>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => {
                          const updated = [...carouselSlideTitles];
                          updated[i] = e.target.value;
                          setCarouselSlideTitles(updated);
                        }}
                        className="flex-1 rounded-lg border border-[hsl(210,50%,30%)] bg-[hsl(210,30%,25%)] px-3 py-2 text-sm text-white placeholder:text-[hsl(0,0%,67%)/0.5] focus:outline-none focus:ring-2 focus:ring-[hsl(43,72%,53%)]"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleApplyOverlay}
                  disabled={applyingOverlay}
                  className="w-full rounded-lg bg-[#FFD700] p-3 text-sm font-bold text-black transition-all hover:brightness-110 disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
                >
                  {applyingOverlay ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {applyingOverlay ? "Aplicando textos..." : "Aplicar Textos e Finalizar"}
                </button>
              </div>
            )}

            {/* Caption + action buttons */}
            {(postType === "single" || overlayApplied) && (
              <>
                <div className="rounded-lg border border-[hsl(43,72%,53%)/0.3] p-4 bg-[hsl(43,72%,53%)/0.05]">
                  <div className="flex items-center gap-2 mb-2">
                    <Pencil className="h-4 w-4 text-[hsl(43,72%,53%)]" />
                    <span className="text-xs font-medium text-[hsl(43,72%,53%)]">
                      📝 Edite a Legenda antes de publicar
                    </span>
                  </div>
                  <textarea
                    value={editableCaption}
                    onChange={(e) => setEditableCaption(e.target.value)}
                    className="w-full rounded-lg border border-[hsl(210,50%,30%)] bg-[hsl(210,30%,25%)] p-3 text-sm text-white placeholder:text-[hsl(0,0%,67%)/0.5] focus:outline-none focus:ring-2 focus:ring-[hsl(43,72%,53%)] resize-none h-40"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleBack}
                    className="flex-1 rounded-lg border border-[hsl(210,50%,30%)] p-3 text-sm font-medium text-[hsl(0,0%,67%)] transition-all hover:bg-[hsl(210,50%,30%)/0.5]"
                  >
                    ← Voltar
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={!metaConnected}
                    className="flex-1 rounded-lg bg-[hsl(43,72%,53%)] p-3 text-sm font-bold text-[hsl(210,100%,12%)] transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                    title={!metaConnected ? "Conecte sua conta Meta nas Configurações" : ""}
                  >
                    <Send className="h-4 w-4" /> Publicar no Instagram
                  </button>
                </div>
                {!metaConnected && (
                  <p className="text-xs text-center text-[hsl(0,0%,67%)]">
                    ⚠️{" "}
                    <button
                      onClick={() => navigate("/marketing/settings")}
                      className="text-[hsl(43,72%,53%)] hover:underline"
                    >
                      Conecte sua conta Meta
                    </button>{" "}
                    para publicar.
                  </p>
                )}
              </>
            )}

            {/* Back button when carousel overlay not yet applied */}
            {postType === "carousel" && !overlayApplied && (
              <button
                onClick={handleBack}
                className="w-full rounded-lg border border-[hsl(210,50%,30%)] p-3 text-sm font-medium text-[hsl(0,0%,67%)] transition-all hover:bg-[hsl(210,50%,30%)/0.5]"
              >
                ← Voltar
              </button>
            )}
          </div>
        )}

        {/* Step 3: Done */}
        {step === "publishing" && status === "success" && (
          <div className="space-y-5">
            <button
              onClick={handleReset}
              className="w-full rounded-lg border border-[hsl(210,50%,30%)] p-3 text-sm font-medium text-[hsl(0,0%,67%)] transition-all hover:bg-[hsl(210,50%,30%)/0.5]"
            >
              ✨ Criar Nova Postagem
            </button>
          </div>
        )}

        {/* Status */}
        {status !== "idle" && (
          <div
            className={`mt-5 rounded-lg p-4 whitespace-pre-wrap text-sm font-medium ${status === "loading" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : status === "success" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-destructive/20 text-destructive border border-destructive/30"}`}
          >
            <div className="flex items-start gap-2">
              {status === "loading" && <Loader2 className="h-4 w-4 animate-spin mt-0.5 shrink-0" />}
              {status === "success" && <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />}
              {status === "error" && <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* Edit Image Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-[hsl(43,72%,53%)]" />
                Editar Imagem com IA
              </DialogTitle>
              <DialogDescription>Descreva o que deseja corrigir ou alterar na imagem.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {(editingImageIndex === null ? generatedImage : carouselImages[editingImageIndex ?? 0]) && (
                <div className="rounded-lg overflow-hidden border border-[hsl(210,50%,30%)] max-h-48">
                  <img
                    src={(editingImageIndex === null ? generatedImage : carouselImages[editingImageIndex ?? 0]) || ""}
                    alt="Imagem a editar"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <textarea
                value={editInstruction}
                onChange={(e) => setEditInstruction(e.target.value)}
                placeholder="Ex: Remover o texto da imagem, Corrigir a palavra 'luxo', Adicionar céu azul..."
                className="w-full rounded-lg border border-[hsl(210,50%,30%)] bg-[hsl(210,30%,25%)] p-3 text-sm text-white placeholder:text-[hsl(0,0%,67%)/0.5] focus:outline-none focus:ring-2 focus:ring-[hsl(43,72%,53%)] resize-none h-24"
                maxLength={500}
              />
              <p className="text-xs text-[hsl(0,0%,67%)]">{editInstruction.length}/500 caracteres</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditDialogOpen(false)}
                  className="flex-1 rounded-lg border border-[hsl(210,50%,30%)] p-2.5 text-sm font-medium text-[hsl(0,0%,67%)] hover:bg-[hsl(210,50%,30%)/0.5] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditImage}
                  disabled={editLoading || !editInstruction.trim()}
                  className="flex-1 rounded-lg bg-[hsl(43,72%,53%)] p-2.5 text-sm font-bold text-[hsl(210,100%,12%)] hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {editLoading ? "Editando..." : "Aplicar Edição"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Video Overlay Dialog */}
        <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Film className="h-5 w-5 text-[hsl(43,72%,53%)]" />
                Overlay de Texto no Vídeo
              </DialogTitle>
              <DialogDescription>Adicione texto sobre o vídeo enviado usando FFmpeg.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[hsl(0,0%,67%)] mb-1 block">Texto</label>
                <input
                  type="text"
                  value={videoOverlayText}
                  onChange={(e) => setVideoOverlayText(e.target.value)}
                  placeholder="Ex: Residencial Aurora — A partir de R$ 850.000"
                  maxLength={200}
                  className="w-full rounded-lg border border-[hsl(210,50%,30%)] bg-[hsl(210,30%,25%)] p-3 text-sm text-white placeholder:text-[hsl(0,0%,67%)/0.5] focus:outline-none focus:ring-2 focus:ring-[hsl(43,72%,53%)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[hsl(0,0%,67%)] mb-1 block">Posição</label>
                <div className="flex gap-2">
                  {(["top", "center", "bottom"] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setVideoOverlayPosition(pos)}
                      className={`flex-1 rounded-lg p-2 text-xs font-medium border transition-all ${videoOverlayPosition === pos ? "border-[hsl(43,72%,53%)] bg-[hsl(43,72%,53%)/0.1] text-[hsl(43,72%,53%)]" : "border-[hsl(210,50%,30%)] text-[hsl(0,0%,67%)] hover:bg-[hsl(210,50%,30%)/0.3]"}`}
                    >
                      {pos === "top" ? "Topo" : pos === "center" ? "Centro" : "Inferior"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setVideoDialogOpen(false)}
                  className="flex-1 rounded-lg border border-[hsl(210,50%,30%)] p-2.5 text-sm font-medium text-[hsl(0,0%,67%)] hover:bg-[hsl(210,50%,30%)/0.5] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleVideoOverlay}
                  disabled={videoOverlayLoading || !videoOverlayText.trim()}
                  className="flex-1 rounded-lg bg-[hsl(43,72%,53%)] p-2.5 text-sm font-bold text-[hsl(210,100%,12%)] hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {videoOverlayLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
                  {videoOverlayLoading ? "Processando..." : "Processar Vídeo"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Fullscreen overlays */}
      {editorOpen && (
        <ImageEditor
          imageSrc={(editorImageIndex === null ? generatedImage : carouselImages[editorImageIndex ?? 0]) || ""}
          onSave={handleEditorSave}
          onClose={() => setEditorOpen(false)}
        />
      )}
      {templateOpen && <TemplateSelector onGenerate={handleTemplateGenerate} onClose={() => setTemplateOpen(false)} />}
    </div>
  );
};

export default AdManagerForm;
