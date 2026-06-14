import { useEffect, useState, useRef } from "react";
import { FileSpreadsheet, FileText, Loader2, Trash2, Download, Plus, X, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parseExcel, parsePdf, fileToBase64, renderPdfPagesToImages, type UnidadeParsed } from "@/lib/tabelaParser";

interface Props {
  adminPassword: string;
}

interface Tabela {
  id: string;
  construtora_cnpj: string;
  empreendimento_nome: string;
  cidade: string | null;
  uf: string | null;
  arquivo_tipo: string;
  total_unidades: number;
  uploaded_by_email: string | null;
  updated_at: string;
  download_url: string | null;
}

const formatCNPJ = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");

export default function TabelaVendasManager({ adminPassword }: Props) {
  const [tabelas, setTabelas] = useState<Tabela[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const [empNome, setEmpNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "xlsx">("xlsx");
  const [preview, setPreview] = useState<UnidadeParsed[]>([]);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parseError, setParseError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("list-tabelas-empreendimento", {
        body: { admin_password: adminPassword },
      });
      if (!error && data?.items) setTabelas(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminPassword) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminPassword]);

  const resetForm = () => {
    setEmpNome("");
    setCnpj("");
    setCidade("");
    setUf("");
    setFile(null);
    setPreview([]);
    setParseError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = async (f: File, tipo: "pdf" | "xlsx") => {
    setFile(f);
    setFileType(tipo);
    setParseError("");
    setPreview([]);
    setParsing(true);
    try {
      const rows = tipo === "xlsx" ? await parseExcel(f) : await parsePdf(f);
      if (rows.length) {
        setPreview(rows);
      } else if (tipo === "pdf") {
        // Fallback: PDF sem texto selecionável → OCR via Lovable AI (Gemini Vision)
        setParseError("PDF sem texto detectável. Executando OCR com IA (pode levar 20-60s)...");
        const images = await renderPdfPagesToImages(f, 1.6, 10);
        if (!images.length) {
          setParseError("Não foi possível renderizar páginas do PDF.");
          return;
        }
        const { data, error } = await supabase.functions.invoke("ocr-tabela-empreendimento", {
          body: { admin_password: adminPassword, images },
        });
        if (error || data?.error) {
          setParseError(`OCR falhou: ${data?.error || error?.message}`);
          return;
        }
        if (!data?.unidades?.length) {
          setParseError("OCR concluído, mas nenhuma unidade foi reconhecida. Tente um PDF de maior resolução ou envie em Excel.");
          return;
        }
        setParseError("");
        setPreview(data.unidades);
      } else {
        setParseError("Nenhuma unidade detectada no arquivo.");
      }
    } catch (e: any) {
      setParseError(e?.message || "Falha ao ler arquivo.");
    } finally {
      setParsing(false);
    }
  };

  const handleUpload = async () => {
    if (!empNome.trim() || !cnpj.trim() || !file || !preview.length) {
      alert("Preencha Nome, CNPJ e selecione um arquivo válido.");
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("upload-tabela-empreendimento", {
        body: {
          admin_password: adminPassword,
          construtora_cnpj: cnpj.trim(),
          empreendimento_nome: empNome.trim(),
          cidade: cidade.trim() || null,
          uf: uf.trim() || null,
          arquivo_tipo: fileType,
          arquivo_base64: base64,
          arquivo_filename: file.name,
          uploaded_by_email: "admin",
          unidades: preview,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Falha");
      const msgPrev = data?.replaced_previous
        ? `\n\n🗑️ Tabela anterior apagada (${data.previous_info?.total_unidades || 0} unidades, de ${data.previous_info?.updated_at ? new Date(data.previous_info.updated_at).toLocaleDateString("pt-BR") : "—"}).`
        : "";
      alert(`✅ Tabela enviada com sucesso! ${data.total} unidades cadastradas.${msgPrev}`);
      resetForm();
      setFormOpen(false);
      reload();
    } catch (e: any) {
      alert("Erro: " + (e?.message || "Falha no upload"));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Excluir a tabela de "${nome}"? As unidades vinculadas também serão removidas.`)) return;
    try {
      const { error } = await supabase.functions.invoke("delete-tabela-empreendimento", {
        body: { admin_password: adminPassword, tabela_id: id },
      });
      if (error) throw error;
      reload();
    } catch (e: any) {
      alert("Erro: " + (e?.message || "Falha"));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-primary uppercase border-b border-gold/30 pb-2 flex-1">
          Tabela de Vendas por Empreendimento
        </h3>
        <button
          onClick={() => setFormOpen(true)}
          className="ml-2 inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-primary text-gold font-bold hover:opacity-90"
        >
          <Plus className="w-3 h-3" /> Novo
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <Loader2 className="w-4 h-4 animate-spin mx-auto text-primary" />
        </div>
      ) : tabelas.length === 0 ? (
        <p className="text-[11px] text-muted-foreground text-center py-3">
          Nenhuma tabela cadastrada. Clique em "Novo" para subir o PDF ou Excel da construtora.
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {tabelas.map((t) => (
            <div key={t.id} className="border border-border rounded p-2 bg-card flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {t.arquivo_tipo === "pdf" ? (
                    <FileText className="w-3 h-3 text-destructive" />
                  ) : (
                    <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  )}
                  <p className="text-xs font-semibold text-foreground truncate">{t.empreendimento_nome}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  CNPJ {t.construtora_cnpj} · {t.total_unidades} unidades · {new Date(t.updated_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex gap-1">
                {t.download_url && (
                  <a
                    href={t.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-primary hover:bg-muted rounded"
                    title="Baixar original"
                  >
                    <Download className="w-3 h-3" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(t.id, t.empreendimento_nome)}
                  className="p-1 text-destructive hover:bg-muted rounded"
                  title="Excluir"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de upload */}
      {formOpen && (
        <div className="fixed inset-0 z-[3000] bg-black/70 flex items-center justify-center p-4" onClick={() => !uploading && setFormOpen(false)}>
          <div className="bg-card w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-border sticky top-0 bg-card">
              <h4 className="text-sm font-bold text-primary uppercase">Nova Tabela de Vendas</h4>
              <button onClick={() => !uploading && setFormOpen(false)} className="p-1 hover:bg-muted rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-primary uppercase mb-1">Nome do Empreendimento *</label>
                <input value={empNome} onChange={(e) => setEmpNome(e.target.value)} maxLength={120}
                  className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-primary uppercase mb-1">CNPJ Construtora *</label>
                  <input value={cnpj} onChange={(e) => setCnpj(formatCNPJ(e.target.value))} placeholder="00.000.000/0000-00"
                    className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-primary uppercase mb-1">UF</label>
                  <input value={uf} onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
                    className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-primary uppercase mb-1">Cidade</label>
                <input value={cidade} onChange={(e) => setCidade(e.target.value)} maxLength={80}
                  className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <label className="cursor-pointer border-2 border-dashed border-emerald-600/40 rounded p-3 text-center hover:bg-emerald-600/5">
                  <FileSpreadsheet className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                  <span className="text-[11px] font-bold text-emerald-700">Anexar Tabela Excel</span>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], "xlsx")} />
                </label>
                <label className="cursor-pointer border-2 border-dashed border-destructive/40 rounded p-3 text-center hover:bg-destructive/5">
                  <FileText className="w-5 h-5 mx-auto text-destructive mb-1" />
                  <span className="text-[11px] font-bold text-destructive">Anexar Tabela PDF</span>
                  <input type="file" accept=".pdf" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], "pdf")} />
                </label>
              </div>

              {parsing && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Lendo arquivo...
                </div>
              )}

              {parseError && (
                <div className="flex items-start gap-2 p-2 rounded bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {preview.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    {preview.length} unidades detectadas — pré-visualização (10 primeiras):
                  </div>
                  <div className="overflow-x-auto max-h-40 border border-border rounded">
                    <table className="w-full text-[10px]">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="px-1 py-1 text-left">Unidade</th>
                          <th className="px-1 py-1 text-left">Andar</th>
                          <th className="px-1 py-1 text-left">Torre</th>
                          <th className="px-1 py-1 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.slice(0, 10).map((u, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-1 py-0.5">{u.unidade}</td>
                            <td className="px-1 py-0.5">{u.andar || "-"}</td>
                            <td className="px-1 py-0.5">{u.apto_torre || "-"}</td>
                            <td className="px-1 py-0.5 text-right">
                              {u.valor_lancamento ? u.valor_lancamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading || !file || !preview.length}
                className="w-full py-2 rounded bg-primary text-gold font-bold text-xs uppercase hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Confirmar e Enviar Tabela"}
              </button>
              <p className="text-[10px] text-amber-700 text-center font-medium">
                ⚠ Se já existir tabela para esse empreendimento (mesmo CNPJ + nome), a anterior será apagada automaticamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
