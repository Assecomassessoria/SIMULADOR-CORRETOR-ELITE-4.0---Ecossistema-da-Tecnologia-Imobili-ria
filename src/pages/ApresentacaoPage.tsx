import { useState } from "react";
import { Printer, Share2, ArrowLeft, ChevronLeft, ChevronRight, Download, Images } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PptxGenJS from "pptxgenjs";

const slides = [
  // SLIDE 1 — CAPA
  {
    title: "SIMULADOR CORRETOR DE ELITE 4.0",
    subtitle: "Venda Segura",
    content: (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4">
        <img
          src="https://pub-a3cfd193eb6748ec96b423de3caf804f.r2.dev/logo-elite.jpg"
          alt="Simulador Corretor de Elite"
          className="w-48 h-48 rounded-2xl shadow-2xl object-cover"
        />
        <div>
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-wider uppercase"
            style={{ color: "hsl(42 60% 55%)" }}
          >
            Simulador Corretor de Elite 4.0
          </h1>
          <p className="text-xl mt-2 tracking-[6px] uppercase" style={{ color: "hsl(42 60% 55% / 0.6)" }}>
            Venda Segura
          </p>
        </div>
        <div className="mt-4 space-y-1">
          <p className="text-sm" style={{ color: "hsl(42 60% 55% / 0.8)" }}>
            Plataforma completa para Construtoras, Imobiliárias e Corretores
          </p>
          <p className="text-xs" style={{ color: "hsl(42 60% 55% / 0.5)" }}>
            Implantação e Suporte por INFORMETEC — Lourenço Junior
          </p>
        </div>
      </div>
    ),
  },
  // SLIDE 2 — VISÃO GERAL
  {
    title: "Visão Geral do Sistema",
    subtitle: "Tudo em um só lugar",
    content: (
      <div className="grid grid-cols-2 gap-4 h-full p-4">
        {[
          {
            icon: "🧮",
            title: "Simulação Técnica",
            desc: "Cálculo completo de financiamento habitacional CAIXA (PRICE/SAC) com subsídios, FGTS e limites de prazo.",
          },
          {
            icon: "📊",
            title: "Pró-Soluto",
            desc: "4 opções de parcelamento com limite de renda, definição da construtora e impressão formatada.",
          },
          {
            icon: "📋",
            title: "Gestão de Vendas",
            desc: "Ficha cadastral completa com impressão em PDF, relatório de vendas e exportação CSV.",
          },
          {
            icon: "📈",
            title: "Dashboard",
            desc: "Gráficos interativos de composição de valores, financiamento e entrada.",
          },
          {
            icon: "👥",
            title: "CRM Pessoal",
            desc: "Gestão de leads, funil Kanban, tarefas, construtoras e relatórios de performance.",
          },
          {
            icon: "🏢",
            title: "Área Comercial",
            desc: "Cadastro de construtoras, imobiliárias e corretores com controle de licenças.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="rounded-xl p-4 flex gap-3 items-start"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <span className="text-2xl flex-shrink-0">{item.icon}</span>
            <div>
              <h3 className="font-bold text-sm mb-1" style={{ color: "hsl(42 60% 55%)" }}>
                {item.title}
              </h3>
              <p className="text-[11px] leading-relaxed" style={{ color: "hsl(0 0% 80%)" }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  // SLIDE 3 — ACESSO E LICENCIAMENTO
  {
    title: "Acesso e Licenciamento",
    subtitle: "Segurança e controle total",
    content: (
      <div className="space-y-4 p-4">
        <div
          className="rounded-xl p-5"
          style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
        >
          <h3 className="font-bold text-base mb-3" style={{ color: "hsl(42 60% 55%)" }}>
            🔐 Sistema de Login Seguro
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: "hsl(0 0% 80%)" }}>
            <li>• Login por e-mail com senha personalizada (padrão ELITE-XXXX)</li>
            <li>• Validação de sessão a cada 30 segundos no servidor</li>
            <li>• Controle de sessão única — acesso simultâneo é bloqueado</li>
            <li>• Modo Visitante/Demonstração para prospects</li>
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl p-5"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              📋 Planos Disponíveis
            </h3>
            <ul className="space-y-1 text-xs" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Plano 01 a 05 — Individual / Equipe</li>
              <li>• Plano Master — Ilimitado</li>
              <li>• Validades: 90, 180 ou 365 dias</li>
              <li>• Renovação automática com notificação</li>
            </ul>
          </div>
          <div
            className="rounded-xl p-5"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              🏗️ Implantação INFORMETEC
            </h3>
            <ul className="space-y-1 text-xs" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Cadastro da construtora / imobiliária</li>
              <li>• Configuração de empreendimentos</li>
              <li>• Cadastro de corretores com PIN</li>
              <li>• Treinamento e suporte contínuo</li>
            </ul>
          </div>
        </div>
        <div
          className="rounded-xl overflow-hidden mx-auto"
          style={{ border: "1px solid hsl(42 60% 55% / 0.3)", width: "60%" }}
        >
          <img src="/IMAGNES/01-login.png" alt="Tela de Login" className="w-full object-cover object-top opacity-90" />
          <p
            className="text-[9px] text-center py-1"
            style={{ color: "hsl(42 60% 55% / 0.6)", background: "hsl(220 70% 14%)" }}
          >
            Tela de Login
          </p>
        </div>
      </div>
    ),
  },
  // SLIDE 4 — ÁREA COMERCIAL
  {
    title: "Área Comercial",
    subtitle: "Gestão de Construtoras e Corretores",
    content: (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl p-5"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-3" style={{ color: "hsl(42 60% 55%)" }}>
              🏢 Cadastro Comercial
            </h3>
            <ul className="space-y-1.5 text-xs" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Razão Social / CPF / CNPJ</li>
              <li>• Endereço completo (CEP, Bairro, Cidade/UF)</li>
              <li>• Contato, WhatsApp e E-mail</li>
              <li>• Seleção de Plano e Validade</li>
              <li>• Geração automática de senha</li>
              <li>• Status: Ativo / Inativo / Expirado</li>
            </ul>
          </div>
          <div
            className="rounded-xl p-5"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-3" style={{ color: "hsl(42 60% 55%)" }}>
              👤 Cadastro de Corretores
            </h3>
            <ul className="space-y-1.5 text-xs" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Nome, CPF e CRECI</li>
              <li>• E-mail e WhatsApp</li>
              <li>• PIN de 6 dígitos para acesso seguro</li>
              <li>• Vínculo com Construtora/Imobiliária</li>
              <li>• Status individual (Ativo/Inativo)</li>
              <li>• Controle de máximo de usuários por plano</li>
            </ul>
          </div>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "hsl(42 60% 55% / 0.1)", border: "1px solid hsl(42 60% 55% / 0.3)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "hsl(42 60% 55%)" }}>
            ✅ Construtoras e Imobiliárias gerenciam seus próprios corretores de forma independente
          </p>
        </div>
      </div>
    ),
  },
  // SLIDE 5 — SIMULAÇÃO TÉCNICA
  {
    title: "Simulação Técnica",
    subtitle: "Financiamento Habitacional CAIXA",
    content: (
      <div className="space-y-4 p-4">
        <div
          className="rounded-xl p-5"
          style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
        >
          <h3 className="font-bold text-base mb-3" style={{ color: "hsl(42 60% 55%)" }}>
            🧮 Motor de Cálculo Completo
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs" style={{ color: "hsl(0 0% 80%)" }}>
            <div className="space-y-1.5">
              <p>• Tabelas PRICE e SAC</p>
              <p>• Faixas de renda (F1 a F4 e SBPE)</p>
              <p>• Cálculo automático de subsídios</p>
              <p>• FGTS e composição de renda</p>
              <p>• Prazo baseado na idade do proponente</p>
            </div>
            <div className="space-y-1.5">
              <p>• Taxas e seguros configuráveis</p>
              <p>• Cota máxima de financiamento</p>
              <p>• Valor financiado e entrada</p>
              <p>• Formatação de moeda em tempo real</p>
              <p>• Teclado numérico para mobile</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <span className="text-xl">📄</span>
            <p className="text-[10px] mt-1 font-semibold" style={{ color: "hsl(42 60% 55%)" }}>
              Documentos CAIXA
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: "hsl(0 0% 70%)" }}>
              Ficha MO, Cadastral, Declaração de Parentesco e Carta
            </p>
          </div>
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <span className="text-xl">📧</span>
            <p className="text-[10px] mt-1 font-semibold" style={{ color: "hsl(42 60% 55%)" }}>
              Envio por E-mail
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: "hsl(0 0% 70%)" }}>
              Simulação formatada
            </p>
          </div>
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <span className="text-xl">📱</span>
            <p className="text-[10px] mt-1 font-semibold" style={{ color: "hsl(42 60% 55%)" }}>
              WhatsApp
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: "hsl(0 0% 70%)" }}>
              Documentos via WhatsApp
            </p>
          </div>
        </div>
        <div
          className="rounded-xl overflow-hidden mx-auto"
          style={{ border: "1px solid hsl(42 60% 55% / 0.3)", width: "60%" }}
        >
          <img
            src="/IMAGNES/02-simulacao-topo.png"
            alt="Simulação Técnica"
            className="w-full object-cover object-top opacity-90"
          />
          <p
            className="text-[9px] text-center py-1"
            style={{ color: "hsl(42 60% 55% / 0.6)", background: "hsl(220 70% 14%)" }}
          >
            Tela de Simulação Técnica
          </p>
        </div>
      </div>
    ),
  },
  // SLIDE 6 — PRÓ-SOLUTO
  {
    title: "Pró-Soluto",
    subtitle: "Parcelamento direto com a construtora",
    content: (
      <div className="space-y-4 p-4">
        <div
          className="rounded-xl p-5"
          style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
        >
          <h3 className="font-bold text-base mb-3" style={{ color: "hsl(42 60% 55%)" }}>
            📊 4 Opções de Parcelamento
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { n: "01", desc: "Parcelamento básico com sinal, intermediárias, obras e chaves" },
              { n: "02", desc: "Inclui parcela pós-entrega com % máximo definido" },
              { n: "03", desc: "Com aprovação por limite de renda — análise automática" },
              { n: "04", desc: "Opção completa com renda, pós-entrega e validação integrada" },
            ].map((op, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span
                  className="text-xs font-bold px-2 py-1 rounded"
                  style={{ background: "hsl(42 60% 55% / 0.2)", color: "hsl(42 60% 55%)" }}
                >
                  {op.n}
                </span>
                <p className="text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
                  {op.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h4 className="font-bold text-xs mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              📝 Cadastro Integrado
            </h4>
            <p className="text-[10px]" style={{ color: "hsl(0 0% 75%)" }}>
              Empreendimento, Cliente, Unidade, Andar, Apto, Consultor e CRECI.
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h4 className="font-bold text-xs mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              🖨️ Impressão Profissional
            </h4>
            <p className="text-[10px]" style={{ color: "hsl(0 0% 75%)" }}>
              Layout alinhado com rótulos e valores, 6 linhas para comentários.
            </p>
          </div>
        </div>
        <div
          className="rounded-xl overflow-hidden mx-auto"
          style={{ border: "1px solid hsl(42 60% 55% / 0.3)", width: "60%" }}
        >
          <img
            src="/IMAGNES/04-prosoluto-topo.png"
            alt="Pró-Soluto"
            className="w-full object-cover object-top opacity-90"
          />
          <p
            className="text-[9px] text-center py-1"
            style={{ color: "hsl(42 60% 55% / 0.6)", background: "hsl(220 70% 14%)" }}
          >
            Tela do Pró-Soluto
          </p>
        </div>
      </div>
    ),
  },
  // SLIDE 7 — GESTÃO DE VENDAS
  {
    title: "Gestão de Vendas",
    subtitle: "Ficha Cadastral completa",
    content: (
      <div className="space-y-4 p-4">
        <div
          className="rounded-xl p-5"
          style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
        >
          <h3 className="font-bold text-base mb-3" style={{ color: "hsl(42 60% 55%)" }}>
            📋 Formulário de Nova Venda
          </h3>
          <div className="grid grid-cols-3 gap-4 text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
            <div className="space-y-1">
              <p className="font-bold text-xs" style={{ color: "hsl(42 60% 55% / 0.8)" }}>
                Dados Pessoais
              </p>
              <p>• Nome completo</p>
              <p>• CPF / RG</p>
              <p>• Data de Nascimento</p>
              <p>• Estado Civil</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-xs" style={{ color: "hsl(42 60% 55% / 0.8)" }}>
                Endereço
              </p>
              <p>• CEP com busca automática</p>
              <p>• Rua, Número, Bairro</p>
              <p>• Cidade e Estado</p>
              <p>• Complemento</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-xs" style={{ color: "hsl(42 60% 55% / 0.8)" }}>
                Renda e Financiamento
              </p>
              <p>• Renda Bruta e Informal</p>
              <p>• Valor da Renda e IR</p>
              <p>• Empreendimento</p>
              <p>• Valor do imóvel</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "🖨️", title: "Impressão A4", desc: "Layout otimizado para página única" },
            { icon: "📤", title: "Envio em PDF", desc: "Exportação direta para PDF" },
            { icon: "📊", title: "Relatório & CSV", desc: "Vendas pesquisáveis e exportáveis" },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-xl p-4 text-center"
              style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
            >
              <span className="text-xl">{item.icon}</span>
              <p className="text-[10px] mt-1 font-semibold" style={{ color: "hsl(42 60% 55%)" }}>
                {item.title}
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: "hsl(0 0% 70%)" }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
        <div
          className="rounded-xl overflow-hidden mx-auto"
          style={{ border: "1px solid hsl(42 60% 55% / 0.3)", width: "60%" }}
        >
          <img
            src="/IMAGNES/08-ficha-cadastral-topo.png"
            alt="Gestão - Ficha Cadastral"
            className="w-full object-cover object-top opacity-90"
          />
          <p
            className="text-[9px] text-center py-1"
            style={{ color: "hsl(42 60% 55% / 0.6)", background: "hsl(220 70% 14%)" }}
          >
            Gestão de Vendas — Ficha Cadastral
          </p>
        </div>
      </div>
    ),
  },
  // SLIDE 8 — DASHBOARD & CRM
  {
    title: "Dashboard & CRM Pessoal",
    subtitle: "Análise e gestão de clientes",
    content: (
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              📈 Dashboard Interativo
            </h3>
            <ul className="space-y-1 text-xs" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Gráficos de composição de valores</li>
              <li>• Financiamento vs. Entrada</li>
              <li>• FGTS, Subsídios e Parcelas</li>
              <li>• Atualização em tempo real</li>
            </ul>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              👥 CRM Pessoal
            </h3>
            <ul className="space-y-1 text-xs" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Leads com duplicidade bloqueada</li>
              <li>• Funil Kanban (Prospecção → Fechamento)</li>
              <li>• Tarefas e Construtoras</li>
              <li>• Relatórios de conversão</li>
            </ul>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(42 60% 55% / 0.3)" }}>
            <img
              src="/IMAGNES/10-dashboard.png"
              alt="Dashboard"
              className="w-full object-cover object-top opacity-90"
            />
            <p
              className="text-[9px] text-center py-1"
              style={{ color: "hsl(42 60% 55% / 0.6)", background: "hsl(220 70% 14%)" }}
            >
              Dashboard
            </p>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(42 60% 55% / 0.3)" }}>
            <img
              src="/IMAGNES/13-crm-kanban.png"
              alt="CRM Kanban"
              className="w-full object-cover object-top opacity-90"
            />
            <p
              className="text-[9px] text-center py-1"
              style={{ color: "hsl(42 60% 55% / 0.6)", background: "hsl(220 70% 14%)" }}
            >
              CRM Pessoal
            </p>
          </div>
        </div>
      </div>
    ),
  },
  // SLIDE 9 — IMPRESSÕES E DOCUMENTOS
  {
    title: "Impressões e Documentos",
    subtitle: "Tudo pronto para imprimir e enviar",
    content: (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl p-5"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-3" style={{ color: "hsl(42 60% 55%)" }}>
              📄 Documentos CAIXA (PDF-LIB)
            </h3>
            <ul className="space-y-1.5 text-xs" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Ficha MO — Autorização de Pesquisa CPF</li>
              <li>• Ficha Cadastral — Dados do proponente</li>
              <li>• Carta de Cancelamento</li>
              <li>• Declaração de Parentesco</li>
              <li>• Preenchimento sobre template original</li>
              <li>• Edição manual de proponentes</li>
            </ul>
          </div>
          <div
            className="rounded-xl p-5"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-3" style={{ color: "hsl(42 60% 55%)" }}>
              🖨️ Relatórios HTML (Print)
            </h3>
            <ul className="space-y-1.5 text-xs" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Simulação Técnica formatada</li>
              <li>• Pró-Soluto (4 opções independentes)</li>
              <li>• Ficha Cadastral de Vendas</li>
              <li>• Relatório de Vencimentos</li>
              <li>• Relatórios do CRM</li>
            </ul>
          </div>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "hsl(42 60% 55% / 0.1)", border: "1px solid hsl(42 60% 55% / 0.3)" }}
        >
          <p className="text-xs" style={{ color: "hsl(42 60% 55%)" }}>
            💡 Todos os relatórios podem ser salvos como PDF através do diálogo de impressão do navegador (Ctrl+P →
            Salvar como PDF)
          </p>
        </div>
      </div>
    ),
  },
  // SLIDE 10 — TELA DE LOGIN
  {
    title: "Tela de Login",
    subtitle: "Primeiro contato com o sistema",
    content: (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl p-5"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-3" style={{ color: "hsl(42 60% 55%)" }}>
              🔑 Acesso por E-mail e Senha
            </h3>
            <ul className="space-y-1.5 text-xs" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Campo de e-mail com validação</li>
              <li>• Senha personalizada por licença (ELITE-XXXX)</li>
              <li>• Validação server-side da senha</li>
              <li>• Feedback visual de erro/sucesso</li>
              <li>• Bloqueio de sessão simultânea</li>
            </ul>
          </div>
          <div
            className="rounded-xl p-5"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-3" style={{ color: "hsl(42 60% 55%)" }}>
              👁️ Modo Visitante
            </h3>
            <ul className="space-y-1.5 text-xs" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Acesso demonstrativo sem licença</li>
              <li>• Banner permanente de demonstração</li>
              <li>• Funcionalidades limitadas (somente leitura)</li>
              <li>• Botões de ação bloqueados com aviso</li>
              <li>• Direcionamento para contratação</li>
            </ul>
          </div>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: "hsl(42 60% 55% / 0.08)", border: "1px solid hsl(42 60% 55% / 0.3)" }}
        >
          <h4 className="font-bold text-xs mb-2" style={{ color: "hsl(42 60% 55%)" }}>
            ⚡ Sessão Única por Licença
          </h4>
          <p className="text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
            O sistema permite apenas uma sessão ativa por e-mail. Ao fazer login em outro dispositivo, a sessão anterior
            é automaticamente encerrada com notificação ao usuário.
          </p>
        </div>
      </div>
    ),
  },
  // SLIDE 11 — MANUTENÇÃO DE TAXAS
  {
    title: "Painel de Manutenção",
    subtitle: "Configuração de taxas e seguros",
    content: (
      <div className="space-y-4 p-4">
        <div
          className="rounded-xl p-5"
          style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
        >
          <h3 className="font-bold text-base mb-3" style={{ color: "hsl(42 60% 55%)" }}>
            ⚙️ Painel de Manutenção (Protegido por Senha)
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs" style={{ color: "hsl(0 0% 80%)" }}>
            <div className="space-y-1.5">
              <p className="font-bold text-xs" style={{ color: "hsl(42 60% 55% / 0.8)" }}>
                Taxas de Juros
              </p>
              <p>• Faixa 1 (até R$ 3.200)</p>
              <p>• Faixa 2 (3200.01 até R$ 5.000)</p>
              <p>• Faixa 3 (5000.01 até R$ 9.600)</p>
              <p>• Faixa 4 (9600.01 até R$ 13.000)</p>
              <p>• SBPE (acima de R$ 13.000.01)</p>
            </div>
            <div className="space-y-1.5">
              <p className="font-bold text-xs" style={{ color: "hsl(42 60% 55% / 0.8)" }}>
                Seguros e Parâmetros
              </p>
              <p>• MIP (Morte e Invalidez)</p>
              <p>• DFI (Danos Físicos ao Imóvel)</p>
              <p>• Taxa de administração</p>
              <p>• Cota máxima de financiamento</p>
              <p>• Valores atualizáveis em tempo real</p>
            </div>
          </div>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "hsl(42 60% 55% / 0.1)", border: "1px solid hsl(42 60% 55% / 0.3)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "hsl(42 60% 55%)" }}>
            🔒 Acesso restrito via ícone de engrenagem — senha validada no servidor para máxima segurança
          </p>
        </div>
      </div>
    ),
  },
  // SLIDE 12 — RELATÓRIO DE VENCIMENTOS
  {
    title: "Relatório de Vencimentos",
    subtitle: "Controle de parcelas e datas",
    content: (
      <div className="space-y-4 p-4">
        <div
          className="rounded-xl p-5"
          style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
        >
          <h3 className="font-bold text-base mb-3" style={{ color: "hsl(42 60% 55%)" }}>
            📅 Geração Automática de Vencimentos
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs" style={{ color: "hsl(0 0% 80%)" }}>
            <div className="space-y-1.5">
              <p>• Parcelas de sinal com data de início</p>
              <p>• Intermediárias programadas</p>
              <p>• Parcelas durante obras</p>
              <p>• Parcela de chaves/entrega</p>
            </div>
            <div className="space-y-1.5">
              <p>• Cálculo automático de datas</p>
              <p>• Tabela formatada para impressão</p>
              <p>• Valores individuais por parcela</p>
              <p>• Total geral consolidado</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <span className="text-xl">🖨️</span>
            <p className="text-[10px] mt-1 font-semibold" style={{ color: "hsl(42 60% 55%)" }}>
              Impressão Formatada
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: "hsl(0 0% 70%)" }}>
              Layout profissional com cabeçalho e dados do cliente
            </p>
          </div>
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <span className="text-xl">📊</span>
            <p className="text-[10px] mt-1 font-semibold" style={{ color: "hsl(42 60% 55%)" }}>
              6 Linhas de Observações
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: "hsl(0 0% 70%)" }}>
              Espaço para anotações manuais na impressão
            </p>
          </div>
        </div>
      </div>
    ),
  },
  // SLIDE 13 — PAINEL COMERCIAL DO CORRETOR
  {
    title: "Painel Comercial do Corretor",
    subtitle: "Personalização e identidade visual",
    content: (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl p-5"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-3" style={{ color: "hsl(42 60% 55%)" }}>
              🖼️ Imagens Personalizáveis
            </h3>
            <ul className="space-y-1.5 text-xs" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Foto do Corretor (avatar circular)</li>
              <li>• Logo do Empreendimento</li>
              <li>• Exibidos no cabeçalho do sistema</li>
              <li>• Aparecem nas impressões e PDFs</li>
              <li>• Upload direto pelo painel</li>
            </ul>
          </div>
          <div
            className="rounded-xl p-5"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-3" style={{ color: "hsl(42 60% 55%)" }}>
              📋 Dados do Corretor
            </h3>
            <ul className="space-y-1.5 text-xs" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Nome completo</li>
              <li>• CRECI / Registro profissional</li>
              <li>• Telefone e WhatsApp</li>
              <li>• Nome do empreendimento</li>
              <li>• Dados replicados em todos os formulários</li>
            </ul>
          </div>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: "hsl(42 60% 55% / 0.08)", border: "1px solid hsl(42 60% 55% / 0.3)" }}
        >
          <p className="text-xs text-center" style={{ color: "hsl(42 60% 55%)" }}>
            ✅ Todas as personalizações são salvas localmente e aplicadas automaticamente em simulações, impressões e
            documentos
          </p>
        </div>
      </div>
    ),
  },
  // SLIDE 14 — MANUAL DO SISTEMA
  {
    title: "Manual do Sistema",
    subtitle: "Documentação completa e imprimível",
    content: (
      <div className="space-y-4 p-4">
        <div
          className="rounded-xl p-5"
          style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
        >
          <h3 className="font-bold text-base mb-3" style={{ color: "hsl(42 60% 55%)" }}>
            📖 Manual Completo do Usuário
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs" style={{ color: "hsl(0 0% 80%)" }}>
            <div className="space-y-1.5">
              <p>• Instruções de acesso e login</p>
              <p>• Como usar a Simulação Técnica</p>
              <p>• Guia do Pró-Soluto (4 opções)</p>
              <p>• Gestão de Vendas passo a passo</p>
              <p>• Utilizando o Dashboard</p>
            </div>
            <div className="space-y-1.5">
              <p>• CRM: cadastro e funil Kanban</p>
              <p>• Impressão e exportação de PDFs</p>
              <p>• Painel Comercial e configurações</p>
              <p>• Listagem de senhas e níveis de acesso</p>
              <p>• FAQ e solução de problemas</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <span className="text-xl">🌐</span>
            <p className="text-[10px] mt-1 font-semibold" style={{ color: "hsl(42 60% 55%)" }}>
              Acesso Online
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: "hsl(0 0% 70%)" }}>
              Rota /manual no sistema
            </p>
          </div>
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <span className="text-xl">🖨️</span>
            <p className="text-[10px] mt-1 font-semibold" style={{ color: "hsl(42 60% 55%)" }}>
              Impressão Otimizada
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: "hsl(0 0% 70%)" }}>
              Layout formatado para PDF
            </p>
          </div>
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <span className="text-xl">📱</span>
            <p className="text-[10px] mt-1 font-semibold" style={{ color: "hsl(42 60% 55%)" }}>
              Responsivo
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: "hsl(0 0% 70%)" }}>
              Acessível em qualquer dispositivo
            </p>
          </div>
        </div>
      </div>
    ),
  },
  // SLIDE 15 — CALCULADORA INTEGRADA
  {
    title: "Calculadora Integrada",
    subtitle: "Normal e HP-12C (RPN) em qualquer tela",
    content: (
      <div className="space-y-4 p-4">
        <div
          className="rounded-xl p-5"
          style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
        >
          <h3 className="font-bold text-base mb-3" style={{ color: "hsl(42 60% 55%)" }}>
            🧮 Calculadora flutuante e arrastável
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "hsl(0 0% 80%)" }}>
            Disponível em todas as telas do sistema. Arraste para qualquer posição e use ao lado da simulação, do
            Pró-Soluto ou da gestão de vendas — sem trocar de janela.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h4 className="font-bold text-sm mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              🔢 Modo Normal
            </h4>
            <ul className="space-y-1 text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Operações básicas (+, -, ×, ÷)</li>
              <li>• Porcentagem e troca de sinal</li>
              <li>• Suporte completo ao teclado</li>
              <li>• Ideal para cálculos rápidos</li>
            </ul>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h4 className="font-bold text-sm mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              💼 Modo HP-12C (RPN)
            </h4>
            <ul className="space-y-1 text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Notação Polonesa Reversa</li>
              <li>• Pilha X / Y / Z / T visível</li>
              <li>• ENTER, x↔y, R↓, CHS, CLx</li>
              <li>• √x, 1/x e % financeiro (Y×X/100)</li>
            </ul>
          </div>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "hsl(42 60% 55% / 0.1)", border: "1px solid hsl(42 60% 55% / 0.3)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "hsl(42 60% 55%)" }}>
            ✅ O corretor escolhe o modo conforme o perfil — calculadora simples ou padrão financeiro HP-12C
          </p>
        </div>
      </div>
    ),
  },
  // SLIDE 16 — MARKETING (2 funções)
  {
    title: "Módulo de Marketing",
    subtitle: "Gerador de Anúncios + Luiza IA Marketing",
    content: (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl p-5"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-3" style={{ color: "hsl(42 60% 55%)" }}>
              📢 Gerenciador de Anúncios IA
            </h3>
            <ul className="space-y-1.5 text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Geração de imagens com IA (1080×1080)</li>
              <li>• Edição direta no editor visual</li>
              <li>• Templates de imobiliário de luxo</li>
              <li>• Carrosséis para Instagram</li>
              <li>• Texto + legenda + hashtags automáticos</li>
              <li>• Banco de imagens publicado em galeria</li>
            </ul>
          </div>
          <div
            className="rounded-xl p-5"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-3" style={{ color: "hsl(42 60% 55%)" }}>
              ✨ Luiza Elite Marketing
            </h3>
            <ul className="space-y-1.5 text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Assistente IA dedicada a conteúdo</li>
              <li>• Cria scripts para Reels e Stories</li>
              <li>• Sugere CTA e roteiros de prospecção</li>
              <li>• Gera legendas otimizadas por rede</li>
              <li>• Analisa imagens enviadas pelo corretor</li>
              <li>• Aprende com o portfólio do consultor</li>
            </ul>
          </div>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "hsl(42 60% 55% / 0.1)", border: "1px solid hsl(42 60% 55% / 0.3)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "hsl(42 60% 55%)" }}>
            ✅ Duas frentes complementares: criação visual com IA + estratégia de conteúdo
          </p>
        </div>
      </div>
    ),
  },
  // SLIDE 17 — INTEGRAÇÃO REDES SOCIAIS + WHATSAPP
  {
    title: "Integração com Redes Sociais e WhatsApp",
    subtitle: "Publique e atenda direto da plataforma",
    content: (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-3">
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <span className="text-3xl">📘</span>
            <p className="text-xs mt-2 font-bold" style={{ color: "hsl(42 60% 55%)" }}>
              Facebook
            </p>
            <p className="text-[10px] mt-1" style={{ color: "hsl(0 0% 75%)" }}>
              Login OAuth oficial e publicação direta na página
            </p>
          </div>
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <span className="text-3xl">📸</span>
            <p className="text-xs mt-2 font-bold" style={{ color: "hsl(42 60% 55%)" }}>
              Instagram
            </p>
            <p className="text-[10px] mt-1" style={{ color: "hsl(0 0% 75%)" }}>
              Publicação de Feed e Carrosséis via Graph API
            </p>
          </div>
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <span className="text-3xl">💬</span>
            <p className="text-xs mt-2 font-bold" style={{ color: "hsl(42 60% 55%)" }}>
              WhatsApp
            </p>
            <p className="text-[10px] mt-1" style={{ color: "hsl(0 0% 75%)" }}>
              Envio de simulação, documentos e apresentação
            </p>
          </div>
        </div>
        <div
          className="rounded-xl p-5"
          style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
        >
          <h3 className="font-bold text-sm mb-2" style={{ color: "hsl(42 60% 55%)" }}>
            🔗 Fluxo integrado
          </h3>
          <ul className="space-y-1 text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
            <li>• Cria a arte no Marketing → publica no Facebook/Instagram em 1 clique</li>
            <li>• Gera a simulação → envia ao cliente por WhatsApp com PDF anexo</li>
            <li>
              • Documentos CAIXA (MO, Declaração de Parentesco, Cadastral, CCA) → compartilháveis direto pelo WhatsApp
            </li>
            <li>• Apresentação institucional → link curto pronto para encaminhar</li>
          </ul>
        </div>
      </div>
    ),
  },
  // SLIDE 18 — LUIZA IA — ASSISTENTE DE SIMULAÇÃO
  {
    title: "Luiza Elite — Assistente IA de Simulação",
    subtitle: "Concierge inteligente do corretor",
    content: (
      <div className="space-y-4 p-4">
        <div
          className="rounded-xl p-5"
          style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
        >
          <h3 className="font-bold text-base mb-3" style={{ color: "hsl(42 60% 55%)" }}>
            🤖 IA dedicada à simulação habitacional
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "hsl(0 0% 80%)" }}>
            A Luiza Elite analisa simulações, sugere estratégias de fechamento e responde dúvidas técnicas sobre
            financiamento CAIXA, MCMV, SBPE, FGTS e Pró-Soluto — em linguagem simples para o cliente final.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h4 className="font-bold text-xs mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              📎 Multimodal
            </h4>
            <ul className="space-y-1 text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Recebe imagens (arrastar, colar ou anexar)</li>
              <li>• Lê PDFs do empreendimento</li>
              <li>• Treina com tabelas e plantas</li>
            </ul>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h4 className="font-bold text-xs mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              📊 Análise técnica
            </h4>
            <ul className="space-y-1 text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Compara SAC × PRICE</li>
              <li>• Avalia viabilidade e risco</li>
              <li>• Sugere melhor estratégia de entrada</li>
            </ul>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h4 className="font-bold text-xs mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              📝 Comando "0"
            </h4>
            <ul className="space-y-1 text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Gera resumo executivo para o PDF</li>
              <li>• Texto direcionado ao cliente final</li>
              <li>• Tom de consultoria de alto nível</li>
            </ul>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h4 className="font-bold text-xs mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              🎯 Treinamento contínuo
            </h4>
            <ul className="space-y-1 text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Base por empreendimento (Drive)</li>
              <li>• Aprende com fotos e tabelas de venda</li>
              <li>• Mapa Mental de objeções</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  // SLIDE 19 — CANAL DE SUGESTÕES (NOVO)
  {
    title: "Canal de Sugestões",
    subtitle: "A voz do corretor moldando o sistema",
    content: (
      <div className="space-y-4 p-4">
        <div
          className="rounded-xl p-5"
          style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
        >
          <h3 className="font-bold text-base mb-3" style={{ color: "hsl(42 60% 55%)" }}>
            💡 Canal Direto de Sugestões
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "hsl(0 0% 80%)" }}>
            Acessível pelo ícone de lâmpada no cabeçalho — ao lado do Painel Comercial e das Configurações. Cada
            corretor pode enviar ideias, críticas e melhorias direto para a equipe INFORMETEC.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h4 className="font-bold text-xs mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              📝 Formulário Simples
            </h4>
            <ul className="space-y-1 text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Nome, WhatsApp e Email</li>
              <li>• Área de texto redimensionável (até 3.000 caracteres)</li>
              <li>• Anexar PDF (até 10MB) — opcional</li>
              <li>• Envio em 1 clique</li>
            </ul>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h4 className="font-bold text-xs mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              🔒 Privacidade Garantida
            </h4>
            <ul className="space-y-1 text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Apenas administradores visualizam as sugestões</li>
              <li>• Anexos armazenados em bucket privado</li>
              <li>• Conformidade total com LGPD</li>
              <li>• Tratamento confidencial das ideias</li>
            </ul>
          </div>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "hsl(42 60% 55% / 0.1)", border: "1px solid hsl(42 60% 55% / 0.3)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "hsl(42 60% 55%)" }}>
            ✅ Evolução colaborativa: a próxima versão do simulador é construída com você
          </p>
        </div>
      </div>
    ),
  },
  // SLIDE 20 — SEGURANÇA & ARQUITETURA 4.1 (NOVO)
  {
    title: "Segurança & Arquitetura 4.1",
    subtitle: "Hardening completo e RBAC enterprise",
    content: (
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              👮 RBAC — Controle de Papéis
            </h3>
            <ul className="space-y-1 text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• 4 níveis: Admin, Gestor, Corretor, Visitante</li>
              <li>• Tabela dedicada user_roles (anti-escalada)</li>
              <li>• Funções SECURITY DEFINER no banco</li>
              <li>• Hook React reativo para permissões</li>
            </ul>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              🔐 Senhas com bcrypt
            </h3>
            <ul className="space-y-1 text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• Migração de SHA-256 para bcrypt</li>
              <li>• Proteção HIBP (senhas vazadas)</li>
              <li>• PIN de 6 dígitos para corretores</li>
              <li>• Compatibilidade retroativa garantida</li>
            </ul>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              🛡️ RLS Hardening
            </h3>
            <ul className="space-y-1 text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• 15+ tabelas sensíveis protegidas</li>
              <li>• Acesso exclusivo via Edge Functions</li>
              <li>• Isolamento total entre tenants no CRM</li>
              <li>• Storage privado com políticas restritas</li>
            </ul>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.2)" }}
          >
            <h3 className="font-bold text-sm mb-2" style={{ color: "hsl(42 60% 55%)" }}>
              🏗️ Repository Layer
            </h3>
            <ul className="space-y-1 text-[11px]" style={{ color: "hsl(0 0% 80%)" }}>
              <li>• BaseRepository genérico para CRUD</li>
              <li>• Acesso a dados centralizado e tipado</li>
              <li>• Manutenção facilitada</li>
              <li>• Migração progressiva e segura</li>
            </ul>
          </div>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "hsl(42 60% 55% / 0.1)", border: "1px solid hsl(42 60% 55% / 0.3)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "hsl(42 60% 55%)" }}>
            ✅ 22 vulnerabilidades de segurança corrigidas — plataforma pronta para escala enterprise
          </p>
        </div>
      </div>
    ),
  },
  // SLIDE 21 — CONTATO / ENCERRAMENTO

  {
    title: "Contato",
    subtitle: "Comece agora",
    content: (
      <div className="flex flex-col items-center justify-center h-full text-center gap-6">
        <img src="https://pub-a3cfd193eb6748ec96b423de3caf804f.r2.dev/logo-elite.jpg" alt="Elite" className="w-28 h-28 rounded-2xl shadow-2xl object-cover" />
        <div>
          <h2 className="text-3xl font-extrabold uppercase tracking-wider" style={{ color: "hsl(42 60% 55%)" }}>
            Comece Agora!
          </h2>
          <p className="text-sm mt-2" style={{ color: "hsl(0 0% 80%)" }}>
            Entre em contato para ativar sua licença
          </p>
        </div>
        <div className="space-y-3 mt-4">
          <div
            className="rounded-xl px-8 py-4"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.3)" }}
          >
            <p className="text-lg font-bold" style={{ color: "hsl(42 60% 55%)" }}>
              📱 (11) 94677-0656
            </p>
            <p className="text-xs mt-1" style={{ color: "hsl(0 0% 70%)" }}>
              Lourenço Junior — WhatsApp
            </p>
          </div>
          <div
            className="rounded-xl px-8 py-3"
            style={{ background: "hsl(220 70% 14% / 0.8)", border: "1px solid hsl(42 60% 55% / 0.3)" }}
          >
            <p className="text-sm" style={{ color: "hsl(42 60% 55%)" }}>
              🌐 simuladorcorretorelite.com.br
            </p>
          </div>
        </div>
        <p className="text-[10px] mt-6" style={{ color: "hsl(0 0% 50%)" }}>
          INFORMETEC — Implantação e Suporte | Rodrigo Dias — Gestão TI
        </p>
      </div>
    ),
  },
];

const whatsappSummary = `⭐ *SIMULADOR CORRETOR DE ELITE 4.0* — Venda Segura

Plataforma completa para *Construtoras, Imobiliárias e Corretores*.

✅ *FUNCIONALIDADES:*
🧮 Simulação Técnica CAIXA (PRICE/SAC)
📊 Pró-Soluto — 4 opções de parcelamento
📋 Gestão de Vendas com Ficha Cadastral
📈 Dashboard interativo
👥 CRM Pessoal com funil Kanban
📄 Documentos CAIXA automatizados
🖨️ Impressão e envio em PDF

✅ *PARA EMPRESAS:*
🏢 Cadastro de Construtoras/Imobiliárias
👤 Cadastro de Corretores com PIN
📋 Planos de 90, 180 ou 365 dias
🔐 Sessão única com validação no servidor

✅ *IMPLANTAÇÃO:*
INFORMETEC — Lourenço Junior
📱 (11) 94677-0656
🌐 simuladorcorretorelite.com.br

_Solicite uma demonstração gratuita!_`;

const ApresentacaoPage = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappSummary);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const handlePptx = async () => {
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "INFORMETEC - Lourenço Junior";
    pptx.title = "Simulador Corretor de Elite 4.0";

    const BG = "0B1528";
    const GOLD = "C6983A";
    const GOLD_LIGHT = "D4A84A";
    const WHITE = "CCCCCC";
    const CARD_BG = "0E1A30";

    // Load logo as base64
    let logoBase64 = "";
    try {
      const resp = await fetch("https://pub-a3cfd193eb6748ec96b423de3caf804f.r2.dev/logo-elite.jpg");
      const blob = await resp.blob();
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Logo not loaded for PPTX", e);
    }

    // Helper
    const addCard = (slide: PptxGenJS.Slide, x: number, y: number, w: number, h: number) => {
      slide.addShape(pptx.ShapeType.roundRect, {
        x,
        y,
        w,
        h,
        fill: { color: CARD_BG },
        line: { color: GOLD, width: 0.5 },
        rectRadius: 0.1,
      });
    };

    // Helper: add logo to slide header
    const addLogo = (slide: PptxGenJS.Slide) => {
      if (logoBase64) {
        slide.addImage({ data: logoBase64, x: 0.3, y: 0.15, w: 0.55, h: 0.55, rounding: true });
      }
    };

    // SLIDE 1 — CAPA
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      if (logoBase64) {
        s.addImage({ data: logoBase64, x: 5.15, y: 0.8, w: 3, h: 3, rounding: true });
      }
      s.addText("SIMULADOR CORRETOR DE ELITE 4.0", {
        x: 0.5,
        y: 3.9,
        w: 12.3,
        h: 1,
        fontSize: 36,
        bold: true,
        color: GOLD,
        align: "center",
        fontFace: "Arial",
      });
      s.addText("VENDA SEGURA", {
        x: 0.5,
        y: 4.8,
        w: 12.3,
        h: 0.6,
        fontSize: 18,
        color: GOLD_LIGHT,
        align: "center",
        charSpacing: 8,
        fontFace: "Arial",
      });
      s.addText("Plataforma completa para Construtoras, Imobiliárias e Corretores", {
        x: 1,
        y: 5.6,
        w: 11.3,
        h: 0.5,
        fontSize: 13,
        color: WHITE,
        align: "center",
        fontFace: "Arial",
      });
      s.addText("Implantação e Suporte por INFORMETEC — Lourenço Junior", {
        x: 1,
        y: 6.1,
        w: 11.3,
        h: 0.4,
        fontSize: 10,
        color: "888888",
        align: "center",
        fontFace: "Arial",
      });
    }

    // SLIDE 2 — VISÃO GERAL
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("VISÃO GERAL DO SISTEMA", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Tudo em um só lugar", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });

      const items = [
        [
          "🧮 Simulação Técnica",
          "Cálculo completo de financiamento habitacional CAIXA (PRICE/SAC) com subsídios, FGTS e limites de prazo.",
        ],
        [
          "📊 Pró-Soluto",
          "4 opções de parcelamento com limite de renda, definição da construtora e impressão formatada.",
        ],
        ["📋 Gestão de Vendas", "Ficha cadastral completa com impressão em PDF, relatório de vendas e exportação CSV."],
        ["📈 Dashboard", "Gráficos interativos de composição de valores, financiamento e entrada."],
        ["👥 CRM Pessoal", "Gestão de leads, funil Kanban, tarefas, construtoras e relatórios de performance."],
        ["🏢 Área Comercial", "Cadastro de construtoras, imobiliárias e corretores com controle de licenças."],
      ];
      items.forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 0.5 + col * 6.3;
        const y = 1.4 + row * 1.6;
        addCard(s, x, y, 5.8, 1.4);
        s.addText(item[0], {
          x: x + 0.3,
          y: y + 0.15,
          w: 5.2,
          h: 0.4,
          fontSize: 13,
          bold: true,
          color: GOLD,
          fontFace: "Arial",
        });
        s.addText(item[1], { x: x + 0.3, y: y + 0.6, w: 5.2, h: 0.6, fontSize: 10, color: WHITE, fontFace: "Arial" });
      });
    }

    // SLIDE 3 — ACESSO E LICENCIAMENTO
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("ACESSO E LICENCIAMENTO", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Segurança e controle total", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });

      addCard(s, 0.5, 1.4, 12.3, 2.2);
      s.addText("🔐 Sistema de Login Seguro", {
        x: 0.8,
        y: 1.55,
        w: 11,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      const loginItems =
        "• Login por e-mail com senha personalizada (padrão ELITE-XXXX)\n• Validação de sessão a cada 30 segundos no servidor\n• Controle de sessão única — acesso simultâneo é bloqueado\n• Modo Visitante/Demonstração para prospects";
      s.addText(loginItems, {
        x: 0.8,
        y: 2.05,
        w: 11,
        h: 1.4,
        fontSize: 11,
        color: WHITE,
        fontFace: "Arial",
        lineSpacingMultiple: 1.3,
      });

      addCard(s, 0.5, 3.9, 5.8, 2.5);
      s.addText("📋 Planos Disponíveis", {
        x: 0.8,
        y: 4.05,
        w: 5.2,
        h: 0.35,
        fontSize: 12,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Plano 01 a 05 — Individual / Equipe\n• Plano Master — Ilimitado\n• Validades: 90, 180 ou 365 dias\n• Renovação automática com notificação",
        { x: 0.8, y: 4.5, w: 5.2, h: 1.6, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.3 },
      );

      addCard(s, 7, 3.9, 5.8, 2.5);
      s.addText("🏗️ Implantação INFORMETEC", {
        x: 7.3,
        y: 4.05,
        w: 5.2,
        h: 0.35,
        fontSize: 12,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Cadastro da construtora / imobiliária\n• Configuração de empreendimentos\n• Cadastro de corretores com PIN\n• Treinamento e suporte contínuo",
        { x: 7.3, y: 4.5, w: 5.2, h: 1.6, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.3 },
      );
    }

    // SLIDE 4 — ÁREA COMERCIAL
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("ÁREA COMERCIAL", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Gestão de Construtoras e Corretores", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });

      addCard(s, 0.5, 1.4, 5.8, 3.5);
      s.addText("🏢 Cadastro Comercial", {
        x: 0.8,
        y: 1.55,
        w: 5.2,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Razão Social / CPF / CNPJ\n• Endereço completo (CEP, Bairro, Cidade/UF)\n• Contato, WhatsApp e E-mail\n• Seleção de Plano e Validade\n• Geração automática de senha\n• Status: Ativo / Inativo / Expirado",
        { x: 0.8, y: 2.05, w: 5.2, h: 2.5, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.4 },
      );

      addCard(s, 7, 1.4, 5.8, 3.5);
      s.addText("👤 Cadastro de Corretores", {
        x: 7.3,
        y: 1.55,
        w: 5.2,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Nome, CPF e CRECI\n• E-mail e WhatsApp\n• PIN de 6 dígitos para acesso seguro\n• Vínculo com Construtora/Imobiliária\n• Status individual (Ativo/Inativo)\n• Controle de máximo de usuários por plano",
        { x: 7.3, y: 2.05, w: 5.2, h: 2.5, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.4 },
      );

      addCard(s, 0.5, 5.2, 12.3, 0.8);
      s.addText("✅ Construtoras e Imobiliárias gerenciam seus próprios corretores de forma independente", {
        x: 0.8,
        y: 5.3,
        w: 11.7,
        h: 0.5,
        fontSize: 11,
        bold: true,
        color: GOLD,
        align: "center",
        fontFace: "Arial",
      });
    }

    // SLIDE 5 — SIMULAÇÃO TÉCNICA
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("SIMULAÇÃO TÉCNICA", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Financiamento Habitacional CAIXA", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });

      addCard(s, 0.5, 1.4, 12.3, 3);
      s.addText("🧮 Motor de Cálculo Completo", {
        x: 0.8,
        y: 1.55,
        w: 11,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Tabelas PRICE e SAC\n• Faixas de renda (F1 a F4 e SBPE)\n• Cálculo automático de subsídios\n• FGTS e composição de renda\n• Prazo baseado na idade do proponente",
        { x: 0.8, y: 2.05, w: 5.5, h: 2, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.3 },
      );
      s.addText(
        "• Taxas e seguros configuráveis\n• Cota máxima de financiamento\n• Valor financiado e entrada\n• Formatação de moeda em tempo real\n• Teclado numérico para mobile",
        { x: 6.5, y: 2.05, w: 5.5, h: 2, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.3 },
      );

      const footItems = [
        ["📄 Documentos CAIXA", "Ficha MO, Cadastral e Carta de Cancelamento"],
        ["📧 Envio por E-mail", "Simulação formatada para o cliente"],
        ["📱 WhatsApp", "Solicitação de documentos via WhatsApp"],
      ];
      footItems.forEach((item, i) => {
        const x = 0.5 + i * 4.3;
        addCard(s, x, 4.7, 3.9, 1.5);
        s.addText(item[0], {
          x: x + 0.2,
          y: 4.85,
          w: 3.5,
          h: 0.35,
          fontSize: 10,
          bold: true,
          color: GOLD,
          align: "center",
          fontFace: "Arial",
        });
        s.addText(item[1], {
          x: x + 0.2,
          y: 5.25,
          w: 3.5,
          h: 0.5,
          fontSize: 9,
          color: WHITE,
          align: "center",
          fontFace: "Arial",
        });
      });
    }

    // SLIDE 6 — PRÓ-SOLUTO
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("PRÓ-SOLUTO", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Parcelamento direto com a construtora", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });

      addCard(s, 0.5, 1.4, 12.3, 3);
      s.addText("📊 4 Opções de Parcelamento", {
        x: 0.8,
        y: 1.55,
        w: 11,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      const ops = [
        ["01", "Parcelamento básico com sinal, intermediárias, obras e chaves"],
        ["02", "Inclui parcela pós-entrega com % máximo definido"],
        ["03", "Com aprovação por limite de renda — análise automática"],
        ["04", "Opção completa com renda, pós-entrega e validação integrada"],
      ];
      ops.forEach((op, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        s.addText(`[${op[0]}] ${op[1]}`, {
          x: 0.8 + col * 6,
          y: 2.1 + row * 0.7,
          w: 5.5,
          h: 0.5,
          fontSize: 10,
          color: WHITE,
          fontFace: "Arial",
        });
      });

      addCard(s, 0.5, 4.7, 5.8, 1.5);
      s.addText("📝 Cadastro Integrado", {
        x: 0.8,
        y: 4.85,
        w: 5.2,
        h: 0.3,
        fontSize: 11,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "Empreendimento, Cliente, Unidade, Andar, Apto, Consultor e CRECI — replicados em todas as impressões.",
        { x: 0.8, y: 5.2, w: 5.2, h: 0.7, fontSize: 9, color: WHITE, fontFace: "Arial" },
      );

      addCard(s, 7, 4.7, 5.8, 1.5);
      s.addText("🖨️ Impressão Profissional", {
        x: 7.3,
        y: 4.85,
        w: 5.2,
        h: 0.3,
        fontSize: 11,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Layout alinhado com rótulos à esquerda e valores à direita, 6 linhas para comentários manuais.", {
        x: 7.3,
        y: 5.2,
        w: 5.2,
        h: 0.7,
        fontSize: 9,
        color: WHITE,
        fontFace: "Arial",
      });
    }

    // SLIDE 7 — GESTÃO DE VENDAS
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("GESTÃO DE VENDAS", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Ficha Cadastral completa", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });

      addCard(s, 0.5, 1.4, 12.3, 3);
      s.addText("📋 Formulário de Nova Venda", {
        x: 0.8,
        y: 1.55,
        w: 11,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });

      const cols = [
        ["Dados Pessoais", "• Nome completo\n• CPF / RG\n• Data de Nascimento\n• Estado Civil"],
        ["Endereço", "• CEP com busca automática\n• Rua, Número, Bairro\n• Cidade e Estado\n• Complemento"],
        [
          "Renda e Financiamento",
          "• Renda Bruta e Informal\n• Valor da Renda e IR\n• Empreendimento\n• Valor do imóvel",
        ],
      ];
      cols.forEach((col, i) => {
        const x = 0.8 + i * 4;
        s.addText(col[0], {
          x,
          y: 2.1,
          w: 3.6,
          h: 0.3,
          fontSize: 10,
          bold: true,
          color: GOLD_LIGHT,
          fontFace: "Arial",
        });
        s.addText(col[1], {
          x,
          y: 2.5,
          w: 3.6,
          h: 1.6,
          fontSize: 10,
          color: WHITE,
          fontFace: "Arial",
          lineSpacingMultiple: 1.3,
        });
      });

      const footItems = [
        ["🖨️ Impressão A4", "Layout otimizado para página única"],
        ["📤 Envio em PDF", "Exportação direta para PDF via navegador"],
        ["📊 Relatório & CSV", "Vendas pesquisáveis e exportáveis"],
      ];
      footItems.forEach((item, i) => {
        const x = 0.5 + i * 4.3;
        addCard(s, x, 4.7, 3.9, 1.4);
        s.addText(item[0], {
          x: x + 0.2,
          y: 4.85,
          w: 3.5,
          h: 0.3,
          fontSize: 10,
          bold: true,
          color: GOLD,
          align: "center",
          fontFace: "Arial",
        });
        s.addText(item[1], {
          x: x + 0.2,
          y: 5.2,
          w: 3.5,
          h: 0.5,
          fontSize: 9,
          color: WHITE,
          align: "center",
          fontFace: "Arial",
        });
      });
    }

    // SLIDE 8 — DASHBOARD & CRM
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("DASHBOARD & CRM PESSOAL", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Análise e gestão de clientes", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });

      addCard(s, 0.5, 1.4, 5.8, 3.2);
      s.addText("📈 Dashboard Interativo", {
        x: 0.8,
        y: 1.55,
        w: 5.2,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Gráficos de composição de valores\n• Financiamento vs. Entrada\n• FGTS e Subsídios\n• Sinal, Intermediárias e Obras\n• Atualização em tempo real",
        { x: 0.8, y: 2.05, w: 5.2, h: 2.2, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.4 },
      );

      addCard(s, 7, 1.4, 5.8, 3.2);
      s.addText("👥 CRM Pessoal", {
        x: 7.3,
        y: 1.55,
        w: 5.2,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Cadastro de leads com duplicidade bloqueada\n• Funil Kanban (Prospecção → Fechamento)\n• Tarefas e follow-ups com vencimento\n• Gestão de Construtoras/Empreendimentos\n• Relatórios de performance e conversão",
        { x: 7.3, y: 2.05, w: 5.2, h: 2.2, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.4 },
      );

      addCard(s, 0.5, 4.9, 12.3, 1.2);
      s.addText("🔒 Segurança dos Dados", {
        x: 0.8,
        y: 5,
        w: 11,
        h: 0.3,
        fontSize: 11,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "Todos os dados do CRM são protegidos por validação de sessão no servidor. Cada operação (CRUD) verifica o token de sessão antes de ser executada.",
        { x: 0.8, y: 5.35, w: 11, h: 0.5, fontSize: 10, color: WHITE, fontFace: "Arial" },
      );
    }

    // SLIDE 9 — IMPRESSÕES E DOCUMENTOS
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("IMPRESSÕES E DOCUMENTOS", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Tudo pronto para imprimir e enviar", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });

      addCard(s, 0.5, 1.4, 5.8, 3.2);
      s.addText("📄 Documentos CAIXA (PDF-LIB)", {
        x: 0.8,
        y: 1.55,
        w: 5.2,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Ficha MO — Autorização de Pesquisa CPF\n• Ficha Cadastral — Dados do proponente\n• Carta de Cancelamento\n• Preenchimento sobre template original\n• Edição manual de proponentes",
        { x: 0.8, y: 2.05, w: 5.2, h: 2.2, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.4 },
      );

      addCard(s, 7, 1.4, 5.8, 3.2);
      s.addText("🖨️ Relatórios HTML (Print)", {
        x: 7.3,
        y: 1.55,
        w: 5.2,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Simulação Técnica formatada\n• Pró-Soluto (4 opções independentes)\n• Ficha Cadastral de Vendas\n• Relatório de Vencimentos\n• Relatórios do CRM",
        { x: 7.3, y: 2.05, w: 5.2, h: 2.2, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.4 },
      );

      addCard(s, 0.5, 4.9, 12.3, 0.8);
      s.addText(
        "💡 Todos os relatórios podem ser salvos como PDF através do diálogo de impressão do navegador (Ctrl+P → Salvar como PDF)",
        { x: 0.8, y: 5, w: 11.7, h: 0.5, fontSize: 10, color: GOLD, align: "center", fontFace: "Arial" },
      );
    }

    // SLIDE 10 — TELA DE LOGIN
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("TELA DE LOGIN", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Primeiro contato com o sistema", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });

      addCard(s, 0.5, 1.4, 5.8, 3.2);
      s.addText("🔑 Acesso por E-mail e Senha", {
        x: 0.8,
        y: 1.55,
        w: 5.2,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Campo de e-mail com validação\n• Senha personalizada por licença (ELITE-XXXX)\n• Validação server-side da senha\n• Feedback visual de erro/sucesso\n• Bloqueio de sessão simultânea",
        { x: 0.8, y: 2.05, w: 5.2, h: 2.2, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.4 },
      );

      addCard(s, 7, 1.4, 5.8, 3.2);
      s.addText("👁️ Modo Visitante", {
        x: 7.3,
        y: 1.55,
        w: 5.2,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Acesso demonstrativo sem licença\n• Banner permanente de demonstração\n• Funcionalidades limitadas (somente leitura)\n• Botões de ação bloqueados com aviso\n• Direcionamento para contratação",
        { x: 7.3, y: 2.05, w: 5.2, h: 2.2, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.4 },
      );

      addCard(s, 0.5, 4.9, 12.3, 1.2);
      s.addText("⚡ Sessão Única por Licença", {
        x: 0.8,
        y: 5,
        w: 11,
        h: 0.3,
        fontSize: 11,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "O sistema permite apenas uma sessão ativa por e-mail. Ao fazer login em outro dispositivo, a sessão anterior é automaticamente encerrada.",
        { x: 0.8, y: 5.35, w: 11, h: 0.5, fontSize: 10, color: WHITE, fontFace: "Arial" },
      );
    }

    // SLIDE 11 — MANUTENÇÃO DE TAXAS
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("PAINEL DE MANUTENÇÃO", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Configuração de taxas e seguros", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });

      addCard(s, 0.5, 1.4, 12.3, 3.5);
      s.addText("⚙️ Painel de Manutenção (Protegido por Senha)", {
        x: 0.8,
        y: 1.55,
        w: 11,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Taxas de Juros", {
        x: 0.8,
        y: 2.1,
        w: 5.5,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: GOLD_LIGHT,
        fontFace: "Arial",
      });
      s.addText(
        "• Faixa 1 (até R$ 3.200)\n• Faixa 2 (3200.01 até R$ 5.000)\n• Faixa 3 (5000.01 até R$ 9.600)\n• Faixa 4 (9600.01 até R$ 13.000)\n• SBPE (acima de R$ 13.000.01)",
        { x: 0.8, y: 2.45, w: 5.5, h: 2, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.3 },
      );
      s.addText("Seguros e Parâmetros", {
        x: 6.5,
        y: 2.1,
        w: 5.5,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: GOLD_LIGHT,
        fontFace: "Arial",
      });
      s.addText(
        "• MIP (Morte e Invalidez)\n• DFI (Danos Físicos ao Imóvel)\n• Taxa de administração\n• Cota máxima de financiamento\n• Valores atualizáveis em tempo real",
        { x: 6.5, y: 2.45, w: 5.5, h: 2, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.3 },
      );

      addCard(s, 0.5, 5.2, 12.3, 0.8);
      s.addText("🔒 Acesso restrito via ícone de engrenagem — senha validada no servidor para máxima segurança", {
        x: 0.8,
        y: 5.3,
        w: 11.7,
        h: 0.5,
        fontSize: 11,
        bold: true,
        color: GOLD,
        align: "center",
        fontFace: "Arial",
      });
    }

    // SLIDE 12 — RELATÓRIO DE VENCIMENTOS
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("RELATÓRIO DE VENCIMENTOS", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Controle de parcelas e datas", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });

      addCard(s, 0.5, 1.4, 12.3, 2.8);
      s.addText("📅 Geração Automática de Vencimentos", {
        x: 0.8,
        y: 1.55,
        w: 11,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Parcelas de sinal com data de início\n• Intermediárias programadas\n• Parcelas durante obras\n• Parcela de chaves/entrega",
        { x: 0.8, y: 2.05, w: 5.5, h: 1.8, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.3 },
      );
      s.addText(
        "• Cálculo automático de datas\n• Tabela formatada para impressão\n• Valores individuais por parcela\n• Total geral consolidado",
        { x: 6.5, y: 2.05, w: 5.5, h: 1.8, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.3 },
      );

      const footItems2 = [
        ["🖨️ Impressão Formatada", "Layout profissional com cabeçalho"],
        ["📊 6 Linhas de Observações", "Espaço para anotações manuais"],
      ];
      footItems2.forEach((item, i) => {
        const x = 0.5 + i * 6.5;
        addCard(s, x, 4.5, 5.8, 1.5);
        s.addText(item[0], {
          x: x + 0.3,
          y: 4.65,
          w: 5.2,
          h: 0.35,
          fontSize: 11,
          bold: true,
          color: GOLD,
          align: "center",
          fontFace: "Arial",
        });
        s.addText(item[1], {
          x: x + 0.3,
          y: 5.1,
          w: 5.2,
          h: 0.5,
          fontSize: 9,
          color: WHITE,
          align: "center",
          fontFace: "Arial",
        });
      });
    }

    // SLIDE 13 — PAINEL COMERCIAL DO CORRETOR
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("PAINEL COMERCIAL DO CORRETOR", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Personalização e identidade visual", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });

      addCard(s, 0.5, 1.4, 5.8, 3.2);
      s.addText("🖼️ Imagens Personalizáveis", {
        x: 0.8,
        y: 1.55,
        w: 5.2,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Foto do Corretor (avatar circular)\n• Logo do Empreendimento\n• Exibidos no cabeçalho do sistema\n• Aparecem nas impressões e PDFs\n• Upload direto pelo painel",
        { x: 0.8, y: 2.05, w: 5.2, h: 2.2, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.4 },
      );

      addCard(s, 7, 1.4, 5.8, 3.2);
      s.addText("📋 Dados do Corretor", {
        x: 7.3,
        y: 1.55,
        w: 5.2,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Nome completo\n• CRECI / Registro profissional\n• Telefone e WhatsApp\n• Nome do empreendimento\n• Dados replicados em todos os formulários",
        { x: 7.3, y: 2.05, w: 5.2, h: 2.2, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.4 },
      );

      addCard(s, 0.5, 4.9, 12.3, 0.8);
      s.addText("✅ Personalizações salvas localmente e aplicadas em simulações, impressões e documentos", {
        x: 0.8,
        y: 5,
        w: 11.7,
        h: 0.5,
        fontSize: 11,
        bold: true,
        color: GOLD,
        align: "center",
        fontFace: "Arial",
      });
    }

    // SLIDE 14 — MANUAL DO SISTEMA
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("MANUAL DO SISTEMA", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Documentação completa e imprimível", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });

      addCard(s, 0.5, 1.4, 12.3, 3);
      s.addText("📖 Manual Completo do Usuário", {
        x: 0.8,
        y: 1.55,
        w: 11,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Instruções de acesso e login\n• Como usar a Simulação Técnica\n• Guia do Pró-Soluto (4 opções)\n• Gestão de Vendas passo a passo\n• Utilizando o Dashboard",
        { x: 0.8, y: 2.05, w: 5.5, h: 2, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.3 },
      );
      s.addText(
        "• CRM: cadastro e funil Kanban\n• Impressão e exportação de PDFs\n• Painel Comercial e configurações\n• Listagem de senhas e níveis de acesso\n• FAQ e solução de problemas",
        { x: 6.5, y: 2.05, w: 5.5, h: 2, fontSize: 10, color: WHITE, fontFace: "Arial", lineSpacingMultiple: 1.3 },
      );

      const manualFootItems = [
        ["🌐 Acesso Online", "Rota /manual no sistema"],
        ["🖨️ Impressão Otimizada", "Layout formatado para PDF"],
        ["📱 Responsivo", "Acessível em qualquer dispositivo"],
      ];
      manualFootItems.forEach((item, i) => {
        const x = 0.5 + i * 4.3;
        addCard(s, x, 4.7, 3.9, 1.4);
        s.addText(item[0], {
          x: x + 0.2,
          y: 4.85,
          w: 3.5,
          h: 0.3,
          fontSize: 10,
          bold: true,
          color: GOLD,
          align: "center",
          fontFace: "Arial",
        });
        s.addText(item[1], {
          x: x + 0.2,
          y: 5.2,
          w: 3.5,
          h: 0.5,
          fontSize: 9,
          color: WHITE,
          align: "center",
          fontFace: "Arial",
        });
      });
    }

    // SLIDE 15 — CALCULADORA INTEGRADA
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("CALCULADORA INTEGRADA", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Normal e HP-12C (RPN) em qualquer tela", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });
      addCard(s, 0.5, 1.4, 12.3, 1.2);
      s.addText("🧮 Calculadora flutuante e arrastável", {
        x: 0.8,
        y: 1.55,
        w: 11.5,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Disponível em todas as telas. Use lado a lado com a simulação, Pró-Soluto ou Gestão de Vendas.", {
        x: 0.8,
        y: 2.0,
        w: 11.5,
        h: 0.5,
        fontSize: 11,
        color: WHITE,
        fontFace: "Arial",
      });
      addCard(s, 0.5, 2.9, 6, 3);
      s.addText("🔢 Modo Normal", {
        x: 0.8,
        y: 3.05,
        w: 5.5,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Operações básicas (+, -, ×, ÷)\n• Porcentagem e troca de sinal\n• Suporte completo ao teclado\n• Ideal para cálculos rápidos",
        { x: 0.9, y: 3.5, w: 5.4, h: 2.2, fontSize: 11, color: WHITE, fontFace: "Arial" },
      );
      addCard(s, 6.8, 2.9, 6, 3);
      s.addText("💼 Modo HP-12C (RPN)", {
        x: 7.1,
        y: 3.05,
        w: 5.5,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Notação Polonesa Reversa\n• Pilha X / Y / Z / T visível\n• ENTER, x↔y, R↓, CHS, CLx\n• √x, 1/x e % financeiro (Y×X/100)",
        { x: 7.2, y: 3.5, w: 5.4, h: 2.2, fontSize: 11, color: WHITE, fontFace: "Arial" },
      );
      addCard(s, 0.5, 6.1, 12.3, 0.7);
      s.addText("✅ O corretor escolhe o modo conforme o perfil — calculadora simples ou padrão financeiro HP-12C", {
        x: 0.7,
        y: 6.22,
        w: 11.9,
        h: 0.5,
        fontSize: 12,
        bold: true,
        color: GOLD,
        align: "center",
        fontFace: "Arial",
      });
    }

    // SLIDE 16 — MARKETING
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("MÓDULO DE MARKETING", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Gerador de Anúncios + Luiza IA Marketing", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });
      addCard(s, 0.5, 1.4, 6, 4.6);
      s.addText("📢 Gerenciador de Anúncios IA", {
        x: 0.8,
        y: 1.6,
        w: 5.5,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Geração de imagens com IA (1080×1080)\n• Edição direta no editor visual\n• Templates de imobiliário de luxo\n• Carrosséis para Instagram\n• Texto + legenda + hashtags automáticos\n• Banco de imagens em galeria",
        { x: 0.9, y: 2.1, w: 5.4, h: 3.7, fontSize: 11, color: WHITE, fontFace: "Arial" },
      );
      addCard(s, 6.8, 1.4, 6, 4.6);
      s.addText("✨ Luiza Elite Marketing", {
        x: 7.1,
        y: 1.6,
        w: 5.5,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Assistente IA dedicada a conteúdo\n• Cria scripts para Reels e Stories\n• Sugere CTA e roteiros de prospecção\n• Gera legendas otimizadas por rede\n• Analisa imagens enviadas pelo corretor\n• Aprende com o portfólio do consultor",
        { x: 7.2, y: 2.1, w: 5.4, h: 3.7, fontSize: 11, color: WHITE, fontFace: "Arial" },
      );
      addCard(s, 0.5, 6.2, 12.3, 0.7);
      s.addText("✅ Duas frentes complementares: criação visual com IA + estratégia de conteúdo", {
        x: 0.7,
        y: 6.32,
        w: 11.9,
        h: 0.5,
        fontSize: 12,
        bold: true,
        color: GOLD,
        align: "center",
        fontFace: "Arial",
      });
    }

    // SLIDE 17 — INTEGRAÇÃO REDES SOCIAIS + WHATSAPP
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("INTEGRAÇÃO COM REDES SOCIAIS E WHATSAPP", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 20,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Publique e atenda direto da plataforma", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });
      const nets = [
        ["📘 Facebook", "Login OAuth oficial e publicação direta na página"],
        ["📸 Instagram", "Publicação de Feed e Carrosséis via Graph API"],
        ["💬 WhatsApp", "Envio de simulação, documentos e apresentação"],
      ];
      nets.forEach((n, i) => {
        const x = 0.5 + i * 4.2;
        addCard(s, x, 1.4, 4, 2.6);
        s.addText(n[0], {
          x: x + 0.2,
          y: 1.6,
          w: 3.6,
          h: 0.5,
          fontSize: 16,
          bold: true,
          color: GOLD,
          align: "center",
          fontFace: "Arial",
        });
        s.addText(n[1], {
          x: x + 0.2,
          y: 2.3,
          w: 3.6,
          h: 1.5,
          fontSize: 11,
          color: WHITE,
          align: "center",
          fontFace: "Arial",
        });
      });
      addCard(s, 0.5, 4.3, 12.3, 2.5);
      s.addText("🔗 Fluxo integrado", {
        x: 0.8,
        y: 4.5,
        w: 11.5,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "• Cria a arte no Marketing → publica no Facebook/Instagram em 1 clique\n• Gera a simulação → envia ao cliente por WhatsApp com PDF anexo\n• Documentos CAIXA (MO, Cadastral, CCA) → compartilháveis pelo WhatsApp\n• Apresentação institucional → link curto pronto para encaminhar",
        { x: 0.9, y: 5.0, w: 11.4, h: 1.7, fontSize: 11, color: WHITE, fontFace: "Arial" },
      );
    }

    // SLIDE 18 — LUIZA IA — ASSISTENTE DE SIMULAÇÃO
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("LUIZA ELITE — ASSISTENTE IA DE SIMULAÇÃO", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 20,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Concierge inteligente do corretor", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });
      addCard(s, 0.5, 1.4, 12.3, 1.2);
      s.addText("🤖 IA dedicada à simulação habitacional", {
        x: 0.8,
        y: 1.55,
        w: 11.5,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "Analisa simulações, sugere estratégias de fechamento e responde dúvidas técnicas sobre CAIXA, MCMV, SBPE, FGTS e Pró-Soluto.",
        { x: 0.8, y: 2.0, w: 11.5, h: 0.6, fontSize: 11, color: WHITE, fontFace: "Arial" },
      );
      const blocks = [
        [
          "📎 Multimodal",
          "• Recebe imagens (arrastar, colar, anexar)\n• Lê PDFs do empreendimento\n• Treina com tabelas e plantas",
        ],
        [
          "📊 Análise técnica",
          "• Compara SAC × PRICE\n• Avalia viabilidade e risco\n• Sugere melhor estratégia de entrada",
        ],
        [
          '📝 Comando "0"',
          "• Gera resumo executivo para o PDF\n• Texto direcionado ao cliente final\n• Tom de consultoria de alto nível",
        ],
        [
          "🎯 Treinamento contínuo",
          "• Base por empreendimento (Drive)\n• Aprende com fotos e tabelas\n• Mapa Mental de objeções",
        ],
      ];
      blocks.forEach((b, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 0.5 + col * 6.3;
        const y = 2.9 + row * 1.95;
        addCard(s, x, y, 6, 1.8);
        s.addText(b[0], {
          x: x + 0.25,
          y: y + 0.1,
          w: 5.5,
          h: 0.4,
          fontSize: 13,
          bold: true,
          color: GOLD,
          fontFace: "Arial",
        });
        s.addText(b[1], { x: x + 0.3, y: y + 0.55, w: 5.5, h: 1.2, fontSize: 10, color: WHITE, fontFace: "Arial" });
      });
    }

    // SLIDE 19 — CANAL DE SUGESTÕES
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("CANAL DE SUGESTÕES", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("A voz do corretor moldando o sistema", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });
      addCard(s, 0.5, 1.4, 12.3, 1.2);
      s.addText("💡 Canal Direto de Sugestões", {
        x: 0.8,
        y: 1.55,
        w: 11.5,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText(
        "Acessível pelo ícone de lâmpada no cabeçalho. Cada corretor envia ideias, críticas e melhorias direto para a equipe INFORMETEC.",
        { x: 0.8, y: 2.0, w: 11.5, h: 0.6, fontSize: 11, color: WHITE, fontFace: "Arial" },
      );
      const sugBlocks = [
        [
          "📝 Formulário Simples",
          "• Nome, WhatsApp e Email\n• Área de texto redimensionável (3.000 chars)\n• Anexar PDF até 10MB\n• Envio em 1 clique",
        ],
        [
          "🔒 Privacidade Garantida",
          "• Apenas administradores visualizam\n• Anexos em bucket privado\n• Conformidade LGPD\n• Tratamento confidencial",
        ],
      ];
      sugBlocks.forEach((b, i) => {
        const x = 0.5 + i * 6.3;
        addCard(s, x, 2.9, 6, 2);
        s.addText(b[0], {
          x: x + 0.25,
          y: 3.0,
          w: 5.5,
          h: 0.4,
          fontSize: 13,
          bold: true,
          color: GOLD,
          fontFace: "Arial",
        });
        s.addText(b[1], { x: x + 0.3, y: 3.5, w: 5.5, h: 1.4, fontSize: 10, color: WHITE, fontFace: "Arial" });
      });
      addCard(s, 1.5, 5.2, 10.3, 0.8);
      s.addText("✅ Evolução colaborativa: a próxima versão é construída com você", {
        x: 1.7,
        y: 5.4,
        w: 9.9,
        h: 0.4,
        fontSize: 12,
        bold: true,
        color: GOLD,
        align: "center",
        fontFace: "Arial",
      });
    }

    // SLIDE 20 — SEGURANÇA & ARQUITETURA 4.1
    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      addLogo(s);
      s.addText("SEGURANÇA & ARQUITETURA 4.1", {
        x: 1,
        y: 0.3,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: GOLD,
        fontFace: "Arial",
      });
      s.addText("Hardening completo e RBAC enterprise", {
        x: 0.5,
        y: 0.85,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: "888888",
        charSpacing: 4,
        fontFace: "Arial",
      });
      const secBlocks = [
        [
          "👮 RBAC — Controle de Papéis",
          "• 4 níveis: Admin, Gestor, Corretor, Visitante\n• Tabela dedicada user_roles\n• Funções SECURITY DEFINER no banco\n• Hook React reativo para permissões",
        ],
        [
          "🔐 Senhas com bcrypt",
          "• Migração de SHA-256 para bcrypt\n• Proteção HIBP (senhas vazadas)\n• PIN de 6 dígitos para corretores\n• Compatibilidade retroativa",
        ],
        [
          "🛡️ RLS Hardening",
          "• 15+ tabelas sensíveis protegidas\n• Acesso via Edge Functions\n• Isolamento entre tenants no CRM\n• Storage privado restrito",
        ],
        [
          "🏗️ Repository Layer",
          "• BaseRepository genérico para CRUD\n• Acesso a dados centralizado e tipado\n• Manutenção facilitada\n• Migração progressiva e segura",
        ],
      ];
      secBlocks.forEach((b, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 0.5 + col * 6.3;
        const y = 1.4 + row * 2.0;
        addCard(s, x, y, 6, 1.85);
        s.addText(b[0], {
          x: x + 0.25,
          y: y + 0.1,
          w: 5.5,
          h: 0.4,
          fontSize: 13,
          bold: true,
          color: GOLD,
          fontFace: "Arial",
        });
        s.addText(b[1], { x: x + 0.3, y: y + 0.55, w: 5.5, h: 1.25, fontSize: 10, color: WHITE, fontFace: "Arial" });
      });
      addCard(s, 1.5, 5.55, 10.3, 0.8);
      s.addText("✅ 22 vulnerabilidades corrigidas — plataforma pronta para escala enterprise", {
        x: 1.7,
        y: 5.75,
        w: 9.9,
        h: 0.4,
        fontSize: 12,
        bold: true,
        color: GOLD,
        align: "center",
        fontFace: "Arial",
      });
    }

    // SLIDE 21 — CONTATO

    {
      const s = pptx.addSlide();
      s.background = { color: BG };
      if (logoBase64) {
        s.addImage({ data: logoBase64, x: 5.15, y: 0.5, w: 3, h: 3, rounding: true });
      }
      s.addText("COMECE AGORA!", {
        x: 0.5,
        y: 3.5,
        w: 12.3,
        h: 1,
        fontSize: 36,
        bold: true,
        color: GOLD,
        align: "center",
        fontFace: "Arial",
      });
      s.addText("Entre em contato para ativar sua licença", {
        x: 0.5,
        y: 3,
        w: 12.3,
        h: 0.5,
        fontSize: 14,
        color: WHITE,
        align: "center",
        fontFace: "Arial",
      });

      addCard(s, 3.5, 3.8, 6.3, 1);
      s.addText("📱 (11) 94677-0656 — Lourenço Junior — WhatsApp", {
        x: 3.8,
        y: 3.95,
        w: 5.7,
        h: 0.6,
        fontSize: 16,
        bold: true,
        color: GOLD,
        align: "center",
        fontFace: "Arial",
      });

      addCard(s, 3.5, 5, 6.3, 0.7);
      s.addText("🌐 simuladorcorretorelite.com.br", {
        x: 3.8,
        y: 5.1,
        w: 5.7,
        h: 0.4,
        fontSize: 13,
        color: GOLD_LIGHT,
        align: "center",
        fontFace: "Arial",
      });

      s.addText("INFORMETEC — Implantação e Suporte | Rodrigo Dias — Gestão TI", {
        x: 0.5,
        y: 6.2,
        w: 12.3,
        h: 0.4,
        fontSize: 9,
        color: "666666",
        align: "center",
        fontFace: "Arial",
      });
    }

    pptx.writeFile({ fileName: "Simulador_Corretor_Elite_4.0_Apresentacao.pptx" });
  };

  return (
    <div className="min-h-screen" style={{ background: "hsl(220 70% 8%)" }}>
      {/* Toolbar — hidden on print */}
      <div
        className="print:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-2 border-b"
        style={{ background: "hsl(220 70% 10%)", borderColor: "hsl(42 60% 55% / 0.2)" }}
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-xs"
          style={{ color: "hsl(42 60% 55%)" }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(42 60% 55%)" }}>
          Apresentação — {current + 1}/{slides.length}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/imagens")}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold"
            style={{ background: "hsl(220 70% 25%)", color: "hsl(42 60% 55%)" }}
          >
            <Images className="w-3.5 h-3.5" /> Imagens
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold"
            style={{ background: "#25D366", color: "#fff" }}
          >
            <Share2 className="w-3.5 h-3.5" /> WhatsApp
          </button>
          <button
            onClick={handlePptx}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold"
            style={{ background: "#D04423", color: "#fff" }}
          >
            <Download className="w-3.5 h-3.5" /> PowerPoint
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold"
            style={{ background: "hsl(42 60% 55%)", color: "hsl(220 70% 10%)" }}
          >
            <Printer className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Interactive view — hidden on print */}
      <div className="print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Slide */}
          <div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "hsl(220 70% 12%)", border: "1px solid hsl(42 60% 55% / 0.15)", minHeight: "480px" }}
          >
            <div className="px-6 pt-5 pb-2">
              <h2 className="text-xl font-extrabold uppercase tracking-wider" style={{ color: "hsl(42 60% 55%)" }}>
                {slides[current].title}
              </h2>
              <p className="text-[11px] tracking-[3px] uppercase" style={{ color: "hsl(42 60% 55% / 0.5)" }}>
                {slides[current].subtitle}
              </p>
            </div>
            <div className="px-2 pb-4" style={{ minHeight: "400px" }}>
              {slides[current].content}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setCurrent(Math.max(0, current - 1))}
              disabled={current === 0}
              className="flex items-center gap-1 px-4 py-2 rounded text-xs font-bold disabled:opacity-30 transition-opacity"
              style={{ background: "hsl(42 60% 55% / 0.15)", color: "hsl(42 60% 55%)" }}
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className="w-2.5 h-2.5 rounded-full transition-all"
                  style={{ background: i === current ? "hsl(42 60% 55%)" : "hsl(42 60% 55% / 0.2)" }}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrent(Math.min(slides.length - 1, current + 1))}
              disabled={current === slides.length - 1}
              className="flex items-center gap-1 px-4 py-2 rounded text-xs font-bold disabled:opacity-30 transition-opacity"
              style={{ background: "hsl(42 60% 55% / 0.15)", color: "hsl(42 60% 55%)" }}
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Print version — all slides */}
      <div className="hidden print:block">
        {slides.map((slide, i) => (
          <div
            key={i}
            className="page-break-after"
            style={{
              pageBreakAfter: "always",
              background: "hsl(220 70% 12%)",
              minHeight: "100vh",
              padding: "40px",
              color: "#fff",
            }}
          >
            <div
              className="flex items-center gap-3 mb-2 pb-2"
              style={{ borderBottom: "2px solid hsl(42 60% 55% / 0.3)" }}
            >
              <img src="https://pub-a3cfd193eb6748ec96b423de3caf804f.r2.dev/logo-elite.jpg" alt="Elite" className="w-10 h-10 rounded object-cover" />
              <div>
                <h2 className="text-lg font-extrabold uppercase tracking-wider" style={{ color: "hsl(42 60% 55%)" }}>
                  {slide.title}
                </h2>
                <p className="text-[9px] tracking-[3px] uppercase" style={{ color: "hsl(42 60% 55% / 0.5)" }}>
                  {slide.subtitle}
                </p>
              </div>
            </div>
            {slide.content}
            <div className="mt-auto pt-4 text-center">
              <p className="text-[8px]" style={{ color: "hsl(0 0% 40%)" }}>
                Simulador Corretor de Elite 4.0 — INFORMETEC | Página {i + 1} de {slides.length}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApresentacaoPage;
