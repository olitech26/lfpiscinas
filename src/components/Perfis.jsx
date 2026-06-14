import React, { useEffect, useState } from "react";
import { MODULES, supabase } from "../supabaseClient";

function normalizarPermissoes(valor) {
  if (Array.isArray(valor)) return valor;
  if (!valor) return [];
  if (typeof valor === "string") {
    try {
      const j = JSON.parse(valor);
      return normalizarPermissoes(j);
    } catch {
      return valor.split(",").map(x => x.trim()).filter(Boolean);
    }
  }
  if (typeof valor === "object") {
    return Object.entries(valor)
      .filter(([, v]) => v === true || v === "true" || v === 1)
      .map(([k]) => k);
  }
  return [];
}

function permissoesParaBanco(lista) {
  const obj = {};
  (lista || []).forEach(k => { obj[k] = true; });
  return obj;
}

export default function Perfis() {
  const [lista, setLista] = useState([]);
  const [nome, setNome] = useState("");
  const [permissoes, setPermissoes] = useState([]);
  const [editando, setEditando] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase.from("perfis").select("*").order("nome");
    setCarregando(false);
    if (error) return alert("Erro ao carregar perfis: " + error.message);
    setLista((data || []).map(p => ({ ...p, permissoes_lista: normalizarPermissoes(p.permissoes) })));
  }

  useEffect(() => { carregar(); }, []);

  function toggle(k) {
    setPermissoes(a => a.includes(k) ? a.filter(x => x !== k) : [...a, k]);
  }

  function editar(p) {
    setEditando(p.id);
    setNome(p.nome || "");
    setPermissoes(normalizarPermissoes(p.permissoes));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvar() {
    if (!nome.trim()) return alert("Informe o perfil.");
    const payload = {
      nome: nome.trim(),
      descricao: nome.trim(),
      permissoes: permissoesParaBanco(permissoes),
      ativo: true
    };
    const resp = editando
      ? await supabase.from("perfis").update(payload).eq("id", editando)
      : await supabase.from("perfis").insert(payload);
    if (resp.error) return alert("Erro ao salvar perfil: " + resp.error.message + "\n\nRode o script corrigir_financeiro_perfis_agendamento.sql e atualize com CTRL+F5.");
    setNome("");
    setPermissoes([]);
    setEditando(null);
    carregar();
  }

  return (
    <div className="card">
      <h2>{editando ? "Editar Perfil" : "Cadastrar Perfil"}</h2>

      <label className="form-group">
        Nome do perfil
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Gerente, CEO, Atendente" />
      </label>

      <div className="permissions-grid">
        {MODULES.map(([k, l]) => (
          <label className="permission-item" key={k}>
            <input type="checkbox" checked={permissoes.includes(k)} onChange={() => toggle(k)} />
            <span>{l}</span>
          </label>
        ))}
      </div>

      <div className="actions">
        <button className="btn" onClick={salvar}>{editando ? "Salvar alteração" : "Cadastrar Perfil"}</button>
        {editando && <button className="btn secondary" onClick={() => { setEditando(null); setNome(""); setPermissoes([]); }}>Cancelar</button>}
      </div>

      <hr />
      {carregando && <p>Carregando perfis...</p>}
      <div className="cards-list">
        {lista.map(p => (
          <div className="mini-card" key={p.id}>
            <b>{p.nome}</b>
            <p>Permissões: {(p.permissoes_lista || []).join(", ") || "Nenhuma"}</p>
            <button className="btn secondary" onClick={() => editar(p)}>Editar</button>
          </div>
        ))}
      </div>
    </div>
  );
}
