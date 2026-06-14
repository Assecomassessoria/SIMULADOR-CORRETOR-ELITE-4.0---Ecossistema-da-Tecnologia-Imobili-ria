import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";

interface CadastroComercialProps {
  adminPassword: string;
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

const PLANOS = [
  { value: "plano01", label: "Plano 01 - 01 a 05 Usuários", max: 5 },
  { value: "plano02", label: "Plano 02 - 01 a 10 Usuários", max: 10 },
  { value: "plano03", label: "Plano 03 - 01 a 15 Usuários", max: 15 },
  { value: "plano04", label: "Plano 04 - 01 a 20 Usuários", max: 20 },
  { value: "plano05", label: "Plano 05 - 01 a 30 Usuários", max: 30 },
  { value: "master", label: "Plano Master - Acima de 31 Usuários", max: 999 },
];

export default function CadastroComercial({ adminPassword }: CadastroComercialProps) {
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  const [nomeContato, setNomeContato] = useState("");
  const [contato, setContato] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const [plano, setPlano] = useState("plano01");
  const [masterUsuarios, setMasterUsuarios] = useState("50");
  const [validade, setValidade] = useState("365");
  const [senha] = useState(generateElitePassword());

  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sendError, setSendError] = useState("");

  const dataEnvio = new Date();
  const dataExpiracao = new Date(dataEnvio);
  dataExpiracao.setDate(dataExpiracao.getDate() + parseInt(validade || "365"));

  const planoInfo = PLANOS.find((p) => p.value === plano);
  const maxUsuarios = plano === "master" ? parseInt(masterUsuarios) || 50 : (planoInfo?.max || 5);

  const handleSubmit = async () => {
    if (!razaoSocial.trim() || !whatsapp.trim() || !email.trim() || !cidade.trim()) {
      setSendError("Preencha os campos obrigatórios: Nome/Razão Social, WhatsApp, Email e Cidade.");
      return;
    }

    setSending(true);
    setSendError("");

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("register-elite", {
        body: {
          admin_password: adminPassword,
          tipo_cadastro: "comercial",
          razao_social: razaoSocial.trim(),
          cpf_cnpj: cpfCnpj.trim(),
          endereco: endereco.trim(),
          bairro: bairro.trim(),
          cidade: cidade.trim(),
          estado: estado.trim(),
          cep: cep.trim(),
          nome_contato: nomeContato.trim(),
          contato: contato.trim(),
          whatsapp: whatsapp.trim(),
          email: email.trim(),
          plano,
          plano_label: planoInfo?.label || "",
          max_usuarios: maxUsuarios,
          senha,
          validade_dias: validade,
          data_envio: formatDateBR(dataEnvio),
          data_expiracao: formatDateBR(dataExpiracao),
        },
      });

      if (error) {
        setSendError("Erro ao registrar. Tente novamente.");
        setSending(false);
        return;
      }

      // Save to localStorage for PainelComercial (as fallback + quick access)
      const cadastroComercial = {
        id: data?.cadastro_id || null,
        razaoSocial: razaoSocial.trim(),
        cpfCnpj: cpfCnpj.trim(),
        cidade: cidade.trim(),
        estado: estado.trim(),
        plano,
        planoLabel: planoInfo?.label || "",
        maxUsuarios,
        validade: parseInt(validade || "365"),
        senha,
        dataEnvio: formatDateBR(dataEnvio),
        dataExpiracao: formatDateBR(dataExpiracao),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
      };
      localStorage.setItem("elite_cadastro_comercial", JSON.stringify(cadastroComercial));

      setSuccess(true);
    } catch {
      setSendError("Erro ao enviar dados. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    setRazaoSocial("");
    setCpfCnpj("");
    setEndereco("");
    setBairro("");
    setCidade("");
    setEstado("");
    setCep("");
    setNomeContato("");
    setContato("");
    setWhatsapp("");
    setEmail("");
    setPlano("plano01");
    setMasterUsuarios("50");
    setValidade("365");
    setSuccess(false);
    setSendError("");
  };

  if (success) {
    return (
      <div className="p-6 space-y-4 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
        <h3 className="text-gold font-bold uppercase text-sm">Cadastro Comercial Realizado!</h3>
        <p className="text-green-400 text-xs">Dados salvos no banco e enviados para a planilha Google.</p>
        <div className="bg-primary/30 border border-gold/30 rounded-lg p-4 space-y-2 text-left">
          <p className="text-gold/80 text-xs"><strong>Razão Social:</strong> {razaoSocial}</p>
          <p className="text-gold/80 text-xs"><strong>CPF/CNPJ:</strong> {cpfCnpj}</p>
          <p className="text-gold/80 text-xs"><strong>Cidade/UF:</strong> {cidade} / {estado}</p>
          <p className="text-gold/80 text-xs"><strong>Plano:</strong> {planoInfo?.label}</p>
          <p className="text-gold/80 text-xs"><strong>Máx. Usuários:</strong> {maxUsuarios}</p>
          <p className="text-gold/80 text-xs"><strong>Senha:</strong> <span className="text-gold-bright font-bold">{senha}</span></p>
          <p className="text-gold/80 text-xs"><strong>Validade:</strong> {validade} dias</p>
          <p className="text-gold/80 text-xs"><strong>Expiração:</strong> {formatDateBR(dataExpiracao)}</p>
        </div>
        <button
          onClick={handleReset}
          className="w-full py-3 rounded-lg gold-gradient text-primary font-bold uppercase hover:opacity-90 transition-opacity"
        >
          Novo Cadastro
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <FormField label="Contato" value={contato} onChange={setContato} placeholder="Telefone de contato" />
      <FormField label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="(00) 00000-0000" />
      <FormField label="Nome / Razão Social" value={razaoSocial} onChange={setRazaoSocial} placeholder="Nome ou Razão Social" />
      <FormField label="CPF / CNPJ" value={cpfCnpj} onChange={setCpfCnpj} placeholder="CPF ou CNPJ" />
      <FormField label="Endereço" value={endereco} onChange={setEndereco} placeholder="Endereço completo" />
      <FormField label="Bairro" value={bairro} onChange={setBairro} placeholder="Bairro" />
      <FormField label="Cidade" value={cidade} onChange={setCidade} placeholder="Cidade" />
      <FormField label="Estado" value={estado} onChange={setEstado} placeholder="UF" />
      <FormField label="CEP" value={cep} onChange={setCep} placeholder="00000-000" />
      <FormField label="Nome do Contato" value={nomeContato} onChange={setNomeContato} placeholder="Nome do responsável" />
      <FormField label="Email" value={email} onChange={setEmail} placeholder="email@exemplo.com" type="email" />

      {/* Plano */}
      <div>
        <label className="block text-[10px] font-bold text-gold uppercase mb-1">Plano</label>
        <select
          value={plano}
          onChange={(e) => setPlano(e.target.value)}
          className="w-full px-3 py-2.5 border border-gold/30 rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
        >
          {PLANOS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {plano === "master" && (
        <div>
          <label className="block text-[10px] font-bold text-gold uppercase mb-1">Quantidade de Usuários (Master)</label>
          <input
            type="number"
            min={31}
            value={masterUsuarios}
            onChange={(e) => setMasterUsuarios(e.target.value)}
            className="w-full px-3 py-2.5 border border-gold/30 rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
      )}

      {/* Senha Gerada */}
      <div>
        <label className="block text-[10px] font-bold text-gold uppercase mb-1">Senha Gerada</label>
        <div className="w-full px-3 py-2.5 border border-gold/30 rounded-lg text-sm bg-primary font-bold tracking-widest text-center text-primary-foreground">
          {senha}
        </div>
      </div>

      {/* Validade */}
      <div>
        <label className="block text-[10px] font-bold text-gold uppercase mb-1">Validade</label>
        <select
          value={validade}
          onChange={(e) => setValidade(e.target.value)}
          className="w-full px-3 py-2.5 border border-gold/30 rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
        >
          <option value="90">90 dias</option>
          <option value="180">180 dias</option>
          <option value="365">365 dias (Plano Anual)</option>
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
          "Cadastrar Comercial"
        )}
      </button>
    </div>
  );
}
