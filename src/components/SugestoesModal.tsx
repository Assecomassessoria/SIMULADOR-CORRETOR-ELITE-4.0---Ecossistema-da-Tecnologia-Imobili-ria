import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SugestoesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SugestoesModal = ({ isOpen, onClose }: SugestoesModalProps) => {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setNome(""); setWhatsapp(""); setEmail(""); setMensagem(""); setArquivo(null);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast({ title: "Apenas PDF", description: "Anexe um arquivo .pdf", variant: "destructive" });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo grande", description: "Máximo 10MB", variant: "destructive" });
      return;
    }
    setArquivo(f);
  };

  const handleSubmit = async () => {
    if (!nome.trim() || !email.trim() || !mensagem.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha nome, email e sugestão.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      let anexo_path: string | null = null;
      if (arquivo) {
        const path = `public/${Date.now()}-${arquivo.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("sugestoes-anexos")
          .upload(path, arquivo, { contentType: "application/pdf" });
        if (upErr) throw upErr;
        anexo_path = path;
      }
      const { error } = await supabase.from("sugestoes").insert({
        nome: nome.trim(),
        whatsapp: whatsapp.trim() || null,
        email: email.trim(),
        mensagem: mensagem.trim(),
        anexo_path,
      });
      if (error) throw error;
      toast({ title: "Sugestão enviada!", description: "Obrigado por contribuir com o Simulador Elite." });
      reset();
      onClose();
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gold">💡 Canal de Sugestões</DialogTitle>
          <DialogDescription>Queremos ouvir você. Sua opinião melhora o simulador.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>WhatsApp</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" maxLength={20} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} />
            </div>
          </div>
          <div>
            <Label>Queremos ouvir você — digite sua sugestão *</Label>
            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              maxLength={3000}
              placeholder="Descreva sua ideia, crítica ou melhoria..."
              className="min-h-[140px] resize-y"
              style={{ resize: "vertical" }}
            />
            <p className="text-[10px] text-muted-foreground mt-1">{mensagem.length}/3000 • Arraste o canto inferior para aumentar</p>
          </div>
          <div>
            <Label>Anexar PDF (opcional)</Label>
            <div className="flex items-center gap-2 mt-1">
              <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFile} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Paperclip className="w-4 h-4 mr-1" /> Escolher PDF
              </Button>
              {arquivo && (
                <span className="text-xs flex items-center gap-1 bg-muted px-2 py-1 rounded">
                  📎 {arquivo.name}
                  <button onClick={() => setArquivo(null)} className="text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-gold hover:bg-gold/90 text-primary">
              <Send className="w-4 h-4 mr-1" />
              {loading ? "Enviando..." : "Enviar Sugestão"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SugestoesModal;
