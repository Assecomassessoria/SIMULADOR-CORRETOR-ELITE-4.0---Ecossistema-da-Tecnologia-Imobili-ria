import { Printer, Download, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ManualPage = () => {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Botões de ação - não aparecem na impressão */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex-1" />
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" /> Salvar como PDF / Imprimir
        </button>
      </div>

      {/* Conteúdo do Manual */}
      <div className="max-w-3xl mx-auto px-6 py-10 print:px-4 print:py-2">
        {/* Capa */}
        <div className="text-center mb-12 print:mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-wider text-gray-900 mb-2">Manual Completo</h1>
          <h2 className="text-xl font-semibold text-amber-600 mb-1">Simulador Corretor de Elite 4.0</h2>
          <p className="text-sm text-gray-500">Venda Segura — Informetec</p>
          <p className="text-xs text-gray-400 mt-2">Gerado em: {new Date().toLocaleDateString("pt-BR")}</p>
          <hr className="mt-6 border-amber-300" />
        </div>

        {/* Índice */}
        <section className="mb-10">
          <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-1">📋 Índice</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Visão Geral do Sistema</li>
            <li>Acesso e Senhas</li>
            <li>Tela de Login</li>
            <li>Simulação Técnica</li>
            <li>Integração CAIXA SIMULADOR</li>
            <li>Pró Soluto</li>
            <li>Dashboard</li>
            <li>Gestão de Vendas</li>
            <li>Painel Administrativo</li>
            <li>Licenciamento e Ativação</li>
            <li>Contato e Suporte</li>
          </ol>
        </section>

        {/* 1. Visão Geral */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">1. Visão Geral do Sistema</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            O <strong>Simulador Corretor de Elite 4.0</strong> é uma ferramenta profissional para corretores
            imobiliários que permite simular financiamentos habitacionais, calcular valores de pró-soluto, gerenciar
            vendas e visualizar dashboards com dados da simulação. O sistema possui versão DEMO (gratuita com
            limitações) e versão FULL (licenciada com todas as funcionalidades).
          </p>
        </section>

        {/* 2. Acesso e Senhas */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">2. Acesso e Senhas</h3>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
            <p className="font-bold text-red-600 mb-3">⚠️ CONFIDENCIAL — Não compartilhe estas informações</p>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-amber-300">
                  <th className="py-1 text-gray-700">Função</th>
                  <th className="py-1 text-gray-700">Senha</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 font-mono text-xs">
                <tr className="border-b border-amber-100">
                  <td className="py-2">Demo (acesso demonstração)</td>
                  <td className="py-2 font-bold">#Lou@472370</td>
                </tr>
                <tr className="border-b border-amber-100">
                  <td className="py-2">Painel Admin (Manutenção Dados)</td>
                  <td className="py-2 font-bold text-amber-700">Solicite ao gestor</td>
                </tr>
                <tr className="border-b border-amber-100">
                  <td className="py-2">Painel DEMOADM (Cadastro)</td>
                  <td className="py-2 font-bold">#Lou472370@56</td>
                </tr>
                <tr className="border-b border-amber-100">
                  <td className="py-2">Senha Master (Licenciamento)</td>
                  <td className="py-2 font-bold">072.801.868.310</td>
                </tr>
                <tr>
                  <td className="py-2">Senhas de licença (temporárias)</td>
                  <td className="py-2 font-bold">Formato ELITE-XXXXXXXX</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Tela de Login */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">3. Tela de Login</h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-2">A tela de login oferece as seguintes opções:</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>
              <strong>Campo de senha:</strong> Aceita senha demo, senha ELITE-XXXXXXXX (licença) ou Senha Master
            </li>
            <li>
              <strong>Adquira Licença:</strong> Link para aquisição da versão completa
            </li>
            <li>
              <strong>Fale Conosco:</strong> Formulário de contato com campos Nome, WhatsApp, Email, CRECI, Cidade e
              Mensagem
            </li>
            <li>
              <strong>Senhas ELITE:</strong> Permitem acesso temporário validado com exibição dos dias restantes
            </li>
            <li>
              <strong>Alerta de expiração:</strong> Aparece quando restam 3 dias ou menos para vencer
            </li>
          </ul>
        </section>

        {/* 4. Simulação Técnica */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">4. Simulação Técnica</h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            Aba principal do sistema. Permite simular financiamentos com os seguintes campos:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Valor de Avaliação e Valor de Venda da CAIXA</li>
            <li>Aprovação do cliente (valor financiado)</li>
            <li>FGTS e Subsídios</li>
            <li>Parcelas intermediárias, obras, chaves</li>
            <li>Sinal e condições de entrada</li>
            <li>Cálculo automático de entrada para a construtora</li>
            <li>Data de simulação e validade automática (5 dias)</li>
          </ul>
        </section>

        {/* 5. Integração CAIXA SIMULADOR */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">5. Integração CAIXA SIMULADOR</h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            O sistema possui <strong>dois botões</strong> para acesso ao simulador da Caixa:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>
              <strong>Botão no topo:</strong> Abre o site da CAIXA diretamente em nova aba (acesso rápido)
            </li>
            <li>
              <strong>Botão na seção "Simulação Técnica":</strong> Exibe alerta de orientação, ativa mensagem
              "Aguardando dados da simulação..." e abre em nova aba. Ao retornar, o corretor clica em "Já preenchi os
              dados" para continuar
            </li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">URL: https://simuladorhabitacao.caixa.gov.br/simulacao</p>
        </section>

        {/* 6. Pró Soluto */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">6. Pró Soluto</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Calculadora de parcelas pró-soluto. Permite simular parcelamentos com valores de entrada, número de parcelas
            e taxas, gerando um resumo detalhado dos valores a serem pagos pelo cliente diretamente à construtora.
          </p>
        </section>

        {/* 7. Dashboard */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">7. Dashboard</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Visualização gráfica dos dados da simulação atual, incluindo: financiamento, FGTS, subsídios, entrada,
            sinal, intermediárias, obras, chaves, avaliação e lançamento. Os gráficos são atualizados automaticamente
            conforme os dados da Simulação Técnica são preenchidos.
          </p>
        </section>

        {/* 8. Gestão de Vendas */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">8. Gestão de Vendas</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Módulo para gerenciamento e acompanhamento das vendas realizadas. Permite registrar clientes, status de
            negociação e acompanhar o funil de vendas do corretor.
          </p>
        </section>

        {/* 9. Painel Administrativo */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">9. Painel Administrativo</h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            Acessível pelo ícone ⚙️ no header. Permite configurar:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Dados do empreendimento (nome, imagem)</li>
            <li>Dados do corretor (nome, CRECI, imagem)</li>
            <li>Valores padrão para simulações</li>
            <li>Gestão de licenças DEMO (cadastro e controle)</li>
          </ul>
          <p className="text-sm text-gray-700 mt-2">
            <strong>Senha do painel:</strong> fornecida pelo gestor da licença (não publicada por segurança).
          </p>
        </section>

        {/* 10. Licenciamento */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">10. Licenciamento e Ativação</h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            O fluxo de ativação da versão completa segue 4 etapas:
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>
              Entrada da <strong>Senha Master</strong> (
              <code className="bg-gray-100 px-1 rounded">072.801.868.310</code>)
            </li>
            <li>
              Definição de uma nova <strong>Senha de Liberação</strong> (Master do Cliente)
            </li>
            <li>Confirmação da senha</li>
            <li>
              Criação de um <strong>PIN de 6 dígitos</strong> do usuário
            </li>
          </ol>
          <p className="text-xs text-gray-500 mt-2">O estado de ativação é mantido no localStorage do navegador.</p>
        </section>

        {/* 11. Contato */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">11. Contato e Suporte</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p>
              <strong>LOURENÇO JUNIOR</strong> — Consultor Imobiliário
            </p>
            <p>CRECI/SP 237.626-F</p>
            <p>Email: lourenco.consultorimob@gmail.com</p>
            <p className="mt-2">
              <strong>RODRIGO DIAS</strong> — Gestão TI
            </p>
          </div>
        </section>

        {/* Navegação do App */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">Navegação</h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            O app possui uma barra de navegação fixa na parte inferior com as seguintes abas:
          </p>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b">
                <th className="py-1">Aba</th>
                <th className="py-1">Ícone</th>
                <th className="py-1">Função</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b">
                <td className="py-1">Simulação</td>
                <td>🧮</td>
                <td>Simulação Técnica de Financiamento</td>
              </tr>
              <tr className="border-b">
                <td className="py-1">Pró Soluto</td>
                <td>📄</td>
                <td>Calculadora Pró Soluto</td>
              </tr>
              <tr className="border-b">
                <td className="py-1">Dashboard</td>
                <td>📊</td>
                <td>Gráficos da simulação</td>
              </tr>
              <tr className="border-b">
                <td className="py-1">Gestão</td>
                <td>📈</td>
                <td>Gestão de Vendas</td>
              </tr>
              <tr>
                <td className="py-1">Sair</td>
                <td>🚪</td>
                <td>Logout do sistema</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Rodapé */}
        <div className="mt-12 pt-4 border-t text-center text-xs text-gray-400">
          <p>
            © Todos os direitos reservados — INFORMETEC - Tecnologia em Informações - CNPJ 00.921.557/0001-65 | RORIGO
            DIAS - GESTÃO TI
          </p>
          <p className="mt-1">SIMULADOR CORRETOR DE ELITE 4.0 — Vendas Seguras — Informetec</p>
        </div>
      </div>
    </div>
  );
};

export default ManualPage;
