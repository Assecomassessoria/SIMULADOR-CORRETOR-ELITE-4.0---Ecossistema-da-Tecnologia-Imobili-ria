import { useEffect, useState, useRef, useMemo } from "react";
import {
  FileSpreadsheet,
  FileText,
  Loader2,
  Trash2,
  Download,
  Plus,
  X,
  CheckCircle,
  AlertTriangle,
  Search,
  Building,
  DollarSign,
  Maximize2
} from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

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
    setSearchTerm("");
    setShowAll(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (pdfInputRef.current) pdfInputRef.current.value = "";
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
        setParseError("PDF sem texto detectável diretamente. Executando OCR com Inteligência Artificial...");
        const images = await renderPdfPagesToImages(f, 1.6, 10);
        if (!images.length) {
          setParseError("Não foi possível renderizar as páginas do PDF para OCR.");
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
          setParseError("OCR concluído, mas nenhuma unidade foi reconhecida. Tente um PDF com melhor qualidade ou use arquivo Excel (.xlsx).");
          return;
        }
        setParseError("");
        setPreview(data.unidades);
      } else {
        setParseError("Nenhuma unidade encontrada. Verifique se o arquivo possui colunas com 'Unidade' e 'Valor'.");
      }
    } catch (e: any) {
      setParseError(e?.message || "Falha ao ler arquivo.");
    } finally {
      setParsing(false);
    }
  };

  const handleUpload = async () => {
    if (!empNome.trim() || !cnpj.trim() || !file || !preview.length) {
      alert("Preencha Nome, CNPJ e selecione um arquivo válido com unidades reconhecidas.");
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
      if (error || data?.error) throw new Error(data?.error || error?.message || "Falha no envio");
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

  // Preview filtering & statistics
  const filteredPreview = useMemo(() => {
    if (!searchTerm.trim()) return preview;
    const s = searchTerm.toLowerCase();
    return preview.filter((u) =>
      u.unidade.toLowerCase().includes(s) ||
      (u.apto_torre && u.apto_torre.toLowerCase().includes(s)) ||
      (u.andar && u.andar.toLowerCase().includes(s)) ||
      (u.tipologia && u.tipologia.toLowerCase().includes(s))
    );
  }, [preview, searchTerm]);

  const stats = useMemo(() => {
    if (!preview.length) return null;
    const valores = preview.map((u) => u.valor_lancamento).filter((v): v is number => typeof v === "number" && v > 0);
    if (!valores.length) return { total: preview.length, min: 0, max: 0, avg: 0 };
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const sum = valores.reduce((a, b) => a + b, 0);
    const avg = sum / valores.length;
    return { total: preview.length, min, max, avg };
  }, [preview]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-primary uppercase border-b border-gold/30 pb-2 flex-1">
          Tabela de Vendas por Empreendimento
        </h3>
        <button
          onClick={() => setFormOpen(true)}
          className="ml-2 inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-primary text-gold font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3 h-3" /> Nova Tabela
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <Loader2 className="w-4 h-4 animate-spin mx-auto text-primary" />
        </div>
      ) : tabelas.length === 0 ? (
        <p className="text-[11px] text-muted-foreground text-center py-3">
          Nenhuma tabela cadastrada. Clique em "Nova Tabela" para subir o arquivo Excel (.xlsx) ou PDF da construtora.
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {tabelas.map((t) => (
            <div key={t.id} className="border border-border rounded p-2 bg-card flex items-center justify-between gap-2 hover:border-gold/30 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {t.arquivo_tipo === "pdf" ? (
                    <FileText className="w-3.5 h-3.5 text-destructive shrink-0" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                  <p className="text-xs font-semibold text-foreground truncate">{t.empreendimento_nome}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  CNPJ {t.construtora_cnpj} · {t.total_unidades} unidades {t.cidade ? `· ${t.cidade}/${t.uf || ""}` : ""} · {new Date(t.updated_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex gap-1">
                {t.download_url && (
                  <a
                    href={t.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-primary hover:bg-muted rounded transition-colors"
                    title="Baixar arquivo original"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(t.id, t.empreendimento_nome)}
                  className="p-1 text-destructive hover:bg-muted rounded transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de upload e pré-visualização */}
      {formOpen && (
        <div
          className="fixed inset-0 z-[3000] bg-black/70 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm"
          onClick={() => !uploading && setFormOpen(false)}
        >
          <div
            className="bg-card text-card-foreground w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-border sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gold" />
                <h4 className="text-sm font-bold text-primary uppercase">Cadastrar Tabela de Vendas</h4>
              </div>
              <button
                onClick={() => !uploading && setFormOpen(false)}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-primary uppercase mb-1">Nome do Empreendimento *</label>
                <input
                  value={empNome}
                  onChange={(e) => setEmpNome(e.target.value)}
                  maxLength={120}
                  placeholder="Ex: Residencial Parque das Flores"
                  className="w-full px-2.5 py-1.5 border border-border rounded text-xs bg-background focus:border-gold outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-primary uppercase mb-1">CNPJ Construtora *</label>
                  <input
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-2.5 py-1.5 border border-border rounded text-xs bg-background focus:border-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-primary uppercase mb-1">UF</label>
                  <input
                    value={uf}
                    onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full px-2.5 py-1.5 border border-border rounded text-xs bg-background focus:border-gold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-primary uppercase mb-1">Cidade</label>
                <input
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  maxLength={80}
                  placeholder="Ex: São Paulo"
                  className="w-full px-2.5 py-1.5 border border-border rounded text-xs bg-background focus:border-gold outline-none"
                />
              </div>

              {/* Botões de seleção de arquivo */}
              {!file ? (
                <div>
                  <label className="block text-[10px] font-bold text-primary uppercase mb-1.5">
                    Selecionar Arquivo da Tabela (Excel ou PDF) *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="cursor-pointer border-2 border-dashed border-emerald-600/40 rounded-lg p-3.5 text-center hover:bg-emerald-600/10 hover:border-emerald-600 transition-all flex flex-col items-center justify-center gap-1">
                      <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Tabela Excel (.xlsx, .xls)</span>
                      <span className="text-[10px] text-muted-foreground">Reconhecimento instantâneo</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], "xlsx")}
                      />
                    </label>

                    <label className="cursor-pointer border-2 border-dashed border-destructive/40 rounded-lg p-3.5 text-center hover:bg-destructive/10 hover:border-destructive transition-all flex flex-col items-center justify-center gap-1">
                      <FileText className="w-6 h-6 text-destructive" />
                      <span className="text-xs font-bold text-destructive">Tabela PDF (.pdf)</span>
                      <span className="text-[10px] text-muted-foreground">Leitura de texto ou OCR</span>
                      <input
                        ref={pdfInputRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], "pdf")}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                /* Arquivo selecionado badge */
                <div className="border border-border rounded-lg p-3 bg-muted/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {fileType === "xlsx" ? (
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-destructive shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB · {fileType.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreview([]);
                      setParseError("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      if (pdfInputRef.current) pdfInputRef.current.value = "";
                    }}
                    className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-colors font-medium"
                  >
                    Trocar Arquivo
                  </button>
                </div>
              )}

              {/* Status de parsing */}
              {parsing && (
                <div className="flex items-center justify-center gap-2 text-xs text-primary font-medium py-3 bg-primary/5 rounded-lg border border-primary/20">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Processando e analisando estrutura do arquivo...
                </div>
              )}

              {/* Erro de leitura */}
              {parseError && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <span className="font-semibold">{parseError}</span>
                    <p className="text-[10px] text-destructive/80">
                      Dica: Garanta que a primeira linha de dados contenha cabeçalhos como "Unidade", "Andar", "Torre" e "Valor".
                    </p>
                  </div>
                </div>
              )}

              {/* Pré-visualização com Estatísticas e Tabela Completa */}
              {preview.length > 0 && (
                <div className="space-y-2 border border-border rounded-xl p-3 bg-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2">
                    <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle className="w-4 h-4" />
                      <span>{preview.length} unidades identificadas</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3 h-3 text-muted-foreground absolute left-2 top-2" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Buscar unidade/torre..."
                          className="text-[10px] pl-6 pr-2 py-1 border border-border rounded bg-background w-36 sm:w-44 focus:border-gold outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAll(!showAll)}
                        className="text-[10px] px-2 py-1 border border-border rounded hover:bg-muted font-medium"
                      >
                        {showAll ? "Ver 10 primeiras" : `Ver todas (${preview.length})`}
                      </button>
                    </div>
                  </div>

                  {/* Resumo estatístico */}
                  {stats && (
                    <div className="grid grid-cols-3 gap-2 py-1 text-center bg-muted/30 rounded-lg p-2 text-[11px]">
                      <div>
                        <span className="block text-[9px] text-muted-foreground uppercase font-bold">Menor Valor</span>
                        <span className="font-bold text-foreground">
                          {stats.min > 0 ? stats.min.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-muted-foreground uppercase font-bold">Valor Médio</span>
                        <span className="font-bold text-foreground">
                          {stats.avg > 0 ? stats.avg.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-muted-foreground uppercase font-bold">Maior Valor</span>
                        <span className="font-bold text-foreground">
                          {stats.max > 0 ? stats.max.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tabela de pré-visualização */}
                  <div className="overflow-x-auto max-h-52 border border-border rounded-lg">
                    <table className="w-full text-[10px]">
                      <thead className="bg-muted sticky top-0 font-bold text-muted-foreground uppercase">
                        <tr>
                          <th className="px-2 py-1.5 text-left">Unidade</th>
                          <th className="px-2 py-1.5 text-left">Andar</th>
                          <th className="px-2 py-1.5 text-left">Torre / Bloco</th>
                          <th className="px-2 py-1.5 text-left">Tipologia</th>
                          <th className="px-2 py-1.5 text-left">Área (m²)</th>
                          <th className="px-2 py-1.5 text-right">Valor Tabela</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(showAll ? filteredPreview : filteredPreview.slice(0, 10)).map((u, i) => (
                          <tr key={i} className="hover:bg-muted/50 transition-colors">
                            <td className="px-2 py-1 font-semibold text-foreground">{u.unidade}</td>
                            <td className="px-2 py-1 text-muted-foreground">{u.andar || "—"}</td>
                            <td className="px-2 py-1 text-muted-foreground">{u.apto_torre || "—"}</td>
                            <td className="px-2 py-1 text-muted-foreground">{u.tipologia || "—"}</td>
                            <td className="px-2 py-1 text-muted-foreground">{u.metragem || "—"}</td>
                            <td className="px-2 py-1 text-right font-bold text-primary">
                              {u.valor_lancamento
                                ? u.valor_lancamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {!showAll && filteredPreview.length > 10 && (
                    <p className="text-[10px] text-muted-foreground text-center pt-1">
                      Exibindo 10 de {filteredPreview.length} unidades. Clique em "Ver todas" acima para visualizar a lista completa.
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading || !file || !preview.length}
                className="w-full py-2.5 rounded-lg bg-primary text-gold font-bold text-xs uppercase hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-md"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Enviando e salvando tabela...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Confirmar e Enviar Tabela ({preview.length} unidades)
                  </>
                )}
              </button>

              <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center font-medium">
                ⚠ Se já existir tabela para esse empreendimento (mesmo CNPJ + nome), a anterior será substituída automaticamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
