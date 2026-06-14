import { useState } from "react";
import { X, UserPlus, Loader2, CheckCircle, Eye, EyeOff, List, Building2, FileText } from "lucide-react";
import GestaoLicencas from "./GestaoLicencas";
import GestaoLicencasComerciais from "./GestaoLicencasComerciais";
import CadastroComercial from "./CadastroComercial";
import SheetsConnectionTest from "./SheetsConnectionTest";
import { validatePassword } from "@/lib/eliteUtils";

interface DemoAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function generateElitePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ELITE-${result}`;
}

function formatDateBR(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}

export default function DemoAdminPanel({ isOpen, onClose }: DemoAdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showGestao, setShowGestao] = useState(false);
  const [showGestaoComercial, setShowGestaoComercial] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"demoadm" | "comercial" | "gestao">("demoadm");
  const [gestaoSub, setGestaoSub] = useState<"demoadm" | "comercial">("demoadm");

  const [nome, setNome] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [contato, setContato] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [cidade, setCidade] = useState("");
  const [plano, setPlano] = useState("individual");
  const [validade, setValidade] = useState("7");
  const [senha] = useState(generateElitePassword());

  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sendError, setSendError] = useState("");

  const dataEnvio = new Date();
  const dataExpiracao = new Date(dataEnvio);
  dataExpiracao.setDate(dataExpiracao.getDate() + parseInt(validade));

  const handleAuth = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const result = await validatePassword(adminPass, "demoadm");
      if (result.valid) {
        setIsAuthenticated(true);
        setAdminPassword(adminPass); // keep for register-elite calls
        setAuthError("");
      } else {
        setAuthError("Senha administrativa incorreta!");
      }
    } catch {
      setAuthError("Erro ao validar. Tente novamente.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!nome.trim() || !whatsapp.trim() || !email.trim() || !cidade.trim()) {
      setSendError("Preencha todos os campos.");
      return;
    }

    setSending(true);
    setSendError("");

    const payload = {
      nome: nome.trim(),
      cpfCnpj: cpfCnpj.trim(),
      endereco: endereco.trim(),
      contato: contato.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      cidade: cidade.trim(),
      plano,
      senha,
      validade: `${validade} dias`,
      dataEnvio: formatDateBR(dataEnvio),
      dataExpiracao: formatDateBR(dataExpiracao),
      status: "Ativo",
    };

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: regResult, error: regError } = await supabase.functions.invoke("register-elite", {
        body: {
          admin_password: adminPassword,
          nome: payload.nome,
          whatsapp: payload.whatsapp,
          email: payload.email,
          cidade: payload.cidade,
          senha: payload.senha,
          validade_dias: validade,
        },
      });

      if (regError || !regResult?.success) {
        setSendError("Erro ao registrar licença. Tente novamente.");
        setSending(false);
        return;
      }

      const { data: sheetResult, error: sheetError } = await supabase.functions.invoke("send-to-sheets", {
        body: { ...payload, admin_password: adminPassword },
      });
      console.log("Google Sheets result:", sheetResult, sheetError);
      setSuccess(true);
    } catch {
      setSendError("Erro ao enviar dados. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    setNome("");
    setCpfCnpj("");
    setEndereco("");
    setContato("");
    setWhatsapp("");
    setEmail("");
    setCidade("");
    setPlano("individual");
    setValidade("7");
    setSuccess(false);
    setSendError("");
  };

  const handleClose = () => {
    setIsAuthenticated(false);
    setAdminPass("");
    setAdminPassword("");
    setAuthError("");
    setShowAdminPass(false);
    setShowGestao(false);
    setShowGestaoComercial(false);
    setActiveTab("demoadm");
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      style={{ background: "rgba(0, 31, 63, 0.95)" }}
    >
      <div className="bg-card w-[92%] max-w-md max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-gold/30">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gold/30 sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-gold" />
            <h2 className="text-sm font-bold text-gold uppercase tracking-wider">
              {activeTab === "demoadm"
                ? "Cadastro DEMOADM"
                : activeTab === "comercial"
                  ? "Cadastro Comercial"
                  : "Gestão de Licenças"}
            </h2>
          </div>
          <button onClick={handleClose} className="p-1 hover:bg-muted rounded transition-colors">
            <X className="w-5 h-5 text-destructive" />
          </button>
        </div>

        {/* Tabs - shown only when authenticated and not in success/gestao */}
        {isAuthenticated && !success && !showGestao && !showGestaoComercial && (
          <div className="flex border-b border-gold/20 sticky top-[57px] bg-card z-10">
            <button
              onClick={() => setActiveTab("demoadm")}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 ${
                activeTab === "demoadm"
                  ? "text-gold border-b-2 border-gold bg-primary/10"
                  : "text-gold/50 hover:text-gold/80"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              DEMO
            </button>
            <button
              onClick={() => setActiveTab("comercial")}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 ${
                activeTab === "comercial"
                  ? "text-gold border-b-2 border-gold bg-primary/10"
                  : "text-gold/50 hover:text-gold/80"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Comercial
            </button>
            <button
              onClick={() => setActiveTab("gestao")}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 ${
                activeTab === "gestao"
                  ? "text-gold border-b-2 border-gold bg-primary/10"
                  : "text-gold/50 hover:text-gold/80"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Gestão
            </button>
          </div>
        )}

        {/* Test Sheets Connection Button */}
        {isAuthenticated && !success && !showGestao && !showGestaoComercial && <SheetsConnectionTest />}

        {!isAuthenticated ? (
          /* Auth Screen */
          <div className="p-6 space-y-4 text-center">
            <p className="text-muted-foreground text-sm">Acesso Restrito - Administrativo</p>
            <div className="relative">
              <input
                type={showAdminPass ? "text" : "password"}
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                placeholder="Senha Administrativa"
                maxLength={50}
                onKeyDown={(e) => e.key === "Enter" && !authLoading && handleAuth()}
                className="w-full px-4 py-3 pr-10 border border-gold/30 rounded-lg text-center bg-primary/20 text-gold placeholder:text-gold/40 focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <button
                type="button"
                onClick={() => setShowAdminPass(!showAdminPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gold/50 hover:text-gold transition-colors"
                tabIndex={-1}
              >
                {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {authError && <p className="text-destructive text-sm">{authError}</p>}
            <button
              onClick={handleAuth}
              disabled={authLoading}
              className="w-full py-3 rounded-lg gold-gradient text-primary font-bold uppercase hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
                </>
              ) : (
                "Acessar"
              )}
            </button>
          </div>
        ) : success ? (
          /* Success Screen */
          <div className="p-6 space-y-4 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h3 className="text-gold font-bold uppercase text-sm">Cadastro Realizado!</h3>
            <div className="bg-primary/30 border border-gold/30 rounded-lg p-4 space-y-2 text-left">
              <p className="text-gold/80 text-xs">
                <strong>Nome:</strong> {nome}
              </p>
              <p className="text-gold/80 text-xs">
                <strong>Senha Gerada:</strong> <span className="text-gold-bright font-bold">{senha}</span>
              </p>
              <p className="text-gold/80 text-xs">
                <strong>Validade:</strong> {validade} dias
              </p>
              <p className="text-gold/80 text-xs">
                <strong>Expiração:</strong> {formatDateBR(dataExpiracao)}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-lg gold-gradient text-primary font-bold uppercase hover:opacity-90 transition-opacity"
            >
              Novo Cadastro
            </button>
            <button
              onClick={handleClose}
              className="w-full py-2 rounded-lg border border-gold/30 text-gold text-sm uppercase font-bold hover:bg-gold/10 transition-colors"
            >
              Fechar
            </button>
          </div>
        ) : showGestao ? (
          /* License Management DEMOADM */
          <GestaoLicencas onBack={() => setShowGestao(false)} adminPassword={adminPassword} />
        ) : showGestaoComercial ? (
          /* License Management Comercial */
          <GestaoLicencasComerciais onBack={() => setShowGestaoComercial(false)} adminPassword={adminPassword} />
        ) : activeTab === "gestao" ? (
          /* Combined Gestão de Licenças with sub-toggle */
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setGestaoSub("demoadm")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border transition-colors ${
                  gestaoSub === "demoadm"
                    ? "bg-gold/20 text-gold border-gold"
                    : "border-gold/30 text-gold/60 hover:text-gold"
                }`}
              >
                DEMOADM
              </button>
              <button
                onClick={() => setGestaoSub("comercial")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border transition-colors ${
                  gestaoSub === "comercial"
                    ? "bg-gold/20 text-gold border-gold"
                    : "border-gold/30 text-gold/60 hover:text-gold"
                }`}
              >
                Comercial
              </button>
            </div>
            {gestaoSub === "demoadm" ? (
              <GestaoLicencas onBack={() => setActiveTab("demoadm")} adminPassword={adminPassword} />
            ) : (
              <GestaoLicencasComerciais onBack={() => setActiveTab("demoadm")} adminPassword={adminPassword} />
            )}
          </div>
        ) : activeTab === "comercial" ? (
          /* Commercial Registration Form + Gestão */
          <div>
            <CadastroComercial adminPassword={adminPassword} />
            <div className="px-4 pb-4">
              <button
                onClick={() => setShowGestaoComercial(true)}
                className="w-full py-2.5 rounded-lg border border-gold/30 text-gold text-sm uppercase font-bold hover:bg-gold/10 transition-colors flex items-center justify-center gap-2"
              >
                <List className="w-4 h-4" />
                Gestão de Licenças Comerciais
              </button>
            </div>
          </div>
        ) : (
          /* DEMOADM Registration Form */
          <div className="p-4 space-y-4">
            <FormField label="Nome" value={nome} onChange={setNome} placeholder="Nome completo" />
            <FormField label="CPF/CNPJ" value={cpfCnpj} onChange={setCpfCnpj} placeholder="CPF ou CNPJ" />
            <FormField label="Endereço" value={endereco} onChange={setEndereco} placeholder="Endereço completo" />
            <FormField label="Contato" value={contato} onChange={setContato} placeholder="Telefone de contato" />
            <FormField label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="(00) 00000-0000" />
            <FormField label="Email" value={email} onChange={setEmail} placeholder="email@exemplo.com" type="email" />
            <FormField label="Cidade/UF" value={cidade} onChange={setCidade} placeholder="Cidade / UF" />

            {/* Plano */}
            <div>
              <label className="block text-[10px] font-bold text-gold uppercase mb-1">Plano</label>
              <select
                value={plano}
                onChange={(e) => setPlano(e.target.value)}
                className="w-full px-3 py-2.5 border border-gold/30 rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="individual">Individual (Corretor)</option>
                <option value="plano01">Plano 01 - Até 5 Corretores</option>
                <option value="plano02">Plano 02 - Até 10 Corretores</option>
                <option value="plano03">Plano 03 - Até 15 Corretores</option>
                <option value="plano04">Plano 04 - Até 20 Corretores</option>
                <option value="plano05">Plano 05 - Até 25 Corretores</option>
                <option value="plano06">Plano 06 - Até 30 Corretores</option>
                <option value="master">Plano Master - Ilimitado</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gold uppercase mb-1">Senha Gerada</label>
              <div className="w-full px-3 py-2.5 border border-gold/30 rounded-lg text-sm bg-primary font-bold tracking-widest text-center text-primary-foreground">
                {senha}
              </div>
            </div>

            {/* Validade */}
            <div>
              <label className="block text-[10px] font-bold text-gold uppercase mb-1">Validade (dias)</label>
              <select
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
                className="w-full px-3 py-2.5 border border-gold/30 rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="1">1 dias</option>
                <option value="7">7 dias</option>
                <option value="14">14 dias</option>
                <option value="21">21 dias</option>
                <option value="28">28 dias</option>
                {plano !== "individual" && <option value="365">365 dias (Plano Anual)</option>}
              </select>
            </div>

            {/* Datas automáticas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gold uppercase mb-1">Data Envio</label>
                <div className="px-3 py-2 border border-gold/20 rounded-lg text-xs text-gold/70 bg-primary/20 text-center">
                  {formatDateBR(dataEnvio)}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gold uppercase mb-1">Data Expiração</label>
                <div className="px-3 py-2 border border-gold/20 rounded-lg text-xs text-gold/70 bg-primary/20 text-center">
                  {formatDateBR(dataExpiracao)}
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold text-gold uppercase mb-1">Status</label>
              <div className="px-3 py-2 border border-green-500/30 rounded-lg text-xs text-green-400 bg-green-500/10 text-center font-bold">
                Ativo
              </div>
            </div>

            {sendError && <p className="text-destructive text-sm text-center">{sendError}</p>}

            <button
              onClick={handleSubmit}
              disabled={sending}
              className="w-full py-3 rounded-lg gold-gradient text-primary font-bold uppercase hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Cadastrar DEMOADM"
              )}
            </button>

            <button
              onClick={() => setShowGestao(true)}
              className="w-full py-2.5 rounded-lg border border-gold/30 text-gold text-sm uppercase font-bold hover:bg-gold/10 transition-colors flex items-center justify-center gap-2"
            >
              <List className="w-4 h-4" />
              Gestão de Licenças
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gold uppercase mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={100}
        className="w-full px-3 py-2.5 border border-gold/30 rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-gold placeholder:text-muted-foreground"
      />
    </div>
  );
}
