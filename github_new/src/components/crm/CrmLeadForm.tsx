import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { getUserEmail } from "@/lib/eliteUtils";
import { insertLead, updateLead, fetchConstrutoras } from "@/lib/crmApi";
import { dispatchLeadToCrms } from "@/lib/crmWebhooks";

interface CrmLeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editLead?: any;
}

const ESTAGIOS = [
  { value: "prospeccao", label: "Prospecção" },
  { value: "qualificacao", label: "Qualificação" },
  { value: "proposta", label: "Proposta" },
  { value: "negociacao", label: "Negociação" },
  { value: "fechado_ganho", label: "Fechado (Ganho)" },
  { value: "fechado_perdido", label: "Fechado (Perdido)" },
];

const ORIGENS = [
  { value: "manual", label: "Manual" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook Ads" },
  { value: "instagram", label: "Instagram Ads" },
  { value: "indicacao", label: "Indicação" },
  { value: "site", label: "Site" },
];

const formatCPFCNPJ = (value: string): string => {
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
};

const formatPhone = (value: string): string => {
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 10) return clean.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return clean.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

const CrmLeadForm = ({ isOpen, onClose, onSaved, editLead }: CrmLeadFormProps) => {
  const [loading, setLoading] = useState(false);
  const [construtoras, setConstrutoras] = useState<any[]>([]);

  useEffect(() => {
    fetchConstrutoras()
      .then(setConstrutoras)
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    nome: editLead?.nome || "",
    email: editLead?.email || "",
    whatsapp: editLead?.whatsapp || "",
    cpf_cnpj: editLead?.cpf_cnpj || "",
    mensagem: editLead?.mensagem || "",
    estagio: editLead?.estagio || "prospeccao",
    origem: editLead?.origem || "manual",
    responsavel: editLead?.responsavel || "",
    valor_negociacao: editLead?.valor_negociacao || 0,
    notas: editLead?.notas || "",
    construtora_id: editLead?.construtora_id || "",
  });

  const handleChange = (field: string, value: string | number) => {
    if (field === "cpf_cnpj") value = formatCPFCNPJ(value as string);
    if (field === "whatsapp") value = formatPhone(value as string);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.nome.trim()) {
      toast({ title: "Erro", description: "Nome é obrigatório.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        created_by: getUserEmail() || "unknown",
        valor_negociacao: Number(form.valor_negociacao) || 0,
        construtora_id: form.construtora_id === "none" ? null : form.construtora_id || null,
      };

      if (editLead?.id) {
        await updateLead(editLead.id, payload);
        void dispatchLeadToCrms(payload, "lead.updated");
        toast({ title: "Sucesso", description: "Lead atualizado!" });
      } else {
        await insertLead(payload);
        void dispatchLeadToCrms(payload, "lead.created");
        toast({ title: "Sucesso", description: "Lead cadastrado!" });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("unique_cpf_cnpj")) {
        toast({ title: "⚠️ Cliente Cadastrado", description: "CPF/CNPJ já existe no CRM.", variant: "destructive" });
      } else if (msg.includes("unique_whatsapp")) {
        toast({ title: "⚠️ Cliente Cadastrado", description: "WhatsApp já existe no CRM.", variant: "destructive" });
      } else if (msg.includes("unique_email_lead")) {
        toast({ title: "⚠️ Cliente Cadastrado", description: "Email já existe no CRM.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">{editLead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome Completo *</Label>
            <Input
              value={form.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Nome do lead"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input
                value={form.whatsapp}
                onChange={(e) => handleChange("whatsapp", e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CPF/CNPJ</Label>
              <Input
                value={form.cpf_cnpj}
                onChange={(e) => handleChange("cpf_cnpj", e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <Label>Valor Negociação (R$)</Label>
              <Input
                type="number"
                value={form.valor_negociacao}
                onChange={(e) => handleChange("valor_negociacao", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Estágio</Label>
              <Select value={form.estagio} onValueChange={(v) => handleChange("estagio", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTAGIOS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Origem</Label>
              <Select value={form.origem} onValueChange={(v) => handleChange("origem", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGENS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Responsável</Label>
            <Input
              value={form.responsavel}
              onChange={(e) => handleChange("responsavel", e.target.value)}
              placeholder="Nome do responsável"
            />
          </div>
          <div>
            <Label>Mensagem</Label>
            <div className="flex gap-2 mb-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  const now = new Date();
                  const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
                  const prefix = `${dateStr}: `;
                  const current = form.mensagem;
                  handleChange("mensagem", current ? `${prefix}\n${current}` : prefix);
                }}
              >
                + Data Atual
              </Button>
            </div>
            <Textarea
              value={form.mensagem}
              onChange={(e) => handleChange("mensagem", e.target.value)}
              placeholder="DD/MM/AAAA: Observações do lead"
              rows={4}
            />
          </div>
          <div>
            <Label>Notas Internas</Label>
            <Textarea
              value={form.notas}
              onChange={(e) => handleChange("notas", e.target.value)}
              placeholder="Notas internas"
              rows={2}
            />
          </div>
          <div>
            <Label>Construtora / Empreendimento</Label>
            <Select value={form.construtora_id} onValueChange={(v) => handleChange("construtora_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {construtoras.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    ({c.ordem}) {c.nome_empreendimento}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-lg gold-gradient text-primary font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
          >
            {loading ? "Salvando..." : editLead ? "Atualizar Lead" : "Cadastrar Lead"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CrmLeadForm;
