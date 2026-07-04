/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { X, Printer, Send } from "lucide-react";

interface DocumentModalProps {
  type: string;
  fields: any;
  adminData: any;
  onClose: () => void;
}

export default function DocumentModal({ type, fields, adminData, onClose }: DocumentModalProps) {
  // Common states initialized from fields
  const [cliente, setCliente] = useState(fields.infoCli || "");
  const [cpf, setCpf] = useState(fields.infoCpf || "");
  const [rg, setRg] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("Solteiro");
  const [regimeBens, setRegimeBens] = useState("");
  const [pai, setPai] = useState("");
  const [mae, setMae] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cep, setCep] = useState("");
  const [cidade, setCidade] = useState("São Paulo");
  const [uf, setUf] = useState("SP");
  const [profissao, setProfissao] = useState("");
  const [tipoRenda, setTipoRenda] = useState("CLT");
  const [rendaMensal, setRendaMensal] = useState(fields.infoRenda || "");
  const [empregador, setEmpregador] = useState("");
  const [cnpjEmpregador, setCnpjEmpregador] = useState("");
  const [dataAdmissao, setDataAdmissao] = useState("");
  const [possui3AnosFGTS, setPossui3AnosFGTS] = useState("SIM");
  const [possuiDependente, setPossuiDependente] = useState("NÃO");

  // Property & calculation states
  const [empreendimento, setEmpreendimento] = useState(fields.infoEmp || "");
  const [torre, setTorre] = useState(fields.infoAndar || "");
  const [unidade, setUnidade] = useState(fields.infoApto || "");
  const [corretor, setCorretor] = useState(fields.infoCons || "");
  const [creci, setCreci] = useState(fields.infoCreci || "");
  const [valorVenda, setValorVenda] = useState(fields.avaliacao || fields.lancamento || "");
  const [financiamento, setFinanciamento] = useState(fields.aprovacao || "");
  const [fgts, setFgts] = useState(fields.fgts || "");
  const [subsidio, setSubsidio] = useState(fields.subsidio || "");
  const [sinal, setSinal] = useState(fields.atoCliente || "");

  // Pós-obras values
  const [percMaxPosObras, setPercMaxPosObras] = useState(fields.percMaxPosObras || "0");
  const [planoMesesPosObras, setPlanoMesesPosObras] = useState(fields.planoMesesPosObras || "0");

  // Mo43000 / CAIXA MO Specifics
  const [codUL, setCodUL] = useState("31.422.572");
  const [codAgVinc, setCodAgVinc] = useState("4300");
  const [nomeAgencia, setNomeAgencia] = useState("Venda Segura Corretor Elite");
  const [conjuge, setConjuge] = useState("");
  const [cpfConjuge, setCpfConjuge] = useState("");

  // Letter specifics
  const [correspondenteAnterior, setCorrespondenteAnterior] = useState("");
  const [telefoneContato, setTelefoneContato] = useState("");

  // Auto-calculated dates
  const [dataTexto, setDataTexto] = useState("");
  const [hojeISO, setHojeISO] = useState("");

  useEffect(() => {
    const hoje = new Date();
    const diaStr = hoje.getDate().toString().padStart(2, "0");
    const meses = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    const mesNome = meses[hoje.getMonth()];
    setDataTexto(`São Paulo, ${diaStr} de ${mesNome} de ${hoje.getFullYear()}`);
    setHojeISO(hoje.toISOString().split("T")[0]);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    let text = `Olá ${cliente}, segue documento preenchido para sua conferência.`;
    if (type === "mo") {
      text = `Olá ${cliente}, segue a Ficha de Autorização para Pesquisa Cadastral (Ficha MO) preenchida e pronta para impressão.`;
    } else if (type === "cadastral" || type === "editavel") {
      text = `Olá ${cliente}, segue sua Ficha Cadastral Caixa preenchida para prosseguirmos com a sua simulação técnica e aprovação.`;
    } else if (type === "cancelamento") {
      text = `Olá ${cliente}, segue a Carta de Cancelamento SICAQ preenchida e pronta para assinatura.`;
    }
    const phone = adminData?.whatsapp?.replace(/\D/g, "") || "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 md:p-8 print:p-0 print:bg-white print:backdrop-blur-none">
      {/* Control panel header - hidden in print */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto bg-slate-900 border border-slate-800 text-white rounded-t-xl px-5 py-4 shadow-xl print:hidden shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Visualização e Preenchimento</span>
          <h3 className="text-base font-black text-white">
            {type === "mo" && "Ficha MO · Autorização Pesquisa Cadastral"}
            {type === "cadastral" && "Ficha Cadastral Habitacional"}
            {type === "editavel" && "Ficha Cadastral de Cliente (Modo Livre)"}
            {type === "parentesco" && "Declaração de Parentesco e Ausência de Rendimentos"}
            {type === "cancelamento" && "Carta de Cancelamento SICAQ"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 transition-all text-xs cursor-pointer"
          >
            <Printer size={14} /> Imprimir / PDF
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 transition-all text-xs cursor-pointer"
          >
            <Send size={14} /> WhatsApp
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Sheet canvas container */}
      <div className="flex-1 max-w-4xl w-full mx-auto bg-white border-x border-b border-slate-200 text-slate-900 rounded-b-xl shadow-2xl p-6 md:p-12 overflow-y-auto print:border-none print:shadow-none print:p-0">
        
        {/* Style block dedicated to printable page styles when rendering inside browser */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; color: black !important; }
            .print\\:hidden, header, footer, .fixed, .absolute { display: none !important; }
            input, select, textarea { border: none !important; background: transparent !important; padding: 0 !important; color: black !important; -webkit-appearance: none; -moz-appearance: none; appearance: none; }
            input::placeholder { color: transparent !important; }
            .print\\:p-0 { padding: 0 !important; }
            .print\\:border-none { border: none !important; }
            .print\\:shadow-none { box-shadow: none !important; }
          }
        `}} />

        {/* ==================== 1. FICHA MO (Autorização Pesquisa Cadastral) ==================== */}
        {type === "mo" && (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b-2 border-blue-900 pb-4">
              <span className="text-3xl font-black text-blue-900 tracking-tighter">CAIXA</span>
              <div className="border border-slate-800 px-3 py-1 text-center font-mono text-[9px] text-slate-800">
                Grau de sigilo<br /><strong>#PUBLICO</strong>
              </div>
            </div>

            <h1 className="text-center font-bold text-sm uppercase text-blue-900 tracking-wider">
              Autorização para Pesquisa Cadastral de Cliente – Rede Parceira
            </h1>

            <div className="flex gap-4 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-400 text-blue-900" /> UL - Unidade Lotérica
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-400 text-blue-900" /> CCA - Correspondente CAIXA AQUI
              </label>
            </div>

            <table className="w-full border-collapse border border-slate-800 text-xs">
              <tbody>
                <tr>
                  <td className="border border-slate-800 p-2 w-1/4">
                    <span className="block text-[9px] uppercase font-bold text-slate-500">Cód. UL/CCA</span>
                    <input type="text" value={codUL} onChange={(e) => setCodUL(e.target.value)} className="w-full font-bold text-slate-800 border-b border-dashed border-slate-300 py-0.5 outline-none focus:border-blue-900" />
                  </td>
                  <td className="border border-slate-800 p-2 w-1/4">
                    <span className="block text-[9px] uppercase font-bold text-slate-500">Cód Ag. Vinc.</span>
                    <input type="text" value={codAgVinc} onChange={(e) => setCodAgVinc(e.target.value)} className="w-full font-bold text-slate-800 border-b border-dashed border-slate-300 py-0.5 outline-none focus:border-blue-900" />
                  </td>
                  <td className="border border-slate-800 p-2 w-1/2">
                    <span className="block text-[9px] uppercase font-bold text-slate-500">Nome da Agência</span>
                    <input type="text" value={nomeAgencia} onChange={(e) => setNomeAgencia(e.target.value)} className="w-full font-bold text-slate-800 border-b border-dashed border-slate-300 py-0.5 outline-none focus:border-blue-900" />
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="space-y-2">
              <h2 className="font-bold text-xs uppercase text-blue-900">Pesquisa Cadastral do(s) Cliente(es):</h2>
              <table className="w-full border-collapse border border-slate-800 text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-800 p-2 text-left">Nome do Cliente</th>
                    <th className="border border-slate-800 p-2 text-center w-1/3">CPF/CNPJ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-800 p-2">
                      <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nome do proponente" className="w-full border-b border-dashed border-slate-300 outline-none focus:border-blue-900" />
                    </td>
                    <td className="border border-slate-800 p-2">
                      <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" className="w-full text-center border-b border-dashed border-slate-300 outline-none focus:border-blue-900" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2">
                      <input type="text" value={conjuge} onChange={(e) => setConjuge(e.target.value)} placeholder="Nome do cônjuge (se houver)" className="w-full border-b border-dashed border-slate-300 outline-none focus:border-blue-900" />
                    </td>
                    <td className="border border-slate-800 p-2">
                      <input type="text" value={cpfConjuge} onChange={(e) => setCpfConjuge(e.target.value)} placeholder="CPF cônjuge" className="w-full text-center border-b border-dashed border-slate-300 outline-none focus:border-blue-900" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-[11px] leading-relaxed space-y-3 text-slate-800 text-justify">
              <p className="font-bold text-blue-900 italic">Autorizo a CAIXA ECONÔMICA FEDERAL:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Nos termos das Resoluções BACEN nº 3.920/10 e 5.037/22:
                  <ul className="list-circle pl-5 space-y-0.5">
                    <li>a consultar as informações consolidadas a respeito das operações de crédito e câmbio constantes em meu nome no SCR - BACEN, gerido pelo Banco Central do Brasil, ou dos sistemas que venham a complementá-lo ou a substituí-lo;</li>
                    <li>a fornecer informações sobre as operações de crédito e câmbio por mim realizadas com a CAIXA, no sentido de compor o cadastro do SCR - BACEN;</li>
                    <li>ao arquivamento dos meus dados cadastrais.</li>
                  </ul>
                </li>
                <li>Respeitadas as disposições legais em vigor, à consulta e arquivamento dos meus dados cadastrais e de idoneidade nos serviços de proteção ao crédito.</li>
              </ul>

              <p className="font-bold text-blue-900 italic">Estou ciente de que:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>o SCR - BACEN é um cadastro que visa prover o BACEN de informações para fins de monitoramento de crédito no sistema financeiro nacional;</li>
                <li>poderei ter acesso aos dados constantes em meu nome no SCR por meio do endereço oficial do BACEN;</li>
                <li>os pedidos de correção ou exclusão de dados devem ser dirigidos à instituição responsável pela remessa das informações ao BACEN.</li>
              </ol>
            </div>

            <div className="flex gap-2 items-center text-xs mt-6">
              <span className="font-bold text-slate-700">Local/Data:</span>
              <input type="text" value={dataTexto} onChange={(e) => setDataTexto(e.target.value)} className="border-b border-dashed border-slate-400 px-2 py-0.5 w-64 outline-none focus:border-blue-900" />
            </div>

            <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
              <div className="space-y-1">
                <div className="border-t border-slate-900 w-full pt-1"></div>
                <span className="font-bold text-slate-800">Assinatura Cliente</span>
              </div>
              <div className="space-y-1">
                <div className="border-t border-slate-900 w-full pt-1"></div>
                <span className="font-bold text-slate-800">Assinatura Cliente / Cônjuge</span>
              </div>
              <div className="col-span-2 pt-6">
                <div className="border-t border-slate-900 w-2/3 mx-auto pt-1"></div>
                <span className="block text-[10px] text-slate-500 leading-tight">
                  Assinatura sob carimbo do responsável pela prospecção do produto - Correspondente CAIXA AQUI, se CCA
                </span>
              </div>
            </div>

            <div className="border-t-2 border-blue-900 pt-3 text-[9px] text-slate-500 leading-tight">
              <strong>SAC CAIXA:</strong> 0800 726 0101 · <strong>Ouvidoria:</strong> 0800 725 7474 · <strong>caixa.gov.br</strong>
            </div>
          </div>
        )}

        {/* ==================== 2. FICHA CADASTRAL (CAIXA / STANDARD) ==================== */}
        {(type === "cadastral" || type === "editavel") && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b-2 border-blue-900 pb-3">
              <span className="text-2xl font-black text-blue-900">CAIXA</span>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Crédito Habitacional</span>
            </div>

            <div className="text-center">
              <h1 className="font-bold text-base text-blue-900 tracking-wider">FICHA CADASTRAL DE PROPONENTE</h1>
              <span className="block text-amber-600 font-extrabold text-xs tracking-widest mt-1">SIMULAÇÃO E FECHAMENTO ELITE</span>
            </div>

            {/* Imovel details */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase">Empreendimento</label>
                <input type="text" value={empreendimento} onChange={(e) => setEmpreendimento(e.target.value)} className="w-full font-bold text-slate-800 border-b border-slate-300 py-0.5 outline-none focus:border-blue-900" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase">Torre</label>
                <input type="text" value={torre} onChange={(e) => setTorre(e.target.value)} className="w-full font-bold text-slate-800 border-b border-slate-300 py-0.5 outline-none focus:border-blue-900" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase">Unidade</label>
                <input type="text" value={unidade} onChange={(e) => setUnidade(e.target.value)} className="w-full font-bold text-slate-800 border-b border-slate-300 py-0.5 outline-none focus:border-blue-900" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase">Corretor / CRECI</label>
                <input type="text" value={`${corretor} ${creci}`} onChange={(e) => setCorretor(e.target.value)} className="w-full font-bold text-slate-800 border-b border-slate-300 py-0.5 outline-none focus:border-blue-900" />
              </div>
            </div>

            {/* Section 1 */}
            <div className="space-y-3">
              <h3 className="bg-blue-900 text-white font-bold text-xs px-3 py-1.5 uppercase rounded">1. Identificação do Proponente Principal</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Nome Completo</label>
                  <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900 text-sm font-semibold" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">CPF</label>
                  <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900 text-sm font-semibold" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">RG / UF</label>
                  <input type="text" value={rg} onChange={(e) => setRg(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Data Nascimento</label>
                  <input type="date" value={nascimento} onChange={(e) => setNascimento(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Estado Civil</label>
                  <select value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900">
                    <option value="Solteiro">Solteiro(a)</option>
                    <option value="Casado">Casado(a)</option>
                    <option value="Divorciado">Divorciado(a)</option>
                    <option value="Viúvo">Viúvo(a)</option>
                    <option value="União Estável">União Estável</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Regime de Bens</label>
                  <input type="text" value={regimeBens} onChange={(e) => setRegimeBens(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Nome do Pai</label>
                  <input type="text" value={pai} onChange={(e) => setPai(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Nome da Mãe</label>
                  <input type="text" value={mae} onChange={(e) => setMae(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">WhatsApp</label>
                  <input type="text" value={celular} onChange={(e) => setCelular(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">E-mail</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h3 className="bg-blue-900 text-white font-bold text-xs px-3 py-1.5 uppercase rounded">2. Dados de Residência</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Endereço Residencial</label>
                  <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Número</label>
                  <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Complemento</label>
                  <input type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Bairro</label>
                  <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">CEP</label>
                  <input type="text" value={cep} onChange={(e) => setCep(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Cidade</label>
                  <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">UF</label>
                  <input type="text" value={uf} onChange={(e) => setUf(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h3 className="bg-blue-900 text-white font-bold text-xs px-3 py-1.5 uppercase rounded">3. Dados Financeiros & Renda</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Profissão / Cargo</label>
                  <input type="text" value={profissao} onChange={(e) => setProfissao(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Tipo Comprovação</label>
                  <select value={tipoRenda} onChange={(e) => setTipoRenda(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900">
                    <option value="CLT">CLT (Registro em Carteira)</option>
                    <option value="Autônomo">Autônomo (Extrato / IR)</option>
                    <option value="Empresário">Empresário (Pró-Labore)</option>
                    <option value="Servidor Público">Servidor Público</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Renda Mensal (R$)</label>
                  <input type="text" value={rendaMensal} onChange={(e) => setRendaMensal(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900 font-bold" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Nome da Empresa</label>
                  <input type="text" value={empregador} onChange={(e) => setEmpregador(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">CNPJ Empregador</label>
                  <input type="text" value={cnpjEmpregador} onChange={(e) => setCnpjEmpregador(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Data de Admissão</label>
                  <input type="date" value={dataAdmissao} onChange={(e) => setDataAdmissao(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">3 Anos trabalho FGTS?</label>
                  <select value={possui3AnosFGTS} onChange={(e) => setPossui3AnosFGTS(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900">
                    <option value="SIM">SIM</option>
                    <option value="NÃO">NÃO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Possui Dependente / Co-proponente?</label>
                  <select value={possuiDependente} onChange={(e) => setPossuiDependente(e.target.value)} className="w-full border-b border-slate-300 py-1 outline-none focus:border-blue-900">
                    <option value="SIM">SIM</option>
                    <option value="NÃO">NÃO</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h3 className="bg-blue-900 text-white font-bold text-xs px-3 py-1.5 uppercase rounded">4. Resumo da Proposta de Financiamento Habitacional</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs bg-slate-50 p-4 border border-slate-200 rounded-lg">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Valor de Venda</label>
                  <input type="text" value={valorVenda} onChange={(e) => setValorVenda(e.target.value)} className="w-full font-bold text-slate-800 border-b border-slate-300 py-0.5 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Financiamento Caixa</label>
                  <input type="text" value={financiamento} onChange={(e) => setFinanciamento(e.target.value)} className="w-full font-bold text-blue-700 border-b border-slate-300 py-0.5 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Uso de FGTS</label>
                  <input type="text" value={fgts} onChange={(e) => setFgts(e.target.value)} className="w-full font-bold text-slate-800 border-b border-slate-300 py-0.5 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Subsídio Habitacional</label>
                  <input type="text" value={subsidio} onChange={(e) => setSubsidio(e.target.value)} className="w-full font-bold text-slate-800 border-b border-slate-300 py-0.5 outline-none focus:border-blue-900" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Ato / Recursos Próprios</label>
                  <input type="text" value={sinal} onChange={(e) => setSinal(e.target.value)} className="w-full font-bold text-amber-600 border-b border-slate-300 py-0.5 outline-none focus:border-blue-900" />
                </div>
              </div>
            </div>

            {/* Section 5 - POS OBRAS CALCULATIONS INTEGRATION */}
            <div className="space-y-3">
              <h3 className="bg-amber-600 text-white font-bold text-xs px-3 py-1.5 uppercase rounded">5. Resumo do Plano de Obras &amp; Pós-Obras</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs bg-amber-50 p-4 border border-amber-200 rounded-lg">
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase">Percentual Pós-Obras</label>
                  <div className="flex gap-1 items-center">
                    <input type="text" value={percMaxPosObras} onChange={(e) => setPercMaxPosObras(e.target.value)} className="w-full font-bold text-slate-800 border-b border-amber-300 py-0.5 outline-none focus:border-amber-600" />
                    <span className="font-bold text-slate-700">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase">Meses Plano Pós-Obras</label>
                  <input type="text" value={planoMesesPosObras} onChange={(e) => setPlanoMesesPosObras(e.target.value)} className="w-full font-bold text-slate-800 border-b border-amber-300 py-0.5 outline-none focus:border-amber-600" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase">Total Estimado Pós-Obras</label>
                  <div className="font-bold text-slate-800 py-1 border-b border-amber-300">
                    R$ {(parseCurrency(valorVenda) * (parseFloat(percMaxPosObras) / 100)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase">Prestação Estimada Pós-Obras</label>
                  <div className="font-bold text-amber-700 py-1 border-b border-amber-300">
                    R$ {(parseInt(planoMesesPosObras) > 0 ? (parseCurrency(valorVenda) * (parseFloat(percMaxPosObras) / 100)) / parseInt(planoMesesPosObras) : 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} /mês
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end pt-8 text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-500">{dataTexto}</span>
              <div className="border-t border-slate-900 w-64 text-center pt-1 mt-8">
                <span className="font-bold text-slate-800">Assinatura do Proponente</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 3. DECLARACAO PARENTESCO ==================== */}
        {type === "parentesco" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b-2 border-blue-900 pb-3">
              <span className="text-2xl font-black text-blue-900">CAIXA</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">#EXTERNO.CONFIDENCIAL</span>
            </div>

            <div className="text-right font-mono text-xs text-slate-500">Mo43000</div>

            <h1 className="text-center font-bold text-base text-blue-900 tracking-wider uppercase">
              Declaração de Parentesco, Residência e Ausência de Rendimentos
            </h1>

            <div className="text-xs space-y-4 text-slate-800 leading-relaxed text-justify">
              <p>
                Eu, <input type="text" placeholder="Nome completo do parente" className="border-b border-dashed border-slate-400 font-bold px-1 py-0.5 outline-none focus:border-blue-900 w-80" />,
                CPF nº <input type="text" placeholder="000.000.000-00" className="border-b border-dashed border-slate-400 font-bold px-1 py-0.5 text-center outline-none focus:border-blue-900 w-36" />,
                estado civil <input type="text" placeholder="Solteiro(a)" className="border-b border-dashed border-slate-400 font-bold px-1 py-0.5 text-center outline-none focus:border-blue-900 w-24" />,
                declaro que sou <input type="text" placeholder="Grau de parentesco" className="border-b border-dashed border-slate-400 font-bold px-1 py-0.5 text-center outline-none focus:border-blue-900 w-32" />
                do proponente <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} className="border-b border-dashed border-slate-400 font-bold px-1 py-0.5 outline-none focus:border-blue-900 w-72" />,
                CPF nº <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} className="border-b border-dashed border-slate-400 font-bold px-1 py-0.5 text-center outline-none focus:border-blue-900 w-36" />, com quem resido no mesmo endereço há pelo menos 6 (seis) meses.
              </p>

              <p>
                Declaro ainda que não possuo nenhum tipo de rendimento, seja renda formal ou informal, exceto os benefícios temporários de natureza indenizatória, assistencial ou previdenciária, como auxílio-doença, auxílio-acidente, seguro-desemprego, benefício de prestação continuada (BPC) e benefício do Programa Bolsa Família, ou outros que vierem a substituí-los de acordo com a Lei 14.620 de 13/07/2023 e dependo financeiramente do proponente acima qualificado.
              </p>

              <p>
                Declaro também que não participo como dependente de nenhum outro contrato de financiamento habitacional e não possuo financiamento ativo no SFH.
              </p>

              <div className="bg-slate-50 p-4 border border-dashed border-slate-300 rounded">
                <span className="block text-[10px] font-bold text-slate-500 italic mb-2">(Se o parente for casado, preencha o trecho abaixo)</span>
                <p className="m-0 leading-normal">
                  Eu, <input type="text" placeholder="Nome do cônjuge do parente" className="border-b border-dashed border-slate-400 px-1 py-0.5 outline-none focus:border-blue-900 w-72 bg-transparent" />,
                  declaro que também não possuo nenhum tipo de rendimento, seja renda formal ou informal, exceto os benefícios temporários previstos na legislação federal aplicável.
                </p>
              </div>

              <h4 className="font-bold text-slate-900 uppercase text-[11px] mt-4">Responsabilidade pelas Informações Declaradas</h4>
              <p>
                Responsabilizo-me pela exatidão e veracidade das informações declaradas e estou ciente de que, se falsas as declarações, ficarei sujeito às penas da lei, ficando, ainda, obrigado(a) a devolver os valores indevidamente sacados da conta vinculada do FGTS e/ou descontos concedidos pelo FGTS, com a consequente cobrança administrativa/judicial.
              </p>

              <div className="flex gap-2 items-center text-xs pt-4">
                <span className="font-bold text-slate-700">Data:</span>
                <input type="date" value={hojeISO} onChange={(e) => setHojeISO(e.target.value)} className="border-b border-dashed border-slate-400 px-2 py-0.5 w-48 outline-none focus:border-blue-900" />
              </div>

              <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
                <div className="space-y-1">
                  <div className="border-t border-slate-900 w-full pt-1"></div>
                  <span className="font-bold text-slate-800">Assinatura do Parente</span>
                </div>
                <div className="space-y-1">
                  <div className="border-t border-slate-900 w-full pt-1"></div>
                  <span className="font-bold text-slate-800">Assinatura do Cônjuge do Parente</span>
                </div>
                <div className="col-span-2 pt-6">
                  <div className="border-t border-slate-900 w-1/2 mx-auto pt-1"></div>
                  <span className="font-bold text-slate-800 block">Assinatura do Proponente</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 text-[10px] text-center text-slate-400">
              Mo43000 — Página 1 de 1
            </div>
          </div>
        )}

        {/* ==================== 4. CARTA DE CANCELAMENTO ==================== */}
        {type === "cancelamento" && (
          <div className="space-y-6 text-xs text-slate-900 font-serif md:px-6">
            <div className="text-center space-y-1 font-sans">
              <h1 className="font-bold text-base uppercase tracking-wide text-slate-900">À CAIXA ECONÔMICA FEDERAL</h1>
              <h2 className="text-xs font-bold text-slate-600">A/C: Correspondente Caixa Aqui (CCA) / Gerência de Habitação</h2>
            </div>

            <div className="border-b border-slate-300 pb-3 pt-6 font-sans">
              <strong>Assunto: Solicitação de Cancelamento de Avaliação / Cadastro SICAQ</strong>
            </div>

            <div className="space-y-4 leading-relaxed text-justify">
              <p>
                Eu, <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} className="border-b border-dashed border-slate-400 font-bold text-blue-900 px-1 py-0.5 outline-none focus:border-blue-900 w-72" />,
                inscrito(a) no CPF sob o nº <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} className="border-b border-dashed border-slate-400 font-bold text-blue-900 px-1 py-0.5 text-center outline-none focus:border-blue-900 w-36" />
                e portador(a) do RG nº <input type="text" value={rg} onChange={(e) => setRg(e.target.value)} placeholder="RG do cliente" className="border-b border-dashed border-slate-400 font-bold text-blue-900 px-1 py-0.5 text-center outline-none focus:border-blue-900 w-32" />, 
                venho por meio desta solicitar formalmente o <strong>CANCELAMENTO DE TODAS AS AVALIAÇÕES DE RISCO DE CADASTROS</strong> 
                realizados em meu nome no sistema SICAQ (CCA), vinculados ao Correspondente Caixa Aqui 
                <input type="text" value={correspondenteAnterior} onChange={(e) => setCorrespondenteAnterior(e.target.value)} placeholder="Nome do Correspondente Anterior" className="border-b border-dashed border-slate-400 font-bold text-blue-900 px-1 py-0.5 outline-none focus:border-blue-900 w-64" /> (Correspondente Anterior).
              </p>

              <p>
                Declaro que desejo realizar a desvinculação da referida unidade/proposta para dar continuidade ao processo através de outro Correspondente Caixa Aqui ou agência física da Caixa Econômica Federal, sem impedimentos para que seja realizada uma nova avaliação.
              </p>

              <p>
                Estou plenamente ciente de que as avaliações no SICAQ têm prazo de validade determinado (geralmente de 180 dias) e que a alteração ou reapresentação de dados cadastrais pode resultar na necessidade de nova análise documental.
              </p>

              <p>
                Solicito que este cancelamento seja efetivado no sistema com a maior brevidade possível, a fim de evitar atrasos no andamento do meu financiamento habitacional.
              </p>

              <div className="text-center pt-8 font-sans">
                <input type="text" value={dataTexto} onChange={(e) => setDataTexto(e.target.value)} className="border-b border-dashed border-slate-400 text-center font-bold px-2 py-0.5 w-80 outline-none focus:border-blue-900" />
              </div>

              <div className="flex flex-col items-center text-center pt-12 space-y-1 font-sans">
                <div className="border-t border-slate-900 w-80 pt-1"></div>
                <span className="font-bold text-sm uppercase text-slate-800">{cliente || "[NOME DO CLIENTE]"}</span>
                <span className="text-[10px] text-slate-500">Proponente Comprador(a)</span>
                <div className="pt-4 flex items-center gap-1 text-[11px]">
                  <span>Telefone de Contato:</span>
                  <input type="text" value={telefoneContato} onChange={(e) => setTelefoneContato(e.target.value)} placeholder="(00) 00000-0000" className="border-b border-dashed border-slate-400 px-2 py-0.5 w-40 outline-none focus:border-blue-900 font-bold text-blue-900" />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Utility to parse currency values
function parseCurrency(v: any): number {
  if (!v) return 0;
  if (typeof v === "number") return v;
  const clean = v.replace(/R\$\s?/, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(clean) || 0;
}
