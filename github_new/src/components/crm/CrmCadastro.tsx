import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface CrmCadastroProps {
  isOpen: boolean;
  onClose: () => void;
}

const CrmCadastro = ({ isOpen, onClose }: CrmCadastroProps) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', whatsapp: '', cpf_cnpj: '', mensagem: '' });

  const handleSubmit = async () => {
    if (!form.nome || !form.email) {
      toast({ title: 'Erro', description: 'Nome e email são obrigatórios.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // Send via mailto as a simple approach
      const subject = encodeURIComponent('Novo Cadastro CRM Elite 4.0');
      const body = encodeURIComponent(
        `NOME COMPLETO: ${form.nome}\nEMAIL: ${form.email}\nWHATSAPP: ${form.whatsapp}\nCPF/CNPJ: ${form.cpf_cnpj}\nMENSAGEM: ${form.mensagem}`
      );
      window.open(`mailto:lourencojunior.corretor@creci.org.br?subject=${subject}&body=${body}`, '_blank');
      toast({ title: 'Cadastro enviado!', description: 'Verifique seu email para completar.' });
      setForm({ nome: '', email: '', whatsapp: '', cpf_cnpj: '', mensagem: '' });
      onClose();
    } catch {
      toast({ title: 'Erro ao enviar', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastre-se no CRM Elite 4.0</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome Completo *</Label><Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} /></div>
          <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" /></div>
          <div><Label>CPF/CNPJ</Label><Input value={form.cpf_cnpj} onChange={e => setForm(p => ({ ...p, cpf_cnpj: e.target.value }))} /></div>
          <div><Label>Mensagem</Label><Textarea value={form.mensagem} onChange={e => setForm(p => ({ ...p, mensagem: e.target.value }))} rows={3} /></div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full">{loading ? 'Enviando...' : 'Enviar Cadastro'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CrmCadastro;
