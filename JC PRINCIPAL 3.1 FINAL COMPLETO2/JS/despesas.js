/* =========================================================
   J.C IMPORTS — MÓDULO DESPESAS 1.0.0
   Despesas operacionais separadas de compras de estoque.
   ========================================================= */
(function(){
  "use strict";

  const KEY = "jc_imports_despesas";
  const MOV_KEY = "jc_imports_financeiro";
  const CATEGORIAS = [
    ["aluguel","Aluguel"],["energia","Energia elétrica"],["internet","Internet/Telefone"],
    ["combustivel","Combustível"],["frete","Frete/Entrega"],["embalagens","Embalagens"],
    ["manutencao","Manutenção"],["taxas","Taxas bancárias/Cartão"],["publicidade","Publicidade"],
    ["escritorio","Material de escritório"],["salarios","Salários/Serviços"],["impostos","Impostos"],
    ["outras","Outras"]
  ];
  const FORMAS = [["dinheiro","Dinheiro"],["pix","Pix"],["cartao","Cartão"],["transferencia","Transferência"],["outro","Outro"]];

  const moeda=v=>(Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const hoje=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
  const dataBR=v=>{const p=String(v||"").slice(0,10).split("-");return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:"—"};
  const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  const catLabel=v=>(CATEGORIAS.find(x=>x[0]===v)||["","Outras"])[1];
  const formLabel=v=>(FORMAS.find(x=>x[0]===v)||["","Não informado"])[1];
  const ler=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(x)?x:[]}catch{return[]}};
  const salvar=x=>{localStorage.setItem(KEY,JSON.stringify(x));return true};
  const movimentos=()=>{try{const x=JSON.parse(localStorage.getItem(MOV_KEY)||"[]");return Array.isArray(x)?x:[]}catch{return[]}};
  const salvarMov=x=>localStorage.setItem(MOV_KEY,JSON.stringify(x));
  const id=()=>`DESP-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

  function registrarMovimentacao(desp){
    if(desp.status!=="pago") return;
    const lista=movimentos();
    const idx=lista.findIndex(x=>x.referenciaId===desp.id && x.categoria==="despesa");
    const mov={
      id: idx>=0 ? lista[idx].id : `MOV-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      tipo:"saida", categoria:"despesa", descricao:desp.descricao, valor:Number(desp.valor)||0,
      data:desp.dataPagamento||desp.data||hoje(), formaPagamento:desp.formaPagamento||"",
      referenciaId:desp.id, origem:"despesa", observacoes:desp.observacoes||"", criadoEm:desp.criadoEm||new Date().toISOString()
    };
    if(idx>=0) lista[idx]=mov; else lista.push(mov);
    salvarMov(lista);
  }
  function removerMovimentacao(idDesp){ salvarMov(movimentos().filter(x=>x.referenciaId!==idDesp)); }
  function atualizarDashboard(){ if(window.JCApp&&typeof window.JCApp.atualizarDashboard==="function") window.JCApp.atualizarDashboard(); }
  function atualizarRelatorios(){ if(window.JCRelatorios&&typeof window.JCRelatorios.atualizarInterface==="function") window.JCRelatorios.atualizarInterface(); }

  const JCDespesas={
    listar:ler,
    atualizarInterface(){this.renderizar()},
    renderizar(){
      const c=document.getElementById("despesasContent"); if(!c)return;
      const lista=this.listar().sort((a,b)=>String(b.data||"").localeCompare(String(a.data||"")));
      const pagas=lista.filter(x=>x.status==="pago");
      const pendentes=lista.filter(x=>x.status!=="pago");
      const totalPago=pagas.reduce((s,x)=>s+(Number(x.valor)||0),0);
      const totalPendente=pendentes.reduce((s,x)=>s+(Number(x.valor)||0),0);
      const mes=new Date().toISOString().slice(0,7);
      const mesPago=pagas.filter(x=>String(x.dataPagamento||x.data||"").slice(0,7)===mes).reduce((s,x)=>s+(Number(x.valor)||0),0);
      c.innerHTML=`
        <div class="despesas-dashboard">
          <div class="despesas-topo">
            <div><span class="despesas-kicker">CONTROLE DE DESPESAS</span><h2>Despesas operacionais</h2><p>Aluguel, energia, frete, taxas e outros custos que não são compras de estoque.</p></div>
            <button class="primary-button" id="btnNovaDespesa" type="button">+ Nova despesa</button>
          </div>
          <div class="despesas-cards">
            <div class="despesa-card"><span>Pago no mês</span><strong>${moeda(mesPago)}</strong><small>impacta o caixa e o lucro</small></div>
            <div class="despesa-card"><span>Total pago</span><strong>${moeda(totalPago)}</strong><small>histórico de despesas pagas</small></div>
            <div class="despesa-card"><span>Pendente</span><strong>${moeda(totalPendente)}</strong><small>ainda não pago</small></div>
            <div class="despesa-card"><span>Quantidade</span><strong>${lista.length}</strong><small>lançamentos registrados</small></div>
          </div>
          <div class="despesas-area">
            <div class="despesas-area-head"><div><h2>Lançamentos de despesas</h2><p>As compras de produtos para revenda continuam no módulo Compras.</p></div><select id="filtroDespesas"><option value="todos">Todas</option><option value="pendente">Pendentes</option><option value="pago">Pagas</option></select></div>
            <div class="despesas-table-wrap">
              <table class="despesas-table"><thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Valor</th><th>Status</th><th>Ação</th></tr></thead><tbody id="despesasLista"></tbody></table>
            </div>
          </div>
        </div>`;
      this.renderLista();
      document.getElementById("btnNovaDespesa")?.addEventListener("click",()=>this.abrirModal());
      document.getElementById("filtroDespesas")?.addEventListener("change",()=>this.renderLista());
    },
    renderLista(){
      const body=document.getElementById("despesasLista"); if(!body)return;
      let lista=this.listar().sort((a,b)=>String(b.data||"").localeCompare(String(a.data||"")));
      const f=document.getElementById("filtroDespesas")?.value||"todos";
      if(f!=="todos")lista=lista.filter(x=>x.status===f);
      if(!lista.length){body.innerHTML=`<tr><td colspan="6" class="despesas-vazio">Nenhuma despesa encontrada.</td></tr>`;return}
      body.innerHTML=lista.map(x=>`<tr>
        <td><strong>${esc(x.descricao)}</strong>${x.observacoes?`<small>${esc(x.observacoes)}</small>`:""}</td>
        <td>${esc(catLabel(x.categoria))}</td><td>${dataBR(x.data)}</td><td><strong>${moeda(x.valor)}</strong></td>
        <td><span class="despesa-status ${x.status==='pago'?'pago':'pendente'}">${x.status==='pago'?'Pago':'Pendente'}</span></td>
        <td class="despesa-acoes">${x.status!=='pago'?`<button data-desp-pagar="${esc(x.id)}">Pagar</button>`:""}<button data-desp-editar="${esc(x.id)}">Editar</button><button class="danger" data-desp-excluir="${esc(x.id)}">Excluir</button></td>
      </tr>`).join("");
      body.querySelectorAll("[data-desp-pagar]").forEach(b=>b.addEventListener("click",()=>this.marcarPago(b.dataset.despPagar)));
      body.querySelectorAll("[data-desp-editar]").forEach(b=>b.addEventListener("click",()=>this.abrirModal(b.dataset.despEditar)));
      body.querySelectorAll("[data-desp-excluir]").forEach(b=>b.addEventListener("click",()=>this.excluir(b.dataset.despExcluir)));
    },
    abrirModal(idDesp){
      const atual=idDesp?this.listar().find(x=>x.id===idDesp):null; document.getElementById("modalDespesa")?.remove();
      const modal=document.createElement("div");modal.id="modalDespesa";modal.className="despesas-modal-overlay";
      modal.innerHTML=`<div class="despesas-modal"><div class="despesas-modal-head"><div><span>DESPESAS</span><h2>${atual?'Editar despesa':'Nova despesa'}</h2><p>Registre uma despesa operacional.</p></div><button type="button" data-fechar>×</button></div>
      <form id="formDespesa"><div class="despesas-form-grid">
        <label>Descrição *<input id="despDescricao" required maxlength="120" value="${esc(atual?.descricao||"")}" placeholder="Ex.: conta de energia"></label>
        <label>Valor *<input id="despValor" required type="number" min="0.01" step="0.01" value="${atual?Number(atual.valor):""}" placeholder="0,00"></label>
        <label>Categoria<select id="despCategoria">${CATEGORIAS.map(x=>`<option value="${x[0]}" ${atual?.categoria===x[0]?'selected':''}>${x[1]}</option>`).join("")}</select></label>
        <label>Data da despesa *<input id="despData" required type="date" value="${esc(String(atual?.data||hoje()).slice(0,10))}"></label>
        <label>Status<select id="despStatus"><option value="pendente" ${atual?.status==='pendente'?'selected':''}>Pendente</option><option value="pago" ${atual?.status==='pago'?'selected':''}>Pago</option></select></label>
        <label>Forma de pagamento<select id="despForma"><option value="">Não informado</option>${FORMAS.map(x=>`<option value="${x[0]}" ${atual?.formaPagamento===x[0]?'selected':''}>${x[1]}</option>`).join("")}</select></label>
        <label class="despesas-form-full">Observações<textarea id="despObs" rows="3" maxlength="300" placeholder="Informações adicionais...">${esc(atual?.observacoes||"")}</textarea></label>
      </div><div class="despesas-modal-foot"><button type="button" class="secondary-button" data-fechar>Cancelar</button><button type="submit" class="primary-button">${atual?'Salvar alterações':'Salvar despesa'}</button></div></form></div>`;
      document.body.appendChild(modal); const fechar=()=>modal.remove(); modal.querySelectorAll("[data-fechar]").forEach(b=>b.addEventListener("click",fechar)); modal.addEventListener("click",e=>{if(e.target===modal)fechar()});
      modal.querySelector("form").addEventListener("submit",e=>{e.preventDefault();
        const status=modal.querySelector("#despStatus").value; const data=modal.querySelector("#despData").value;
        const obj={id:atual?.id||id(),descricao:modal.querySelector("#despDescricao").value.trim(),valor:Number(modal.querySelector("#despValor").value)||0,categoria:modal.querySelector("#despCategoria").value,data,status,formaPagamento:modal.querySelector("#despForma").value,observacoes:modal.querySelector("#despObs").value.trim(),criadoEm:atual?.criadoEm||new Date().toISOString()};
        if(!obj.descricao||obj.valor<=0||!data){alert("Preencha descrição, valor e data.");return}
        const lista=this.listar(); const idx=lista.findIndex(x=>x.id===obj.id); if(idx>=0)lista[idx]=obj;else lista.push(obj); salvar(lista); registrarMovimentacao(obj); if(obj.status!=='pago')removerMovimentacao(obj.id);
        fechar(); this.renderizar(); atualizarDashboard(); atualizarRelatorios();
      });
    },
    marcarPago(idDesp){
      const lista=this.listar();const i=lista.findIndex(x=>x.id===idDesp);if(i<0)return;const x=lista[i];
      const forma=prompt("Forma de pagamento (pix, dinheiro, cartao, transferencia ou outro):",x.formaPagamento||"pix");if(forma===null)return;
      x.status="pago";x.formaPagamento=String(forma).toLowerCase().trim()||"outro";x.dataPagamento=hoje();lista[i]=x;salvar(lista);registrarMovimentacao(x);this.renderizar();atualizarDashboard();atualizarRelatorios();
    },
    excluir(idDesp){
      const x=this.listar().find(v=>v.id===idDesp);if(!x)return;if(!confirm(`Excluir a despesa "${x.descricao}"?`))return;
      salvar(this.listar().filter(v=>v.id!==idDesp));removerMovimentacao(idDesp);this.renderizar();atualizarDashboard();atualizarRelatorios();
    }
  };
  window.JCDespesas=JCDespesas;
  document.addEventListener("DOMContentLoaded",()=>JCDespesas.atualizarInterface());
})();
