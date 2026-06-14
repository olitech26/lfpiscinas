import React, { useEffect, useMemo, useState } from "react";
import { dataBR, moeda, supabase } from "../supabaseClient";
import PesquisaCrudModulo from "./PesquisaCrudModulo";

function statusPagamento(a) {
  const sp = String(a.status_pagamento || "").toLowerCase();
  const saldo = Number(a.saldo || 0);
  const total = Number(a.total || 0);
  if (sp === "pago" || (saldo <= 0 && total > 0)) return "pago";
  if (sp === "parcial") return "parcial";
  if (String(a.status || "").toLowerCase() === "cancelado") return "cancelado";
  return "pendente";
}

const vazioMov = {
  tipo: "entrada",
  descricao: "",
  cliente_nome: "",
  categoria: "",
  valor: 0,
  forma_pagamento: "",
  status: "pago",
  data_movimento: new Date().toISOString().slice(0, 10),
  data_vencimento: "",
  observacoes: ""
};

export default function Financeiro() {
  const [aba, setAba] = useState("consulta");
  const [agendamentos, setAgendamentos] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [formas, setFormas] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [vencimentoInicio, setVencimentoInicio] = useState("");
  const [vencimentoFim, setVencimentoFim] = useState("");
  const [movForm, setMovForm] = useState(vazioMov);
  const [editandoMov, setEditandoMov] = useState(null);

  async function carregar() {
    const [age, mov, pag] = await Promise.all([
      supabase.from("agendamentos").select("*").order("data_agendamento", { ascending: false }),
      supabase.from("financeiro_movimentos").select("*").order("data_movimento", { ascending: false }),
      supabase.from("pagamentos").select("*").order("nome", { ascending: true })
    ]);
    if (age.error) alert("Erro ao carregar financeiro dos clientes: " + age.error.message);
    if (mov.error) alert("Erro ao carregar movimentos: " + mov.error.message);
    if (pag.error) alert("Erro ao carregar formas de pagamento: " + pag.error.message);
    setAgendamentos(age.data || []);
    setMovimentos(mov.data || []);
    setFormas(pag.data || []);
  }

  useEffect(() => { carregar(); }, []);

  const consulta = useMemo(() => {
    const termo = buscaCliente.trim().toLowerCase();
    return agendamentos.filter((a) => {
      const st = statusPagamento(a);
      if (statusFiltro !== "todos" && st !== statusFiltro) return false;
      if (termo.length >= 2 && ![a.cliente_nome, a.atendente_nome, a.servico, a.servico_nome].some(x => String(x || "").toLowerCase().includes(termo))) return false;
      if (dataInicio && String(a.data_agendamento || "") < dataInicio) return false;
      if (dataFim && String(a.data_agendamento || "") > dataFim) return false;
      if (vencimentoInicio && String(a.data_vencimento || "") < vencimentoInicio) return false;
      if (vencimentoFim && String(a.data_vencimento || "") > vencimentoFim) return false;
      return true;
    });
  }, [agendamentos, buscaCliente, statusFiltro, dataInicio, dataFim, vencimentoInicio, vencimentoFim]);

  const resumo = useMemo(() => {
    return consulta.reduce((acc, a) => {
      const total = Number(a.total || 0);
      const sinal = Number(a.valor_sinal || 0);
      const recebido = Number(a.valor_recebido || a.recebido || 0);
      const saldo = Math.max(0, Number(a.saldo ?? (total - sinal - recebido)));
      acc.total += total;
      acc.recebido += sinal + recebido;
      acc.aberto += saldo;
      if (statusPagamento(a) === "pago") acc.pagos += 1;
      if (statusPagamento(a) === "pendente") acc.pendentes += 1;
      if (statusPagamento(a) === "parcial") acc.parciais += 1;
      return acc;
    }, { total: 0, recebido: 0, aberto: 0, pagos: 0, pendentes: 0, parciais: 0 });
  }, [consulta]);

  const resumoMovimentos = useMemo(() => {
    return movimentos.reduce((acc, m) => {
      const valor = Number(m.valor || 0);
      if (m.tipo === "saida" || m.tipo === "prolabore") acc.saidas += valor;
      else acc.entradas += valor;
      return acc;
    }, { entradas: 0, saidas: 0 });
  }, [movimentos]);

  async function salvarMovimento() {
    if (!movForm.descricao.trim()) return alert("Informe a descrição.");
    const payload = { ...movForm, valor: Number(movForm.valor || 0) };
    const resp = editandoMov
      ? await supabase.from("financeiro_movimentos").update(payload).eq("id", editandoMov)
      : await supabase.from("financeiro_movimentos").insert(payload);
    if (resp.error) return alert(resp.error.message);
    setMovForm(vazioMov); setEditandoMov(null); carregar();
  }

  function editarMov(m) {
    setEditandoMov(m.id);
    setMovForm({
      tipo: m.tipo || "entrada",
      descricao: m.descricao || "",
      cliente_nome: m.cliente_nome || "",
      categoria: m.categoria || "",
      valor: Number(m.valor || 0),
      forma_pagamento: m.forma_pagamento || "",
      status: m.status || "pago",
      data_movimento: m.data_movimento || new Date().toISOString().slice(0, 10),
      data_vencimento: m.data_vencimento || "",
      observacoes: m.observacoes || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function baixarAgendamento(a) {
    const saldoAtual = Number(a.saldo || 0);
    const valor = prompt(`Valor recebido:\nSaldo atual: R$ ${moeda(saldoAtual)}`, saldoAtual > 0 ? moeda(saldoAtual) : "0");
    if (valor === null) return;
    const recebidoAnterior = Number(a.valor_recebido || a.recebido || 0);
    const novoRecebido = recebidoAnterior + Number(String(valor).replace(",", ".") || 0);
    const novoSaldo = Number(a.total || 0) - Number(a.valor_sinal || 0) - novoRecebido;
    const resp = await supabase.from("agendamentos").update({
      valor_recebido: novoRecebido,
      recebido: novoRecebido,
      saldo: novoSaldo,
      status_pagamento: novoSaldo <= 0 ? "pago" : "parcial",
      status: novoSaldo <= 0 ? "finalizado" : a.status
    }).eq("id", a.id);
    if (resp.error) return alert(resp.error.message);
    await supabase.from("financeiro_movimentos").insert({
      tipo: "entrada",
      descricao: `Recebimento de ${a.cliente_nome || "cliente"}`,
      cliente_nome: a.cliente_nome || "",
      categoria: "Agendamento",
      valor: Number(String(valor).replace(",", ".") || 0),
      forma_pagamento: "",
      status: "pago",
      data_movimento: new Date().toISOString().slice(0, 10),
      observacoes: `Agendamento: ${a.servico || a.servico_nome || ""}`
    });
    carregar();
  }

  function exportarCSV() {
    const linhas = [["Cliente","Serviço","Data","Vencimento","Total","Recebido","Saldo","Status"]];
    consulta.forEach(a => linhas.push([
      a.cliente_nome || "", a.servico || a.servico_nome || "", dataBR(a.data_agendamento), dataBR(a.data_vencimento),
      moeda(a.total), moeda(Number(a.valor_sinal || 0) + Number(a.valor_recebido || a.recebido || 0)), moeda(a.saldo), statusPagamento(a)
    ]));
    const csv = linhas.map(l => l.map(v => `"${String(v).replaceAll('"','""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "financeiro_clientes.csv";
    a.click();
  }

  return (
    <div className="card">
      <div className="filter-buttons">
        <button className={aba === "consulta" ? "btn" : "btn secondary"} onClick={() => setAba("consulta")}>Consulta clientes</button>
        <button className={aba === "movimentos" ? "btn" : "btn secondary"} onClick={() => setAba("movimentos")}>Entradas / Saídas / Pró-labore</button>
        <button className={aba === "formas" ? "btn" : "btn secondary"} onClick={() => setAba("formas")}>Formas de pagamento</button>
      </div>

      {aba === "consulta" && (
        <>
          <h2>Consulta Financeira de Clientes</h2>
          <div className="cards-list summary-cards">
            <div className="mini-card"><b>Total vendido</b><br/>R$ {moeda(resumo.total)}</div>
            <div className="mini-card"><b>Recebido</b><br/>R$ {moeda(resumo.recebido)}</div>
            <div className="mini-card"><b>Em aberto</b><br/>R$ {moeda(resumo.aberto)}</div>
            <div className="mini-card"><b>Pagos</b><br/>{resumo.pagos}</div>
            <div className="mini-card"><b>Não pagos</b><br/>{resumo.pendentes}</div>
            <div className="mini-card"><b>Parciais</b><br/>{resumo.parciais}</div>
          </div>
          <div className="form-grid">
            <label className="form-group">Cliente/serviço<input placeholder="Digite pelo menos 2 caracteres" value={buscaCliente} onChange={e=>setBuscaCliente(e.target.value)}/></label>
            <label className="form-group">Status financeiro<select value={statusFiltro} onChange={e=>setStatusFiltro(e.target.value)}><option value="todos">Todos</option><option value="pago">Pagou</option><option value="pendente">Não pagou</option><option value="parcial">Parcial</option><option value="cancelado">Cancelado</option></select></label>
            <label className="form-group">Data inicial<input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)}/></label>
            <label className="form-group">Data final<input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)}/></label>
            <label className="form-group">Vencimento inicial<input type="date" value={vencimentoInicio} onChange={e=>setVencimentoInicio(e.target.value)}/></label>
            <label className="form-group">Vencimento final<input type="date" value={vencimentoFim} onChange={e=>setVencimentoFim(e.target.value)}/></label>
          </div>
          <div className="actions"><button className="btn secondary" onClick={()=>{setBuscaCliente("");setStatusFiltro("todos");setDataInicio("");setDataFim("");setVencimentoInicio("");setVencimentoFim("");}}>Limpar filtros</button><button className="btn" onClick={exportarCSV}>Exportar CSV</button></div>
          <div className="cards-list">
            {consulta.map(a => {
              const recebido = Number(a.valor_sinal || 0) + Number(a.valor_recebido || a.recebido || 0);
              return <div key={a.id} className="mini-card">
                <b>{a.cliente_nome || "Cliente não informado"}</b><br/>
                Serviço: {a.servico || a.servico_nome || ""}<br/>
                Data: {dataBR(a.data_agendamento)} {a.hora_agendamento || ""}<br/>
                Data para pagar: {dataBR(a.data_vencimento)}<br/>
                Total: R$ {moeda(a.total)}<br/>
                Recebido: R$ {moeda(recebido)}<br/>
                Saldo: R$ {moeda(a.saldo)}<br/>
                Status: <b>{statusPagamento(a) === "pago" ? "Pagou" : statusPagamento(a) === "parcial" ? "Parcial" : statusPagamento(a) === "cancelado" ? "Cancelado" : "Não pagou"}</b>
                <div className="actions"><button className="btn" onClick={()=>baixarAgendamento(a)}>Dar baixa</button></div>
              </div>;
            })}
          </div>
        </>
      )}

      {aba === "movimentos" && (
        <>
          <h2>{editandoMov ? "Editar Movimento" : "Cadastrar Movimento"}</h2>
          <div className="cards-list summary-cards">
            <div className="mini-card"><b>Entradas</b><br/>R$ {moeda(resumoMovimentos.entradas)}</div>
            <div className="mini-card"><b>Saídas + Pró-labore</b><br/>R$ {moeda(resumoMovimentos.saidas)}</div>
            <div className="mini-card"><b>Saldo</b><br/>R$ {moeda(resumoMovimentos.entradas - resumoMovimentos.saidas)}</div>
          </div>
          <div className="form-grid">
            <label className="form-group">Tipo<select value={movForm.tipo} onChange={e=>setMovForm({...movForm,tipo:e.target.value})}><option value="entrada">Entrada</option><option value="saida">Saída</option><option value="prolabore">Pró-labore</option></select></label>
            <label className="form-group">Descrição<input value={movForm.descricao} onChange={e=>setMovForm({...movForm,descricao:e.target.value})}/></label>
            <label className="form-group">Cliente/Fornecedor<input value={movForm.cliente_nome} onChange={e=>setMovForm({...movForm,cliente_nome:e.target.value})}/></label>
            <label className="form-group">Categoria<input value={movForm.categoria} onChange={e=>setMovForm({...movForm,categoria:e.target.value})}/></label>
            <label className="form-group">Valor<input type="number" value={movForm.valor} onChange={e=>setMovForm({...movForm,valor:e.target.value})}/></label>
            <label className="form-group">Forma de pagamento<select value={movForm.forma_pagamento} onChange={e=>setMovForm({...movForm,forma_pagamento:e.target.value})}><option value="">Selecione</option>{formas.map(f=><option key={f.id} value={f.nome}>{f.nome}</option>)}</select></label>
            <label className="form-group">Status<select value={movForm.status} onChange={e=>setMovForm({...movForm,status:e.target.value})}><option value="pago">Pago</option><option value="pendente">Pendente</option><option value="cancelado">Cancelado</option></select></label>
            <label className="form-group">Data<input type="date" value={movForm.data_movimento} onChange={e=>setMovForm({...movForm,data_movimento:e.target.value})}/></label>
            <label className="form-group">Data para pagar<input type="date" value={movForm.data_vencimento} onChange={e=>setMovForm({...movForm,data_vencimento:e.target.value})}/></label>
          </div>
          <label className="form-group">Observações<input value={movForm.observacoes} onChange={e=>setMovForm({...movForm,observacoes:e.target.value})}/></label>
          <div className="actions"><button className="btn" onClick={salvarMovimento}>{editandoMov ? "Salvar alteração" : "Cadastrar"}</button>{editandoMov&&<button className="btn secondary" onClick={()=>{setEditandoMov(null);setMovForm(vazioMov);}}>Cancelar</button>}</div>
          <hr/>
          <h2>Movimentos cadastrados</h2>
          <div className="cards-list">{movimentos.map(m=><div key={m.id} className="mini-card"><b>{m.descricao}</b><br/>Tipo: {m.tipo}<br/>Cliente/Fornecedor: {m.cliente_nome}<br/>Categoria: {m.categoria}<br/>Valor: R$ {moeda(m.valor)}<br/>Forma: {m.forma_pagamento}<br/>Status: {m.status}<br/>Data: {dataBR(m.data_movimento)}<br/>Data para pagar: {dataBR(m.data_vencimento)}<br/><button className="btn secondary" onClick={()=>editarMov(m)}>Editar</button></div>)}</div>
        </>
      )}

      {aba === "formas" && (
        <PesquisaCrudModulo
          tabela="pagamentos"
          titulo="Forma de Pagamento"
          buscaCampos={["nome","tipo"]}
          campos={[
            { nome: "nome", label: "Nome" },
            { nome: "tipo", label: "Tipo" },
            { nome: "taxa_percentual", label: "Taxa %", tipo: "number" },
            { nome: "desconto_percentual", label: "Desconto %", tipo: "number" },
            { nome: "ativo", label: "Ativo", tipo: "select", opcoes: ["Sim","Não"] }
          ]}
        />
      )}
    </div>
  );
}
