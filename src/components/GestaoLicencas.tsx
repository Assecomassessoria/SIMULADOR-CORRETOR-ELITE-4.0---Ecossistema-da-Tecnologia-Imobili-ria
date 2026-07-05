import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, ToggleLeft, ToggleRight, ArrowLeft, Search } from "lucide-react";

interface License {
  id: string;
  nome: string;
  email: string | null;
  whatsapp: string | null;
  cidade: string | null;
  status: string;
  validade_dias: number;
  data_envio: string;
  data_expiracao: string;
}

async function callManageLicenses(action: string, adminPassword: string, extra: Record<string, string> = {}) {
  const { data, error } = await supabase.functions.invoke("manage-licenses", {
    body: { action, admin_password: adminPassword, ...extra },
  });
  if (error) throw new Error(error.message || "Erro na requisição");
  if (data && !data.success) throw new Error(data.error || "Erro desconhecido");
  return data;
}

export default function GestaoLicencas({ onBack, adminPassword }: { onBack: () => void; adminPassword: string }) {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const result = await callManageLicenses("list", adminPassword);
      if (result?.data) setLicenses(result.data);
    } catch (e) {
      console.warn("Erro ao carregar licenças:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Ativo" ? "Inativo" : "Ativo";
    setToggling(id);
    try {
      await callManageLicenses("toggle_status", adminPassword, { id, new_status: newStatus });
      setLicenses((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
      );
    } catch (e) {
      console.error("Erro ao alterar status:", e);
    }
    setToggling(null);
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("pt-BR");
    } catch {
      return d;
    }
  };

  const isExpired = (d: string) => new Date(d) < new Date();

  const filtered = licenses.filter(
    (l) =>
      l.nome.toLowerCase().includes(search.toLowerCase()) ||
      (l.email && l.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-gold hover:text-gold-bright transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          onClick={fetchLicenses}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-gold hover:text-gold-bright transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      <h3 className="text-xs font-bold text-gold uppercase border-b border-gold/30 pb-2">
        Gestão de Licenças ELITE ({licenses.length})
      </h3>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gold/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="w-full pl-9 pr-3 py-2 border border-gold/30 rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-gold mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Carregando licenças...</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-8">
          {search ? "Nenhuma licença encontrada." : "Nenhuma licença cadastrada."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((lic) => {
            const expired = isExpired(lic.data_expiracao);
            const active = lic.status === "Ativo" && !expired;

            return (
              <div
                key={lic.id}
                className={`border rounded-lg p-3 space-y-2 ${
                  active
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{lic.nome}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {lic.email || "—"} · {lic.whatsapp || "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleStatus(lic.id, lic.status)}
                    disabled={toggling === lic.id}
                    className="flex items-center gap-1 text-xs font-bold transition-colors disabled:opacity-50"
                    title={active ? "Desativar" : "Ativar"}
                  >
                    {lic.status === "Ativo" ? (
                      <ToggleRight className="w-6 h-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-destructive" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-muted-foreground">Cidade:</span>{" "}
                    <span className="text-foreground">{lic.cidade || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Validade:</span>{" "}
                    <span className="text-foreground">{lic.validade_dias} dias</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expira:</span>{" "}
                    <span className={expired ? "text-destructive font-bold" : "text-foreground"}>
                      {formatDate(lic.data_expiracao)}
                      {expired && " (Expirada)"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">
                    Cadastro: {formatDate(lic.data_envio)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                      active
                        ? "bg-green-500/20 text-green-400"
                        : "bg-destructive/20 text-destructive"
                    }`}
                  >
                    {expired ? "Expirada" : lic.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
