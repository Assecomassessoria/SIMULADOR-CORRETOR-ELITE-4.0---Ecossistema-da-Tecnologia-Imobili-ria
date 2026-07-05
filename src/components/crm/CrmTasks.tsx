import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { fetchTasks as fetchTasksApi, insertTask, updateTask, deleteTask as deleteTaskApi } from '@/lib/crmApi';

interface CrmTasksProps {
  leads: any[];
}

const STATUS_MAP: Record<string, { label: string; icon: any; color: string }> = {
  pendente: { label: 'Pendente', icon: Clock, color: 'text-yellow-500' },
  em_andamento: { label: 'Em Andamento', icon: AlertCircle, color: 'text-blue-500' },
  concluida: { label: 'Concluída', icon: CheckCircle, color: 'text-green-500' },
};

const CrmTasks = ({ leads }: CrmTasksProps) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ titulo: '', descricao: '', responsavel: '', lead_id: '', status: 'pendente', data_vencimento: '' });

  const loadTasks = async () => {
    try {
      const data = await fetchTasksApi();
      setTasks(data);
    } catch (err) {
      console.warn('Erro ao carregar tarefas:', err);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const saveTask = async () => {
    if (!form.titulo.trim()) { toast({ title: 'Erro', description: 'Título obrigatório', variant: 'destructive' }); return; }
    const payload: any = { titulo: form.titulo, descricao: form.descricao, responsavel: form.responsavel, status: form.status };
    if (form.lead_id) payload.lead_id = form.lead_id;
    if (form.data_vencimento) payload.data_vencimento = new Date(form.data_vencimento).toISOString();

    try {
      await insertTask(payload);
      toast({ title: 'Tarefa criada!' });
      setFormOpen(false);
      setForm({ titulo: '', descricao: '', responsavel: '', lead_id: '', status: 'pendente', data_vencimento: '' });
      loadTasks();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateTask(id, { status });
      loadTasks();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTaskApi(id);
      loadTasks();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const getLeadName = (leadId: string) => leads.find(l => l.id === leadId)?.nome || '—';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Tarefas e Follow-ups</h3>
        <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4 mr-1" /> Nova Tarefa</Button>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 && <p className="text-center text-muted-foreground py-4">Nenhuma tarefa.</p>}
        {tasks.map(task => {
          const st = STATUS_MAP[task.status] || STATUS_MAP.pendente;
          const Icon = st.icon;
          return (
            <Card key={task.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${st.color} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{task.titulo}</p>
                  {task.descricao && <p className="text-xs text-muted-foreground truncate">{task.descricao}</p>}
                  <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                    {task.responsavel && <span>👤 {task.responsavel}</span>}
                    {task.lead_id && <span>📋 {getLeadName(task.lead_id)}</span>}
                    {task.data_vencimento && <span>📅 {new Date(task.data_vencimento).toLocaleDateString('pt-BR')}</span>}
                  </div>
                </div>
                <Select value={task.status} onValueChange={v => handleUpdateStatus(task.id, v)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(task.id)}><Trash2 className="w-4 h-4" /></Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
              <div><Label>Vencimento</Label><Input type="date" value={form.data_vencimento} onChange={e => setForm(p => ({ ...p, data_vencimento: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Lead Associado</Label>
              <Select value={form.lead_id} onValueChange={v => setForm(p => ({ ...p, lead_id: v }))}>
                <SelectTrigger><SelectValue placeholder="(Nenhum)" /></SelectTrigger>
                <SelectContent>
                  {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveTask} className="w-full">Criar Tarefa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CrmTasks;
