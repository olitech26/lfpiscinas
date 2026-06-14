import React from "react";
import PesquisaCrudModulo from "./PesquisaCrudModulo";

export default function Financeiro() {
  return (
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
  );
}
