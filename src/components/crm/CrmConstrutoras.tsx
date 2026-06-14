import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import { fetchConstrutoras, insertConstrutora, updateConstrutora, deleteConstrutora } from '@/lib/crmApi';

const ESTAGIOS_OBRAS = [
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'fundacao', label: 'Fundação' },
  { value: 'estrutura', label: 'Estrutura' },
  { value: 'alvenaria', label: 'Alvenaria' },
  { value: 'acabamento', label: 'Acabamento' },
  { value: 'entregue', label: 'Entregue' },
];

const formatPhone = (value: string): string => {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 10) return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

const formatCNPJ = (value: string): string => {
  const clean = value.replace(/\D/g, '');
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

interface CrmConstrutorasProps {
  onRefresh?: () => void;
}

const CrmConstrutoras = ({ onRefresh }: CrmConstrutorasProps) => {
  const [construtoras, setConstrutoras] = useState<any[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome_empreendimento: '',
    email: '',
    whatsapp: '',
    cnpj: '',
    estagio_obras: 'planejamento',
    responsavel: '',
    link_empreendimento: '',
  });

  const loadData = useCallback(async () => {
    try {
      const data = await fetchConstrutoras();
      setConstrutoras(data);
    } catch (err) {
      console.error('Erro ao carregar construtoras:', err);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setForm({ nome_empreendimento: '', email: '', whatsapp: '', cnpj: '', estagio_obras: 'planejamento', responsavel: '', link_empreendimento: '' });
    setEditItem(null);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      nome_empreendimento: item.nome_empreendimento || '',
      email: item.email || '',
      whatsapp: item.whatsapp || '',
      cnpj: item.cnpj || '',
      estagio_obras: item.estagio_obras || 'planejamento',
      responsavel: item.responsavel || '',
      link_empreendimento: item.link_empreendimento || '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nome_empreendimento.trim()) {
      toast({ title: 'Erro', description: 'Nome do empreendimento é obrigatório.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      if (editItem?.id) {
        await updateConstrutora(editItem.id, form);
        toast({ title: 'Sucesso', description: 'Construtora atualizada!' });
      } else {
        await insertConstrutora(form);
        toast({ title: 'Sucesso', description: 'Construtora cadastrada!' });
      }
      loadData();
      onRefresh?.();
      setFormOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta construtora?')) return;
    try {
      await deleteConstrutora(id);
      toast({ title: 'Construtora excluída' });
      loadData();
      onRefresh?.();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <Building2 className="w-4 h-4" /> Construtoras / Empreendimentos
        </h3>
        <Button size="sm" className="gold-gradient text-primary font-semibold hover:opacity-90" onClick={() => { resetForm(); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Nova Construtora
        </Button>
      </div>

      {construtoras.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Nenhuma construtora cadastrada.</p>
      ) : (
        <div className="grid gap-2">
          {construtoras.map((c) => (
            <Card key={c.id} className="border border-border">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      <span className="text-primary font-bold mr-1">({c.ordem})</span>
                      {c.nome_empreendimento}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      {c.cnpj && <p>CNPJ: {c.cnpj}</p>}
                      {c.email && <p>Email: {c.email}</p>}
                      {c.whatsapp && <p>WhatsApp: {c.whatsapp}</p>}
                      <p>Estágio: {ESTAGIOS_OBRAS.find(e => e.value === c.estagio_obras)?.label || c.estagio_obras}</p>
                      {c.responsavel && <p>Responsável: {c.responsavel}</p>}
                      {c.link_empreendimento && <p>Link: <a href={c.link_empreendimento} target="_blank" rel="noopener noreferrer" className="text-primary underline">{c.link_empreendimento}</a></p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar Construtora' : 'Nova Construtora'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome Empreendimento *</Label>
              <Input value={form.nome_empreendimento} onChange={e => setForm(p => ({ ...p, nome_empreendimento: e.target.value }))} placeholder="Nome do empreendimento" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: formatPhone(e.target.value) }))} placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>CNPJ</Label>
                <Input value={form.cnpj} onChange={e => setForm(p => ({ ...p, cnpj: formatCNPJ(e.target.value) }))} placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <Label>Estágio Obras</Label>
                <Select value={form.estagio_obras} onValueChange={v => setForm(p => ({ ...p, estagio_obras: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESTAGIOS_OBRAS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Responsável</Label>
              <Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} placeholder="Nome do responsável" />
            </div>
            <div>
              <Label>Link do Empreendimento</Label>
              <Input value={form.link_empreendimento} onChange={e => setForm(p => ({ ...p, link_empreendimento: e.target.value }))} placeholder="https://..." />
            </div>
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? 'Salvando...' : (editItem ? 'Atualizar' : 'Cadastrar')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CrmConstrutoras;
