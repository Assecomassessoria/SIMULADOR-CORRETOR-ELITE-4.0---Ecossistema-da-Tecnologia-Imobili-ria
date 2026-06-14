import { useState } from "react";
import { Shield, X } from "lucide-react";

interface LgpdPanelProps {
  externalOpen?: boolean;
  onExternalClose?: () => void;
  hideButton?: boolean;
}

export default function LgpdPanel({ externalOpen, onExternalClose, hideButton }: LgpdPanelProps = {}) {
  const [open, setOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : open;
  const handleClose = () => {
    setOpen(false);
    onExternalClose?.();
  };

  return (
    <>
      {!hideButton && (
        <button
          onClick={() => setOpen(!open)}
          className={`fixed bottom-3 right-3 z-50 px-3 py-2 rounded shadow-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors min-w-[120px] justify-center ${
            isOpen
              ? "bg-gold text-primary border border-gold"
              : "bg-primary border border-gold/30 text-gold hover:bg-primary/80"
          }`}
        >
          <Shield className="w-3 h-3" />
          LGPD
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={handleClose}>
          <div
            className="bg-card border-2 border-gold/40 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-5 space-y-4 text-sm text-foreground/90 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gold" />
                <h2 className="text-base font-bold text-primary">LGPD</h2>
              </div>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-muted-foreground italic text-xs">
              Este é um modelo estruturado de Termos e Condições de Uso focado no relacionamento entre a Informetec e o
              Corretor de Imóveis. Ele foi desenhado para proteger sua propriedade intelectual e garantir que as
              responsabilidades sobre os dados (LGPD) estejam claras, evitando "promessas vazias" e garantindo segurança
              jurídica.
            </p>

            <h3 className="text-base font-bold text-primary text-center">TERMOS E CONDIÇÕES DE USO</h3>
            <p className="text-center font-semibold text-primary/80">SIMULADOR CORRETOR DE ELITE 4.0 + CRM</p>
            <p>
              Este documento estabelece as regras para o uso das plataformas desenvolvidas pela{" "}
              <strong>INFORMETEC TECNOLOGIA EM INFORMAÇÕES MERCANTIS SC LTDA</strong>, inscrita no CNPJ
              00.921.557/0001-65, contato contatoapps@simuladorcorretorelite.com.br doravante denominada apenas como
              INFORMETEC.
            </p>

            <h4 className="font-bold text-primary">1. OBJETO E LICENÇA DE USO</h4>
            <p>
              A INFORMETEC concede ao usuário (Corretor de Imóveis devidamente registrado) uma licença de uso limitada,
              pessoal, intransferível e revogável dos softwares SIMULADOR CORRETOR DE ELITE 4.0 e CRM DE VENDAS
              INTELIGENTE.
            </p>
            <p>
              O sistema é uma ferramenta de apoio à venda e gestão, não constituindo garantia de fechamento de negócio
              ou consultoria financeira/jurídica vinculante.
            </p>

            <h4 className="font-bold text-primary">2. PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD)</h4>
            <p>Em conformidade com a Lei nº 13.709/2018 (LGPD), as partes estabelecem que:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>A INFORMETEC é Operadora:</strong> Realiza o tratamento de dados pessoais (leads e clientes do
                corretor) estritamente para fins de armazenamento e processamento técnico dentro do CRM.
              </li>
              <li>
                <strong>O CORRETOR é Controlador:</strong> É o único responsável pela coleta lícita dos dados de seus
                clientes, pela base legal utilizada e por atender às solicitações de seus titulares de dados.
              </li>
              <li>
                <strong>Segurança:</strong> A INFORMETEC compromete-se a manter medidas técnicas e administrativas aptas
                a proteger os dados de acessos não autorizados ou situações acidentais de destruição ou perda.
              </li>
            </ul>

            <h4 className="font-bold text-primary">3. RESPONSABILIDADES DO USUÁRIO (CORRETOR)</h4>
            <p>O Corretor compromete-se a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fornecer informações verídicas e manter seus dados cadastrais atualizados.</li>
              <li>Zelar pelo sigilo de sua senha de acesso, não a compartilhando com terceiros.</li>
              <li>
                Utilizar o Simulador de forma ética, deixando claro ao cliente final que os resultados são projeções
                baseadas nos dados inseridos e nas condições de mercado vigentes.
              </li>
              <li>
                Não realizar "promessas vazias": O corretor entende que o software é um facilitador de cálculos e
                organização, e que a responsabilidade final pela negociação é humana e técnica do profissional.
              </li>
            </ul>

            <h4 className="font-bold text-primary">4. PROPRIEDADE INTELECTUAL</h4>
            <p>
              Todo o conteúdo, algoritmos de cálculo, interface, design e códigos-fonte dos sites
              simuladorcorretorelite.com.br e assecomassessoria.net.br são de propriedade exclusiva da INFORMETEC. É
              proibida qualquer tentativa de engenharia reversa, cópia ou reprodução total ou parcial sem autorização
              expressa.
            </p>

            <h4 className="font-bold text-primary">5. LIMITAÇÃO DE RESPONSABILIDADE</h4>
            <p>A INFORMETEC não será responsável por:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Prejuízos decorrentes de falhas na conexão de internet do usuário.</li>
              <li>Decisões de negócios tomadas pelo Corretor ou seus clientes com base nas simulações.</li>
              <li>Mau uso da plataforma que resulte em exposição de dados por parte do Corretor.</li>
            </ul>

            <h4 className="font-bold text-primary">6. CANCELAMENTO E ACESSO</h4>
            <p>
              A INFORMETEC reserva-se o direito de suspender ou cancelar o acesso do usuário em caso de violação destes
              termos, uso indevido do sistema ou inadimplência, garantindo sempre a possibilidade de exportação dos
              dados do CRM pelo corretor antes da exclusão definitiva.
            </p>

            <h4 className="font-bold text-primary">7. FORO</h4>
            <p>
              As partes elegem o Foro da Comarca de domicílio da INFORMETEC para dirimir quaisquer dúvidas oriundas
              deste termo, com renúncia expressa a qualquer outro.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
