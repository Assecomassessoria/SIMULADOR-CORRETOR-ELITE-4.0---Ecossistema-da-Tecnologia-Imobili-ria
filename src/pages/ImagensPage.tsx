import { useState } from 'react';
import { ArrowLeft, X, ZoomIn, Images } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const galeria = [
  { src: '/IMAGENS/01-login.png', label: '01 — Tela de Login' },
  { src: '/IMAGENS/02-simulacao-topo.png', label: '02 — Simulação (topo)' },
  { src: '/IMAGENS/03-simulacao-botoes.png', label: '03 — Simulação (botões)' },
  { src: '/IMAGENS/04-prosoluto-topo.png', label: '04 — Pró Soluto (topo)' },
  { src: '/IMAGENS/05-prosoluto-opcoes.png', label: '05 — Pró Soluto (opções)' },
  { src: '/IMAGENS/06-prosoluto-botoes.png', label: '06 — Pró Soluto (botões)' },
  { src: '/IMAGENS/07-gestao-lista.png', label: '07 — Gestão (lista)' },
  { src: '/IMAGENS/08-ficha-cadastral-topo.png', label: '08 — Ficha Cadastral (topo)' },
  { src: '/IMAGENS/09-ficha-cadastral-botoes.png', label: '09 — Ficha Cadastral (botões)' },
  { src: '/IMAGENS/10-dashboard.png', label: '10 — Painel de Controle' },
  { src: '/IMAGENS/11-crm-construtoras.png', label: '11 — CRM Construtoras' },
  { src: '/IMAGENS/12-crm-leads.png', label: '12 — Leads de CRM' },
  { src: '/IMAGENS/13-crm-kanban.png', label: '13 — CRM Kanban' },
  { src: '/IMAGENS/14-crm-tarefas.png', label: '14 — Tarefas de CRM' },
  { src: '/IMAGENS/15-crm-relatorios.png', label: '15 — Relatórios de CRM' },
];

export default function ImagensPage() {
  const navigate = useNavigate();
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ background: 'hsl(220 70% 8%)' }}>
      {/* Toolbar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b" style={{ background: 'hsl(220 70% 10%)', borderColor: 'hsl(42 60% 55% / 0.2)' }}>
        <button onClick={() => navigate('/apresentacao')} className="flex items-center gap-1 text-xs" style={{ color: 'hsl(42 60% 55%)' }}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex items-center gap-2">
          <Images className="w-4 h-4" style={{ color: 'hsl(42 60% 55%)' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'hsl(42 60% 55%)' }}>
            Galeria de Imagens — {galeria.length} screenshots
          </span>
        </div>
        <div className="w-16" />
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {galeria.map((img, i) => (
            <button
              key={i}
              onClick={() => setLightbox(i)}
              className="group rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl"
              style={{ background: 'hsl(220 70% 12%)', border: '1px solid hsl(42 60% 55% / 0.15)' }}
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={img.src}
                  alt={img.label}
                  className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden absolute inset-0 flex items-center justify-center" style={{ background: 'hsl(220 70% 14%)' }}>
                  <span className="text-xs" style={{ color: 'hsl(42 60% 55% / 0.4)' }}>Imagem não encontrada</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'hsl(220 70% 8% / 0.5)' }}>
                  <ZoomIn className="w-8 h-8" style={{ color: 'hsl(42 60% 55%)' }} />
                </div>
              </div>
              <div className="px-3 py-2">
                <p className="text-xs font-bold truncate" style={{ color: 'hsl(42 60% 55%)' }}>{img.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'hsl(220 70% 4% / 0.95)' }}
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" style={{ color: 'hsl(42 60% 55%)' }} />
          </button>

          <div className="flex items-center gap-4 max-w-[90vw] max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(Math.max(0, lightbox - 1))}
              disabled={lightbox === 0}
              className="p-2 rounded-full disabled:opacity-20 hover:bg-white/10 transition-colors text-2xl font-bold"
              style={{ color: 'hsl(42 60% 55%)' }}
            >
              ‹
            </button>

            <div className="flex flex-col items-center gap-3">
              <img
                src={galeria[lightbox].src}
                alt={galeria[lightbox].label}
                className="max-w-[80vw] max-h-[75vh] rounded-xl shadow-2xl object-contain"
                style={{ border: '2px solid hsl(42 60% 55% / 0.2)' }}
              />
              <p className="text-sm font-bold" style={{ color: 'hsl(42 60% 55%)' }}>
                {galeria[lightbox].label}
              </p>
            </div>

            <button
              onClick={() => setLightbox(Math.min(galeria.length - 1, lightbox + 1))}
              disabled={lightbox === galeria.length - 1}
              className="p-2 rounded-full disabled:opacity-20 hover:bg-white/10 transition-colors text-2xl font-bold"
              style={{ color: 'hsl(42 60% 55%)' }}
            >
              ›
            </button>
          </div>

          {/* Thumbnails */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 overflow-x-auto max-w-[90vw] px-2 py-1">
            {galeria.map((img, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setLightbox(i); }}
                className="flex-shrink-0 w-12 h-8 rounded overflow-hidden transition-all"
                style={{
                  border: i === lightbox ? '2px solid hsl(42 60% 55%)' : '1px solid hsl(42 60% 55% / 0.2)',
                  opacity: i === lightbox ? 1 : 0.5,
                }}
              >
                <img src={img.src} alt="" className="w-full h-full object-cover object-top" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
