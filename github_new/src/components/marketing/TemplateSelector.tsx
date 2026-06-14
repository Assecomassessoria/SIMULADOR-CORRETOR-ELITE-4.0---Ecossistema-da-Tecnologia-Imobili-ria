import { useState, useRef } from "react";
import { LayoutTemplate, Sparkles, Download, X, RotateCcw } from "lucide-react";
import html2canvas from "html2canvas";

interface TemplateData {
  nomeEmpreendimento: string;
  preco: string;
  metragem: string;
  quartos: string;
  bairro: string;
  cidade: string;
  subtitulo: string;
}

interface TemplateSelectorProps {
  onGenerate: (dataUrl: string) => void;
  onClose: () => void;
}

const defaultData: TemplateData = {
  nomeEmpreendimento: "Residencial Aurora",
  preco: "R$ 850.000",
  metragem: "120m²",
  quartos: "3 Suítes",
  bairro: "Barra da Tijuca",
  cidade: "Rio de Janeiro",
  subtitulo: "Seu novo lar de alto padrão",
};

const templates = [
  { id: "luxury-dark", label: "Luxo Escuro" },
  { id: "luxury-gold", label: "Luxo Dourado" },
  { id: "modern-clean", label: "Moderno Clean" },
  { id: "bold-impact", label: "Impacto Bold" },
];

const TemplateSelector = ({ onGenerate, onClose }: TemplateSelectorProps) => {
  const [data, setData] = useState<TemplateData>(defaultData);
  const [selectedTemplate, setSelectedTemplate] = useState("luxury-dark");
  const [generating, setGenerating] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  const handleClear = () => setData({
    nomeEmpreendimento: "",
    preco: "",
    metragem: "",
    quartos: "",
    bairro: "",
    cidade: "",
    subtitulo: "",
  });

  const update = (key: keyof TemplateData, value: string) => setData((prev) => ({ ...prev, [key]: value }));

  const renderTemplate = () => {
    const commonBadge = "inline-block rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase";

    switch (selectedTemplate) {
      case "luxury-dark":
        return (
          <div className="w-[1080px] h-[1080px] relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a1628 0%, #0d1f3c 40%, #091420 100%)" }}>
            <div className="absolute top-0 left-0 w-full h-1" style={{ background: "linear-gradient(90deg, transparent, #FFD700, transparent)" }} />
            <div className="absolute bottom-0 left-0 w-full h-1" style={{ background: "linear-gradient(90deg, transparent, #FFD700, transparent)" }} />
            <div className="flex flex-col items-center justify-center h-full px-20 text-center gap-0">
              <span className={commonBadge} style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.3)", marginBottom: "24px" }}>
                Exclusivo
              </span>
              <h1 className="text-[64px] font-bold leading-[1.1] max-w-[900px] break-words" style={{ color: "#FFFFFF", fontFamily: "'Playfair Display', serif" }}>
                {data.nomeEmpreendimento}
              </h1>
              <p className="text-[26px] mt-4 max-w-[750px] break-words" style={{ color: "rgba(255,255,255,0.6)", fontStyle: "italic" }}>
                {data.subtitulo}
              </p>
              <div className="w-[120px] h-[3px] mt-8 mb-8 shrink-0" style={{ background: "#FFD700" }} />
              <div className="text-center">
                <p className="text-[20px]" style={{ color: "rgba(255,255,255,0.5)" }}>A partir de</p>
                <p className="text-[52px] font-bold" style={{ color: "#FFD700" }}>{data.preco}</p>
              </div>
              <div className="flex gap-6 mt-8 flex-wrap justify-center">
                {[data.metragem, data.quartos, `${data.bairro}, ${data.cidade}`].filter(Boolean).map((item, i) => (
                  <span key={i} className="rounded-lg px-5 py-3 text-[17px] font-medium" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case "luxury-gold":
        return (
          <div className="w-[1080px] h-[1080px] relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a0a 0%, #2a2510 50%, #1a1a0a 100%)" }}>
            <div className="absolute inset-8 border-2" style={{ borderColor: "rgba(255,215,0,0.3)", borderRadius: "16px" }} />
            <div className="flex flex-col items-center justify-center h-full px-24 text-center gap-0">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-[2px]" style={{ background: "#FFD700" }} />
                <span className="text-[16px] tracking-[8px] uppercase" style={{ color: "#FFD700" }}>Premium</span>
                <div className="w-16 h-[2px]" style={{ background: "#FFD700" }} />
              </div>
              <h1 className="text-[60px] font-bold leading-[1.1] max-w-[850px] break-words" style={{ color: "#FFD700", fontFamily: "'Playfair Display', serif" }}>
                {data.nomeEmpreendimento}
              </h1>
              <p className="text-[24px] mt-5 max-w-[700px] break-words" style={{ color: "rgba(255,215,0,0.6)" }}>
                {data.subtitulo}
              </p>
              <div className="mt-10 mb-10">
                <p className="text-[48px] font-bold" style={{ color: "#FFFFFF" }}>{data.preco}</p>
              </div>
              <div className="flex gap-6 flex-wrap justify-center">
                {[data.metragem, data.quartos, data.bairro].filter(Boolean).map((item, i) => (
                  <div key={i} className="rounded-xl px-8 py-4 text-center" style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.25)" }}>
                    <p className="text-[20px] font-semibold" style={{ color: "#FFD700" }}>{item}</p>
                  </div>
                ))}
              </div>
              <p className="text-[18px] mt-6" style={{ color: "rgba(255,255,255,0.4)" }}>{data.cidade}</p>
            </div>
          </div>
        );

      case "modern-clean":
        return (
          <div className="w-[1080px] h-[1080px] relative overflow-hidden" style={{ background: "#FAFAFA" }}>
            <div className="absolute top-0 left-0 w-2 h-full" style={{ background: "#FFD700" }} />
            <div className="flex flex-col justify-center h-full pl-24 pr-20">
              <span className="text-[14px] tracking-[6px] uppercase font-bold mb-6" style={{ color: "#999" }}>Lançamento</span>
              <h1 className="text-[58px] font-bold leading-[1.1] max-w-[850px] break-words" style={{ color: "#1a1a1a" }}>
                {data.nomeEmpreendimento}
              </h1>
              <p className="text-[22px] mt-4 max-w-[600px] break-words" style={{ color: "#666" }}>
                {data.subtitulo}
              </p>
              <div className="w-[80px] h-[4px] mt-8 mb-8 shrink-0" style={{ background: "#FFD700" }} />
              <p className="text-[52px] font-bold" style={{ color: "#1a1a1a" }}>{data.preco}</p>
              <div className="flex gap-6 mt-8 flex-wrap">
                {[
                  { label: "Área", value: data.metragem },
                  { label: "Quartos", value: data.quartos },
                  { label: "Local", value: `${data.bairro}, ${data.cidade}` },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-[14px] uppercase tracking-wider mb-1" style={{ color: "#999" }}>{item.label}</p>
                    <p className="text-[22px] font-semibold" style={{ color: "#1a1a1a" }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "bold-impact":
        return (
          <div className="w-[1080px] h-[1080px] relative overflow-hidden" style={{ background: "linear-gradient(160deg, #000000 0%, #1a0a2e 50%, #000000 100%)" }}>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #FFD700 0%, transparent 70%)", filter: "blur(100px)" }} />
            <div className="flex flex-col justify-end h-full p-20 pb-24">
              <p className="text-[72px] font-black leading-[0.95] uppercase max-w-[900px] break-words" style={{ color: "#FFFFFF" }}>
                {data.nomeEmpreendimento}
              </p>
              <p className="text-[26px] mt-5 font-light max-w-[750px] break-words" style={{ color: "rgba(255,255,255,0.6)" }}>
                {data.subtitulo}
              </p>
              <div className="flex items-end justify-between mt-10 flex-wrap gap-4">
                <p className="text-[60px] font-black" style={{ color: "#FFD700" }}>{data.preco}</p>
                <div className="flex gap-4 flex-wrap">
                  {[data.metragem, data.quartos].filter(Boolean).map((item, i) => (
                    <span key={i} className="rounded-full px-6 py-3 text-[18px] font-bold" style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.3)" }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[18px] mt-5" style={{ color: "rgba(255,255,255,0.4)" }}>📍 {data.bairro}, {data.cidade}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleGenerate = async () => {
    if (!templateRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(templateRef.current, {
        width: 1080,
        height: 1080,
        scale: 1,
        useCORS: true,
        backgroundColor: null,
      });
      const dataUrl = canvas.toDataURL("image/png");
      onGenerate(dataUrl);
    } catch (err) {
      console.error("Template render error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!templateRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(templateRef.current, {
        width: 1080,
        height: 1080,
        scale: 1,
        useCORS: true,
        backgroundColor: null,
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `template_${selectedTemplate}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[hsl(210,100%,12%)] border-b border-[hsl(43,72%,53%)/0.3]">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5 text-[hsl(43,72%,53%)]" />
          <span className="text-sm font-bold text-white">Templates Prontos</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleClear} className="flex items-center gap-1.5 rounded-lg bg-red-600/80 px-3 py-2 text-xs font-medium text-white hover:bg-red-600 transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Limpar
          </button>
          <button onClick={handleDownload} disabled={generating} className="flex items-center gap-1.5 rounded-lg bg-[hsl(210,50%,30%)] px-3 py-2 text-xs font-medium text-white hover:bg-[hsl(210,50%,40%)] transition-colors disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> Baixar PNG
          </button>
          <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-1.5 rounded-lg bg-[hsl(43,72%,53%)] px-3 py-2 text-xs font-bold text-[hsl(210,100%,12%)] hover:brightness-110 transition-all disabled:opacity-50">
            <Sparkles className="h-3.5 w-3.5" /> Usar no Post
          </button>
          <button onClick={onClose} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: form */}
        <div className="w-72 bg-[hsl(210,100%,12%)] border-r border-[hsl(43,72%,53%)/0.2] p-4 space-y-4 overflow-y-auto">
          {/* Template selector */}
          <div>
            <label className="text-xs font-medium text-white mb-2 block">Layout</label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`rounded-lg p-2.5 text-xs font-medium border transition-all ${
                    selectedTemplate === t.id
                      ? "border-[hsl(43,72%,53%)] bg-[hsl(43,72%,53%)/0.15] text-[hsl(43,72%,53%)]"
                      : "border-white/10 text-white/60 hover:bg-white/5"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          {[
            { key: "nomeEmpreendimento" as const, label: "Nome do Empreendimento" },
            { key: "subtitulo" as const, label: "Subtítulo" },
            { key: "preco" as const, label: "Preço" },
            { key: "metragem" as const, label: "Metragem" },
            { key: "quartos" as const, label: "Quartos / Suítes" },
            { key: "bairro" as const, label: "Bairro" },
            { key: "cidade" as const, label: "Cidade" },
          ].map((field) => (
            <div key={field.key}>
              <label className="text-xs font-medium text-white/70 mb-1 block">{field.label}</label>
              <input
                type="text"
                value={data[field.key]}
                onChange={(e) => update(field.key, e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[hsl(43,72%,53%)]"
              />
            </div>
          ))}
        </div>

        {/* Preview area */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-4">
          <div className="relative" style={{ transform: "scale(0.55)", transformOrigin: "center center" }}>
            <div ref={templateRef}>
              {renderTemplate()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
