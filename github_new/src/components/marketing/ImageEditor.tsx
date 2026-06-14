import { useState, useEffect, useRef, useCallback } from "react";
import { Canvas, FabricImage, IText, Rect, Circle, Line, Shadow } from "fabric";
import {
  Type,
  Square,
  CircleIcon,
  Minus,
  Trash2,
  Download,
  RotateCcw,
  Palette,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  X,
  Layers,
  Move,
} from "lucide-react";

interface ImageEditorProps {
  imageSrc: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

const COLORS = [
  "#FFFFFF", "#000000", "#FFD700", "#FF4444", "#44FF44",
  "#4488FF", "#FF44FF", "#FF8800", "#00CCCC", "#8844FF",
];

const ImageEditor = ({ imageSrc, onSave, onClose }: ImageEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [activeColor, setActiveColor] = useState("#FFD700");
  const [fontSize, setFontSize] = useState(48);
  const [activeTool, setActiveTool] = useState<"select" | "text" | "rect" | "circle" | "line">("select");

  const initCanvas = useCallback(async () => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 1080,
      height: 1080,
      backgroundColor: "#000000",
    });
    fabricRef.current = canvas;

    try {
      const img = await FabricImage.fromURL(imageSrc, { crossOrigin: "anonymous" });
      const scale = Math.max(1080 / img.width!, 1080 / img.height!);
      img.set({
        scaleX: scale,
        scaleY: scale,
        left: (1080 - img.width! * scale) / 2,
        top: (1080 - img.height! * scale) / 2,
        selectable: false,
        evented: false,
      });
      canvas.add(img);
      canvas.sendObjectToBack(img);
      canvas.renderAll();
    } catch (err) {
      console.error("Failed to load image into canvas:", err);
    }
  }, [imageSrc]);

  useEffect(() => {
    initCanvas();
    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, [initCanvas]);

  const addText = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new IText("Texto aqui", {
      left: 100,
      top: 100,
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      fontSize,
      fill: activeColor,
      fontWeight: "600",
      shadow: new Shadow({ color: "rgba(0,0,0,0.6)", blur: 8, offsetX: 0, offsetY: 2 }),
      editable: true,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setActiveTool("select");
  };

  const addRect = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const rect = new Rect({
      left: 200,
      top: 200,
      width: 200,
      height: 120,
      fill: "transparent",
      stroke: activeColor,
      strokeWidth: 3,
      rx: 8,
      ry: 8,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    setActiveTool("select");
  };

  const addCircle = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const circle = new Circle({
      left: 400,
      top: 400,
      radius: 60,
      fill: "transparent",
      stroke: activeColor,
      strokeWidth: 3,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
    setActiveTool("select");
  };

  const addLine = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const line = new Line([100, 540, 980, 540], {
      stroke: activeColor,
      strokeWidth: 3,
    });
    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.renderAll();
    setActiveTool("select");
  };

  const deleteSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active && active.selectable) {
      canvas.remove(active);
      canvas.renderAll();
    }
  };

  const applyColorToSelected = (color: string) => {
    setActiveColor(color);
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    if (obj instanceof IText) {
      obj.set("fill", color);
    } else {
      obj.set("stroke", color);
    }
    canvas.renderAll();
  };

  const toggleBold = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj instanceof IText) {
      obj.set("fontWeight", obj.fontWeight === "bold" || obj.fontWeight === "600" ? "400" : "bold");
      canvas.renderAll();
    }
  };

  const toggleItalic = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj instanceof IText) {
      obj.set("fontStyle", obj.fontStyle === "italic" ? "normal" : "italic");
      canvas.renderAll();
    }
  };

  const setTextAlign = (align: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj instanceof IText) {
      obj.set("textAlign", align);
      canvas.renderAll();
    }
  };

  const handleSave = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.renderAll();
    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });
    onSave(dataUrl);
  };

  const handleDownload = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.renderAll();
    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `editado_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toolButtons = [
    { id: "select" as const, icon: Move, label: "Mover" },
    { id: "text" as const, icon: Type, label: "Texto", action: addText },
    { id: "rect" as const, icon: Square, label: "Retângulo", action: addRect },
    { id: "circle" as const, icon: CircleIcon, label: "Círculo", action: addCircle },
    { id: "line" as const, icon: Minus, label: "Linha", action: addLine },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[hsl(210,100%,12%)] border-b border-[hsl(43,72%,53%)/0.3]">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-[hsl(43,72%,53%)]" />
          <span className="text-sm font-bold text-white">Editor de Imagem</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg bg-[hsl(210,50%,30%)] px-3 py-2 text-xs font-medium text-white hover:bg-[hsl(210,50%,40%)] transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Baixar PNG
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-[hsl(43,72%,53%)] px-3 py-2 text-xs font-bold text-[hsl(210,100%,12%)] hover:brightness-110 transition-all"
          >
            Salvar e Voltar
          </button>
          <button onClick={onClose} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar */}
        <div className="w-14 bg-[hsl(210,100%,12%)] border-r border-[hsl(43,72%,53%)/0.2] flex flex-col items-center py-3 gap-1">
          {toolButtons.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id);
                tool.action?.();
              }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                activeTool === tool.id
                  ? "bg-[hsl(43,72%,53%)] text-[hsl(210,100%,12%)]"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
              title={tool.label}
            >
              <tool.icon className="h-4 w-4" />
            </button>
          ))}
          <div className="w-8 h-px bg-white/20 my-2" />
          <button
            onClick={deleteSelected}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
            title="Excluir seleção"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-4">
          <div className="shadow-2xl" style={{ maxWidth: "100%", maxHeight: "100%" }}>
            <canvas
              ref={canvasRef}
              style={{
                maxWidth: "100%",
                maxHeight: "calc(100vh - 160px)",
                objectFit: "contain",
              }}
            />
          </div>
        </div>

        {/* Right panel */}
        <div className="w-52 bg-[hsl(210,100%,12%)] border-l border-[hsl(43,72%,53%)/0.2] p-3 space-y-4 overflow-y-auto">
          {/* Colors */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Palette className="h-3.5 w-3.5 text-[hsl(43,72%,53%)]" />
              <span className="text-xs font-medium text-white">Cor</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => applyColorToSelected(c)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${activeColor === c ? "border-white scale-110" : "border-transparent hover:border-white/40"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <label className="text-xs font-medium text-white mb-1.5 block">Tamanho: {fontSize}px</label>
            <input
              type="range"
              min={16}
              max={120}
              value={fontSize}
              onChange={(e) => {
                const size = Number(e.target.value);
                setFontSize(size);
                const canvas = fabricRef.current;
                if (canvas) {
                  const obj = canvas.getActiveObject();
                  if (obj instanceof IText) {
                    obj.set("fontSize", size);
                    canvas.renderAll();
                  }
                }
              }}
              className="w-full accent-[hsl(43,72%,53%)]"
            />
          </div>

          {/* Text formatting */}
          <div>
            <span className="text-xs font-medium text-white mb-1.5 block">Formatação</span>
            <div className="flex gap-1">
              <button onClick={toggleBold} className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button onClick={toggleItalic} className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setTextAlign("left")} className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setTextAlign("center")} className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setTextAlign("right")} className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <AlignRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
