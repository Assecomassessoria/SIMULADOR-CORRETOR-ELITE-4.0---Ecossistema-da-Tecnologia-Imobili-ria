import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Download, Link2, Copy, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type Unit = "minutos" | "horas" | "dias";

export default function RelatorioAuditoriaPage() {
  const [amount, setAmount] = useState<number>(7);
  const [unit, setUnit] = useState<Unit>("dias");
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toSeconds = () => {
    const n = Math.max(1, Math.floor(amount || 0));
    if (unit === "minutos") return n * 60;
    if (unit === "horas") return n * 3600;
    return n * 86400;
  };

  const handleGenerate = async (forDownload: boolean) => {
    try {
      setLoading(true);
      setCopied(false);
      const expiresIn = forDownload ? 300 : toSeconds(); // download: link curto
      const { data, error } = await supabase.functions.invoke(
        "audit-report-link",
        { body: { expiresIn } },
      );
      if (error) throw error;
      const url = (data as any)?.url as string;
      const exp = (data as any)?.expiresAt as string;
      if (!url) throw new Error("Resposta inválida");

      if (forDownload) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        setLink(url);
        setExpiresAt(exp);
        toast.success("Link compartilhável gerado");
      }
    } catch (e: any) {
      toast.error("Falha ao gerar link", { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Relatório de Auditoria, Conformidade e Segurança
            </h1>
            <p className="text-sm text-muted-foreground">
              Simulador Corretor Elite 4.0 — emitido em PDF assinado.
            </p>
          </div>
        </div>

        <Card className="p-6 space-y-6 border-primary/20">
          <section>
            <h2 className="font-semibold text-base mb-2">1. Download direto</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Baixe o PDF imediatamente. O link é válido por apenas 5 minutos,
              tempo suficiente para o download.
            </p>
            <Button
              onClick={() => handleGenerate(true)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </section>

          <div className="border-t" />

          <section>
            <h2 className="font-semibold text-base mb-2">
              2. Link compartilhável com validade
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Defina por quanto tempo o link permanecerá ativo. Após o prazo,
              ele expira automaticamente e o destinatário perde o acesso.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <Label htmlFor="amount">Validade</Label>
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="unit">Unidade</Label>
                <select
                  id="unit"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as Unit)}
                >
                  <option value="minutos">Minutos</option>
                  <option value="horas">Horas</option>
                  <option value="dias">Dias</option>
                </select>
              </div>
            </div>
            <Button
              onClick={() => handleGenerate(false)}
              disabled={loading}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Gerar link compartilhável
            </Button>

            {link && (
              <div className="mt-4 p-3 rounded-md bg-muted/50 border">
                <div className="text-xs text-muted-foreground mb-1">
                  Expira em:{" "}
                  <strong>
                    {expiresAt
                      ? new Date(expiresAt).toLocaleString("pt-BR")
                      : "—"}
                  </strong>
                </div>
                <div className="flex gap-2">
                  <Input value={link} readOnly className="font-mono text-xs" />
                  <Button onClick={copy} size="icon" variant="outline">
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </section>
        </Card>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Validade mínima 1 minuto · máxima 365 dias.
        </p>
      </div>
    </div>
  );
}
