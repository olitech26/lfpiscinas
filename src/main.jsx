import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { MODULES, supabase } from "./supabaseClient";

import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Agendamentos from "./components/Agendamentos";
import Clientes from "./components/Clientes";
import Servicos from "./components/Servicos";
import Produtos from "./components/Produtos";
import Atendentes from "./components/Atendentes";
import Campanhas from "./components/Campanhas";
import Financeiro from "./components/Financeiro";
import Relatorios from "./components/Relatorios";
import Usuarios from "./components/Usuarios";
import Perfis from "./components/Perfis";
import Contatos from "./components/Contatos";
import WhatsApp from "./components/WhatsApp";
import Configuracoes from "./components/Configuracoes";
import Backup from "./components/Backup";
import Personalizacao from "./components/Personalizacao";

function ModuloSimples({ page }) {
  return <div className="card"><h2>{MODULES.find((m)=>m[0]===page)?.[1] || page}</h2><p>Módulo em manutenção.</p></div>;
}

function App() {
  const [session,setSession]=useState(()=>{try{const s=localStorage.getItem("olitech_session");return s?JSON.parse(s):null;}catch{return null;}});
  const [login,setLogin]=useState({usuario:"",senha:""});
  const [page,setPage]=useState("dashboard");
  const [menuAberto,setMenuAberto]=useState(false);

  async function doLogin(){
    const u=String(login.usuario||"").trim().toLowerCase();
    const s=String(login.senha||"").trim();
    if(!u||!s)return alert("Informe usuário e senha.");

    if(!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY){
      return alert("Supabase não configurado no Render. Confira VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
    }

    let {data,error}=await supabase
      .from("usuarios")
      .select("id,nome,usuario,senha,perfil,ativo")
      .order("usuario", { ascending: true });

    if(error){
      return alert("Erro ao consultar usuários: "+error.message+"\n\nVerifique se rodou o schema_banco_vazio.sql e se a tabela public.usuarios está liberada.");
    }

    // Sistema novo: se o banco estiver vazio, cria o admin padrão automaticamente.
    if(!data || data.length===0){
      const adminPadrao={nome:"OLITECH",usuario:"olitech",senha:"051309",perfil:"admin",ativo:true};
      const ins=await supabase.from("usuarios").insert(adminPadrao).select("id,nome,usuario,senha,perfil,ativo").maybeSingle();
      if(ins.error){
        return alert("Nenhum usuário cadastrado e não foi possível criar o admin padrão. Rode o script criar_admin_primeiro_acesso.sql no Supabase.\n\nErro: "+ins.error.message);
      }
      data=[ins.data];
    }

    const user=(data||[]).find(x=>
      String(x.usuario||"").trim().toLowerCase()===u &&
      String(x.senha||"").trim()===s &&
      x.ativo!==false
    );

    if(!user){
      const usuarios=(data||[]).map(x=>x.usuario).filter(Boolean).join(", ") || "nenhum";
      return alert("Usuário ou senha inválidos.\n\nUsuários encontrados no banco: "+usuarios+"\n\nPadrão inicial: olitech / 051309");
    }

    const sess={...user,perfil:user.perfil||"admin",permissoes:MODULES.map(m=>m[0])};
    localStorage.setItem("olitech_session",JSON.stringify(sess));
    setSession(sess);
  }

  function sair(){localStorage.removeItem("olitech_session");setSession(null);}
  function temPermissao(m){return session?.perfil==="Administrador"||session?.perfil==="admin"||(session?.permissoes||MODULES.map(x=>x[0])).includes(m);}

  if(!session)return <Login login={login} setLogin={setLogin} doLogin={doLogin}/>;

  const telas={
    dashboard:<Dashboard/>,
    agendamentos:<Agendamentos/>,
    clientes:<Clientes/>,
    servicos:<Servicos/>,
    produtos:<Produtos/>,
    atendentes:<Atendentes/>,
    campanhas:<Campanhas/>,
    financeiro:<Financeiro/>,
    relatorios:<Relatorios/>,
    usuarios:<Usuarios/>,
    perfis:<Perfis/>,
    contatos:<Contatos/>,
    whatsapp:<WhatsApp/>,
    configuracoes:<Configuracoes session={session}/>,
    backup:<Backup session={session}/>,
    personalizacao:<Personalizacao/>
  };

  return <div className={`app ${menuAberto ? "menu-open" : ""}`}><button className="mobile-menu-btn" onClick={()=>setMenuAberto(!menuAberto)}>☰ Menu</button>{menuAberto&&<div className="menu-backdrop" onClick={()=>setMenuAberto(false)}></div>}<aside className="side"><div className="brand"><div className="logo">AO</div><div><h2>Agendamentos Olitech</h2><p>Sistema fácil e prático</p></div></div><p className="muted user-box">Usuário: <b>{session.nome}</b><br/>Perfil: <b>{session.perfil}</b></p><nav className="nav">{MODULES.filter(([k])=>temPermissao(k)).map(([k,l])=><button key={k} onClick={()=>{setPage(k);setMenuAberto(false);}} className={page===k?"on":""}>{l}</button>)}</nav><button className="btn secondary sair" onClick={sair}>Sair</button></aside><main className="main"><h1>{MODULES.find(m=>m[0]===page)?.[1]||page}</h1>{telas[page]||<ModuloSimples page={page}/>}</main></div>;
}

createRoot(document.getElementById("root")).render(<App/>);
