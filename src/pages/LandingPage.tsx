import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatWidget from "@/components/ChatWidget";
import LgpdPanel from "@/components/LgpdPanel";
import {
  Calculator,
  Shield,
  Zap,
  CheckCircle2,
  Star,
  Download,
  Phone,
  Mail,
  ArrowRight,
  Smartphone,
  Play,
  ImageIcon,
  Clock,
  Users,
  TrendingUp,
  Award,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const PRODUCT_PRICE = "R$ 79,90";
const PRODUCT_PRICE_ORIGINAL = "R$ 419,40";

const LandingPage = () => {
  const navigate = useNavigate();
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [lgpdOpen, setLgpdOpen] = useState(false);
  const [leadData, setLeadData] = useState({ name: "", whatsapp: "", email: "", city: "" });

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Cadastro realizado com sucesso! Entraremos em contato.");
    setShowLeadForm(false);
    setLeadData({ name: "", whatsapp: "", email: "", city: "" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 elite-gradient border-b-2 border-gold/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/pwa-icon-192.png" alt="Elite" className="w-10 h-10 rounded" />
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-wider uppercase text-gold">
                Corretor de Elite 4.0
              </h1>
              <p className="text-[10px] tracking-[3px] uppercase text-gold/50">Vendas Seguras</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gold/70">
            <a href="#features" className="hover:text-gold transition">
              Recursos
            </a>
            <a href="#sistemas" className="hover:text-gold transition">
              Sistemas
            </a>
            <a href="#pricing" className="hover:text-gold transition">
              Oferta
            </a>
            <a href="#download" className="hover:text-gold transition">
              Baixar
            </a>
            <a href="#contact" className="hover:text-gold transition">
              FALE CONOSCO
            </a>
            <span className="text-gold/40">-</span>
            <a
              href="https://simuladorcorretoreleite.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold transition font-bold text-gold"
            >
              ADQUIRIR LICENÇA
            </a>
          </div>
          <Button onClick={() => navigate("/")} size="sm" className="bg-gold text-navy hover:bg-gold-bright font-bold">
            Acessar Simulador
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 elite-gradient opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(42_60%_55%/0.15),_transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs font-semibold mb-6">
              <Star className="w-3.5 h-3.5 fill-gold" />
              FERRAMENTA #1 DO CORRETOR IMOBILIÁRIO
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold text-gold leading-tight mb-6">
              Simule. Convença.
              <br />
              <span className="gold-text">Venda.</span>
            </h2>
            <p className="text-lg md:text-xl text-gold/70 mb-8 max-w-2xl">
              O simulador mais completo do mercado imobiliário. Apresente cenários reais de financiamento e feche mais
              vendas com confiança e precisão profissional.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-gold text-navy hover:bg-gold-bright font-bold text-base px-8 gap-2"
                onClick={() => setShowLeadForm(true)}
              >
                Garantir Minha Licença <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gold/40 text-gold hover:bg-gold/10 font-bold text-base px-8"
                onClick={() => navigate("/")}
              >
                Testar Demonstração
              </Button>
            </div>
            <div className="flex items-center gap-6 mt-8 text-gold/50 text-sm">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-gold" /> Licença Vitalícia
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-gold" /> Sem Mensalidade
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-gold" /> Funciona Offline
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Exposição de Motivos */}
      <section id="features" className="py-16 md:py-24 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            Por que o <span className="text-accent">Corretor de Elite</span>?
          </h3>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Não é apenas um simulador de parcelas. É a ferramenta que mostra o cenário real para o cliente, com precisão
            de cálculos que transmite confiança e fecha vendas.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 border-accent/20 hover:border-accent/50 transition hover:shadow-lg group">
              <Calculator className="w-12 h-12 text-accent mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-xl font-bold mb-3">Precisão Total</h4>
              <p className="text-muted-foreground text-sm">
                Cálculos exatos de financiamento com tabelas SAC e PRICE atualizadas. Sem margem para erro.
              </p>
            </Card>
            <Card className="p-6 border-accent/20 hover:border-accent/50 transition hover:shadow-lg group">
              <Shield className="w-12 h-12 text-accent mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-xl font-bold mb-3">Venda Segura</h4>
              <p className="text-muted-foreground text-sm">
                Simulações que demonstram o cenário real ao cliente, eliminando surpresas e gerando confiança.
              </p>
            </Card>
            <Card className="p-6 border-accent/20 hover:border-accent/50 transition hover:shadow-lg group">
              <Zap className="w-12 h-12 text-accent mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-xl font-bold mb-3">Rapidez na Venda</h4>
              <p className="text-muted-foreground text-sm">
                Simule financiamentos em segundos. Feche mais vendas em menos tempo com eficiência máxima.
              </p>
            </Card>
            <Card className="p-6 border-accent/20 hover:border-accent/50 transition hover:shadow-lg group">
              <TrendingUp className="w-12 h-12 text-accent mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-xl font-bold mb-3">Gestão Completa</h4>
              <p className="text-muted-foreground text-sm">
                Dashboard integrado para acompanhar suas vendas, metas e performance em tempo real.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Saiba Mais - Sistemas */}
      <section id="sistemas" className="py-16 md:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold mb-12 text-center">Sistemas de Simulação Avançados</h3>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h4 className="text-2xl font-bold mb-4 text-accent">Pró-Soluto</h4>
              <p className="text-muted-foreground mb-6">
                Sistema de simulação completo que calcula financiamentos com base nos critérios atualizados das
                instituições financeiras. Inclui análise de capacidade de pagamento e simulações de diferentes cenários.
              </p>
              <ul className="space-y-3">
                {["Cálculos em tempo real", "Múltiplas instituições", "Análise de viabilidade"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-2xl font-bold mb-4 text-accent">Pró-Solvendo</h4>
              <p className="text-muted-foreground mb-6">
                Solução avançada para análise de fluxo de caixa e solvabilidade. Permite ao corretor demonstrar ao
                cliente exatamente como será o impacto da parcela no orçamento mensal.
              </p>
              <ul className="space-y-3">
                {["Análise de fluxo de caixa", "Relatórios profissionais", "Simulações comparativas"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Licença Vitalícia */}
      <section id="pricing" className="py-16 md:py-24 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold mb-12 text-center">Licença Vitalícia</h3>
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 border-accent/30 bg-gradient-to-br from-card to-background relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                PRÉ-LANÇAMENTO
              </div>
              <div className="text-center mb-8">
                <h4 className="text-2xl font-bold mb-2">Acesso Ilimitado</h4>
                <p className="text-muted-foreground mb-6">
                  Uma única compra, acesso vitalício. Sem mensalidades, sem renovações.
                </p>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "Acesso vitalício ao simulador",
                  "Atualizações automáticas incluídas",
                  "Suporte técnico dedicado",
                  "Funciona offline como app (PWA)",
                  "Simulações ilimitadas",
                  "Dashboard de gestão de vendas",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="text-center border-t border-border pt-6">
                <p className="text-sm text-muted-foreground mb-1 line-through">{PRODUCT_PRICE_ORIGINAL}</p>
                <p className="text-5xl font-extrabold text-accent mb-1">{PRODUCT_PRICE}</p>
                <p className="text-sm text-muted-foreground mb-6">Oferta de pré-lançamento até 28/02/2026</p>
                <Button
                  size="lg"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg py-6 gap-2"
                  onClick={() => setShowLeadForm(true)}
                >
                  Garantir Minha Licença <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Galeria de Imagens */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            <ImageIcon className="inline w-8 h-8 mr-2 text-accent" />
            Galeria do Simulador
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              "Tela de Simulação",
              "Dashboard de Vendas",
              "Pró-Soluto",
              "Gestão de Clientes",
              "Relatórios",
              "Configurações",
            ].map((title, i) => (
              <Card key={i} className="overflow-hidden border-accent/10 hover:border-accent/40 transition group">
                <div className="aspect-video bg-gradient-to-br from-navy to-primary flex items-center justify-center">
                  <div className="text-center">
                    <Calculator className="w-8 h-8 text-gold/40 mx-auto mb-2 group-hover:text-gold/70 transition" />
                    <p className="text-gold/40 text-xs group-hover:text-gold/70 transition">{title}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <p className="text-center text-muted-foreground text-sm mt-6">
            Imagens ilustrativas das principais telas do simulador
          </p>
        </div>
      </section>

      {/* Vídeos Demonstrativos */}
      <section className="py-16 md:py-24 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            <Play className="inline w-8 h-8 mr-2 text-accent" />
            Vídeos Demonstrativos
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Visão Geral", desc: "Conheça todas as funcionalidades" },
              { title: "Simulação Rápida", desc: "Como simular em 30 segundos" },
              { title: "Gestão de Vendas", desc: "Controle total das suas vendas" },
            ].map((video, i) => (
              <Card
                key={i}
                className="overflow-hidden border-accent/10 hover:border-accent/40 transition group cursor-pointer"
              >
                <div className="aspect-video bg-gradient-to-br from-navy to-primary flex items-center justify-center relative">
                  <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center group-hover:bg-gold/40 transition">
                    <Play className="w-8 h-8 text-gold fill-gold" />
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold">{video.title}</h4>
                  <p className="text-sm text-muted-foreground">{video.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Baixar o APP */}
      <section id="download" className="py-16 md:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            <Smartphone className="inline w-8 h-8 mr-2 text-accent" />
            Baixe como Aplicativo
          </h3>
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 border-accent/20">
              <h4 className="text-xl font-bold mb-2 text-center">Instale no seu celular 📲</h4>
              <p className="text-muted-foreground mb-8 text-center">
                Salve o Simulador Elite como um aplicativo no seu celular para acesso rápido durante plantões e visitas
                aos clientes.
              </p>
              <div className="space-y-6">
                <div>
                  <h5 className="font-bold mb-3">📱 No iPhone (iOS):</h5>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Abra o Safari e acesse o site</li>
                    <li>Toque no botão Compartilhar</li>
                    <li>Selecione "Adicionar à Tela de Início"</li>
                    <li>Confirme e pronto! O app estará no seu celular</li>
                  </ol>
                </div>
                <div className="border-t border-border pt-6">
                  <h5 className="font-bold mb-3">🤖 No Android:</h5>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Abra o Chrome e acesse o site</li>
                    <li>Toque no menu (três pontos)</li>
                    <li>Selecione "Instalar app"</li>
                    <li>Confirme e acesse como um aplicativo nativo</li>
                  </ol>
                </div>
              </div>
              <div className="mt-8 p-4 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Dica:</strong> O app funciona offline! Você pode usar o simulador mesmo sem conexão com a
                  internet.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Números / Social Proof */}
      <section className="py-16 elite-gradient">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Users, value: "500+", label: "Corretores Ativos" },
              { icon: Calculator, value: "10.000+", label: "Simulações Feitas" },
              { icon: Clock, value: "30s", label: "Tempo Médio" },
              { icon: Award, value: "98%", label: "Satisfação" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label}>
                <Icon className="w-8 h-8 text-gold/60 mx-auto mb-2" />
                <p className="text-3xl md:text-4xl font-extrabold text-gold">{value}</p>
                <p className="text-gold/50 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md animate-fade-in">
            <div className="p-6">
              <h4 className="text-2xl font-bold mb-2">Garanta Sua Licença</h4>
              <p className="text-sm text-muted-foreground mb-6">
                Preencha seus dados para finalizar a compra por apenas{" "}
                <strong className="text-accent">{PRODUCT_PRICE}</strong>
              </p>
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="lead-name">Nome Completo *</Label>
                  <Input
                    id="lead-name"
                    placeholder="Seu nome"
                    value={leadData.name}
                    onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lead-whatsapp">WhatsApp *</Label>
                  <Input
                    id="lead-whatsapp"
                    placeholder="(11) 99999-9999"
                    value={leadData.whatsapp}
                    onChange={(e) => setLeadData({ ...leadData, whatsapp: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lead-email">Email *</Label>
                  <Input
                    id="lead-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={leadData.email}
                    onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lead-city">Cidade *</Label>
                  <Input
                    id="lead-city"
                    placeholder="São Paulo"
                    value={leadData.city}
                    onChange={(e) => setLeadData({ ...leadData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowLeadForm(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
                  >
                    Confirmar Compra
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer id="contact" className="elite-gradient text-gold py-12 border-t-2 border-gold/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4 text-gold">Contato</h4>
              <p className="mb-2 text-gold/70 flex items-center gap-2">
                <Phone className="w-4 h-4" /> (11) 94677-0625
              </p>
              <p className="mb-2 text-gold/70 flex items-center gap-2">
                <Mail className="w-4 h-4" /> contatoapps@simuladorcorretorelite.com.br
              </p>
              <p className="text-sm text-gold/40">CRECI/SP 237.626-F</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gold">Empresa</h4>
              <p className="mb-2 text-gold/70">Informetec Tecnologia em Informações</p>
              <p className="text-sm text-gold/40">Soluções para o mercado imobiliário</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gold">Redes Sociais</h4>
              <div className="flex gap-4">
                <a href="#" className="text-gold/50 hover:text-gold transition">
                  Facebook
                </a>
                <a href="#" className="text-gold/50 hover:text-gold transition">
                  Instagram
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gold/20 pt-8 text-center text-sm text-gold/40">
            <div className="flex items-center justify-center gap-4 mb-3">
              <button
                onClick={() => setLgpdOpen(true)}
                className="text-gold/70 hover:text-gold underline underline-offset-2 transition"
              >
                LGPD e Termos de Uso
              </button>
            </div>
            <p>&copy; 2026 Simulador Corretor de Elite 4.0. Todos os direitos reservados.</p>
            <p className="mt-1">
              Desenvolvido por <strong>INFOMORMETEC - Tecnologia em Infomrações </strong> |{" "}
              <strong>RODRIGO DIAS</strong> - Gestão TI Contato: contatoapps@simuladorcorretorelite.com.br - Telefone
              (11)92205-2470 - Whatsapp (11)920024853
            </p>
          </div>
        </div>{" "}
        {/* Fecha a div interna do rodapé, se houver, ou a div principal */}
      </footer>

      {/* O ChatWidget deve ficar aqui, fora do footer mas dentro da div principal se houver uma */}
      <ChatWidget />
      <LgpdPanel externalOpen={lgpdOpen} onExternalClose={() => setLgpdOpen(false)} hideButton />
    </div>
  );
};

export default LandingPage;
