/* =========================================================
   J.C IMPORTS — MÓDULO PEDIDOS
   Pedido é separado da venda: não baixa estoque e não lança financeiro.
   ========================================================= */
(function(){
  "use strict";

  const KEY = "jc_imports_pedidos";
  const money = v => Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const esc = v => String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const today = () => new Date().toISOString().slice(0,10);
  const num = v => { let s=String(v??"").trim().replace(/\s/g,""); if(s.includes(",") && s.includes(".")) s=s.replace(/\./g,"").replace(",","."); else if(s.includes(",")) s=s.replace(",","."); const n=Number(s); return Number.isFinite(n)?n:0; };
  const fmtDate = v => { if(!v) return "—"; const p=String(v).split("-"); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:v; };
  const id = () => `PED-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  const list = () => window.JCStorage&&typeof JCStorage.obterPedidos==="function" ? JCStorage.obterPedidos() : [];
  const save = rows => window.JCStorage&&typeof JCStorage.salvarPedidos==="function" ? JCStorage.salvarPedidos(rows) : false;
  const products = () => window.JCProdutos&&typeof JCProdutos.listar==="function" ? JCProdutos.listar() : (JCStorage.obterProdutos?JCStorage.obterProdutos():[]);
  const clients = () => JCStorage&&typeof JCStorage.obterClientes==="function" ? JCStorage.obterClientes() : [];

  function inject(){
    if(document.getElementById("pedidosStyles"))return;
    const st=document.createElement("style"); st.id="pedidosStyles";
    st.textContent=`
      .ped-module{display:grid;gap:18px}.ped-card{background:#fff;border:1px solid #e3e9f2;border-radius:18px;padding:20px;box-shadow:0 7px 24px rgba(20,50,90,.06)}
      .ped-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.ped-top h2{margin:0;font-size:20px}.ped-muted{color:#6b7890;font-size:13px}
      .ped-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.ped-stat{padding:16px;border:1px solid #e6ebf2;border-radius:14px;background:#f8fafc}.ped-stat span{display:block;color:#6d7a90;font-size:12px}.ped-stat b{display:block;margin-top:6px;font-size:20px}
      .ped-actions{display:flex;gap:8px;flex-wrap:wrap}.ped-btn{border:0;border-radius:10px;padding:10px 14px;cursor:pointer;background:#1761b5;color:#fff;font-weight:600}.ped-btn.secondary{background:#eef3f8;color:#24415f}.ped-btn.danger{background:#feeceb;color:#a52c26}
      .ped-table{width:100%;border-collapse:collapse;margin-top:14px}.ped-table th,.ped-table td{text-align:left;padding:12px 10px;border-bottom:1px solid #edf0f4;font-size:13px}.ped-table th{color:#69768b;font-size:12px}.ped-status{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:700}.ped-status.aberto{background:#fff4d6;color:#8a6200}.ped-status.andamento{background:#e8f1ff;color:#1756a4}.ped-status.concluido{background:#e7f7ed;color:#237343}.ped-status.cancelado{background:#fce9e9;color:#a33b3b}
      .ped-modal-bg{position:fixed;inset:0;background:rgba(10,25,45,.52);display:flex;align-items:center;justify-content:center;padding:18px;z-index:9999}.ped-modal{width:min(850px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;padding:22px}.ped-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ped-form label{display:grid;gap:6px;font-size:12px;font-weight:600;color:#34445b}.ped-form input,.ped-form select,.ped-form textarea{width:100%;box-sizing:border-box;border:1px solid #d6deea;border-radius:9px;padding:10px;background:#fff;font:inherit}.ped-items{border:1px solid #e2e8f0;border-radius:12px;margin-top:14px;overflow:hidden}.ped-item{display:grid;grid-template-columns:1fr 100px 120px 40px;gap:8px;align-items:center;padding:10px;border-bottom:1px solid #edf0f4}.ped-item:last-child{border-bottom:0}.ped-item input{padding:8px}.ped-total{text-align:right;font-size:18px;font-weight:800;padding:14px}.ped-empty{text-align:center;padding:35px;color:#718096}.ped-view{display:grid;gap:15px}.ped-detail-line{display:flex;justify-content:space-between;gap:15px;padding:9px 0;border-bottom:1px solid #edf0f4}.ped-detail-items{border:1px solid #e4eaf2;border-radius:12px;overflow:hidden}.ped-detail-items div{display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #edf0f4}.ped-detail-items div:last-child{border-bottom:0}
      @media(max-width:700px){.ped-stats{grid-template-columns:1fr}.ped-grid{grid-template-columns:1fr}.ped-table{display:block;overflow:auto}.ped-item{grid-template-columns:1fr 80px 95px 36px}}
      @media print{body *{visibility:hidden!important}.ped-print-area,.ped-print-area *{visibility:visible!important}.ped-print-area{position:absolute;left:0;top:0;width:100%;padding:25px}}
    `; document.head.appendChild(st);
  }

  function modal(title,body,ready){
    const bg=document.createElement("div"); bg.className="ped-modal-bg";
    bg.innerHTML=`<div class="ped-modal"><div class="ped-top"><h2>${esc(title)}</h2><button class="ped-btn secondary" id="pedClose">Fechar</button></div><div style="margin-top:16px">${body}</div></div>`;
    document.body.appendChild(bg); bg.querySelector("#pedClose").onclick=()=>bg.remove(); bg.addEventListener("click",e=>{if(e.target===bg)bg.remove()}); ready?.(bg); return bg;
  }

  function clienteNome(id){const c=clients().find(x=>String(x.id)===String(id));return c?.nome||"Cliente não encontrado"}
  function productById(id){return products().find(x=>String(x.id)===String(id))||null}
  function statusLabel(s){return ({aberto:"Aberto",andamento:"Em andamento",concluido:"Concluído",cancelado:"Cancelado"}[s]||"Aberto")}
  function statusClass(s){return ({aberto:"aberto",andamento:"andamento",concluido:"concluido",cancelado:"cancelado"}[s]||"aberto")}

  function form(existing){
    const v=existing||{}; let items=Array.isArray(v.itens)?v.itens.map(x=>({...x})):[]; const cs=clients(); const ps=products();
    const body=`<form class="ped-form" id="pedForm"><div class="ped-grid"><label>Cliente *<select name="cliente" required><option value="">Selecione o cliente</option>${cs.map(c=>`<option value="${esc(c.id)}" ${String(c.id)===String(v.clienteId)?"selected":""}>${esc(c.nome)}</option>`).join("")}</select></label><label>Data do pedido *<input type="date" name="data" value="${esc(v.data||today())}" required></label><label>Status<select name="status">${["aberto","andamento","concluido","cancelado"].map(x=>`<option value="${x}" ${x===(v.status||"aberto")?"selected":""}>${statusLabel(x)}</option>`).join("")}</select></label><label>Previsão de entrega<input type="date" name="entrega" value="${esc(v.entrega||"")}"></label></div><div class="ped-top" style="margin-top:18px"><strong>Itens do pedido</strong><button type="button" class="ped-btn" id="pedAdd">+ Adicionar produto</button></div><div class="ped-items" id="pedItems"></div><div class="ped-total">Total: <span id="pedTotal">R$ 0,00</span></div><label>Observações<textarea name="obs" rows="3" placeholder="Observações do pedido...">${esc(v.observacoes||"")}</textarea></label><div class="ped-actions" style="justify-content:flex-end;margin-top:15px"><button type="button" class="ped-btn secondary" id="pedCancel">Cancelar</button><button class="ped-btn">Salvar pedido</button></div></form>`;
    const bg=modal(existing?"Editar pedido":"Novo pedido",body,d=>{
      const f=d.querySelector("#pedForm"), box=d.querySelector("#pedItems"), total=d.querySelector("#pedTotal");
      function renderItems(){ if(!items.length){box.innerHTML='<div class="ped-empty">Nenhum produto adicionado.</div>'; total.textContent=money(0);return;} box.innerHTML=items.map((it,i)=>`<div class="ped-item"><select data-i="${i}" class="pi-prod"><option value="">Produto</option>${ps.map(p=>`<option value="${esc(p.id)}" ${String(p.id)===String(it.produtoId)?"selected":""}>${esc(p.nome)}${p.codigo?` — ${esc(p.codigo)}`:""}</option>`).join("")}</select><input data-i="${i}" class="pi-qty" type="number" min="1" step="1" value="${Number(it.quantidade)||1}" title="Quantidade"><input data-i="${i}" class="pi-price" inputmode="decimal" value="${String(Number(it.valorUnitario)||0).replace(".",",")}" title="Preço unitário"><button type="button" class="ped-btn danger pi-del" data-i="${i}">×</button></div>`).join("");
        box.querySelectorAll(".pi-prod").forEach(el=>el.onchange=()=>{const i=+el.dataset.i,p=productById(el.value);items[i].produtoId=el.value;items[i].nome=p?.nome||"";items[i].codigo=p?.codigo||"";if(p&&(!items[i].valorUnitario||items[i].autoPreco))items[i].valorUnitario=Number(p.precoVenda)||0;items[i].autoPreco=true;renderItems()});
        box.querySelectorAll(".pi-qty").forEach(el=>el.oninput=()=>{items[+el.dataset.i].quantidade=Math.max(1,Number(el.value)||1);updateTotal()});
        box.querySelectorAll(".pi-price").forEach(el=>el.oninput=()=>{items[+el.dataset.i].valorUnitario=num(el.value);items[+el.dataset.i].autoPreco=false;updateTotal()});
        box.querySelectorAll(".pi-del").forEach(el=>el.onclick=()=>{items.splice(+el.dataset.i,1);renderItems()}); updateTotal(); }
      function updateTotal(){const t=items.reduce((a,x)=>a+(Number(x.quantidade)||0)*(Number(x.valorUnitario)||0),0);total.textContent=money(t);}
      d.querySelector("#pedAdd").onclick=()=>{items.push({produtoId:"",nome:"",codigo:"",quantidade:1,valorUnitario:0});renderItems()}; d.querySelector("#pedCancel").onclick=()=>d.remove(); renderItems();
      f.onsubmit=e=>{e.preventDefault();if(!f.cliente.value)return alert("Selecione o cliente.");if(!items.length)return alert("Adicione pelo menos um produto.");if(items.some(x=>!x.produtoId||Number(x.quantidade)<=0))return alert("Revise os produtos e quantidades.");const clean=items.map(x=>({produtoId:x.produtoId,nome:x.nome||productById(x.produtoId)?.nome||"",codigo:x.codigo||productById(x.produtoId)?.codigo||"",quantidade:Number(x.quantidade)||1,valorUnitario:Number(x.valorUnitario)||0,subtotal:(Number(x.quantidade)||0)*(Number(x.valorUnitario)||0)}));const totalVal=clean.reduce((a,x)=>a+x.subtotal,0);const row={...(existing||{}),id:existing?.id||id(),numero:existing?.numero||nextNumber(),clienteId:f.cliente.value,clienteNome:clienteNome(f.cliente.value),data:f.data.value,status:f.status.value,entrega:f.entrega.value,itens:clean,total:totalVal,observacoes:f.obs.value,atualizadoEm:new Date().toISOString(),criadoEm:existing?.criadoEm||new Date().toISOString()};const rows=list();const ix=rows.findIndex(x=>x.id===row.id);if(ix>=0)rows[ix]=row;else rows.unshift(row);save(rows);d.remove();render();};
    }); return bg;
  }

  function nextNumber(){return list().reduce((m,x)=>Math.max(m,Number(String(x.numero||"").replace(/\D/g,""))||0),0)+1}
  function detail(p){
    const body=`<div class="ped-view ped-print-area"><div class="ped-detail-line"><b>Pedido #${esc(p.numero)}</b><span>${fmtDate(p.data)}</span></div><div class="ped-detail-line"><span>Cliente</span><b>${esc(p.clienteNome||clienteNome(p.clienteId))}</b></div><div class="ped-detail-line"><span>Status</span><span class="ped-status ${statusClass(p.status)}">${statusLabel(p.status)}</span></div>${p.entrega?`<div class="ped-detail-line"><span>Entrega prevista</span><b>${fmtDate(p.entrega)}</b></div>`:""}<div><h3>Produtos</h3><div class="ped-detail-items">${p.itens.map(x=>`<div><span>${esc(x.nome)} × ${Number(x.quantidade)||0}</span><b>${money(x.subtotal)}</b></div>`).join("")}</div></div><div class="ped-detail-line"><span>Total</span><b>${money(p.total)}</b></div>${p.observacoes?`<div><h3>Observações</h3><p>${esc(p.observacoes).replace(/\n/g,"<br>")}</p></div>`:""}</div><div class="ped-actions" style="justify-content:flex-end;margin-top:15px"><button class="ped-btn secondary" id="pedPrint">🖨️ Imprimir</button><button class="ped-btn" id="pedEdit">Editar</button></div>`;
    modal(`Pedido #${p.numero}`,body,d=>{d.querySelector("#pedPrint").onclick=()=>window.print();d.querySelector("#pedEdit").onclick=()=>{d.remove();form(p)}});
  }
  function remove(idv){if(!confirm("Excluir este pedido? O estoque e as vendas não serão alterados."))return;save(list().filter(x=>x.id!==idv));render()}
  function changeStatus(p){const next=prompt("Status do pedido:\n1 - Aberto\n2 - Em andamento\n3 - Concluído\n4 - Cancelado",({aberto:1,andamento:2,concluido:3,cancelado:4}[p.status]||1));const map={1:"aberto",2:"andamento",3:"concluido",4:"cancelado"};if(map[next]){p.status=map[next];p.atualizadoEm=new Date().toISOString();const rows=list();const i=rows.findIndex(x=>x.id===p.id);if(i>=0){rows[i]=p;save(rows);render()}}}
  function render(){inject();const host=document.getElementById("pedidosContent");if(!host)return;const rows=list(), total=rows.reduce((a,x)=>a+Number(x.total||0),0),ab=rows.filter(x=>x.status!=="cancelado"&&x.status!=="concluido").length,done=rows.filter(x=>x.status==="concluido").length;host.innerHTML=`<div class="ped-module"><div class="ped-card"><div class="ped-top"><div><h2>📋 Controle de pedidos</h2><div class="ped-muted">Pedidos ficam separados das vendas e não movimentam estoque.</div></div><button class="ped-btn" id="pedNew">+ Novo pedido</button></div></div><div class="ped-stats"><div class="ped-stat"><span>Total de pedidos</span><b>${rows.length}</b></div><div class="ped-stat"><span>Em aberto / andamento</span><b>${ab}</b></div><div class="ped-stat"><span>Valor dos pedidos</span><b>${money(total)}</b></div></div><div class="ped-card"><div class="ped-top"><h2>Pedidos cadastrados</h2><span class="ped-muted">Concluídos: ${done}</span></div>${rows.length?`<table class="ped-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Data</th><th>Status</th><th>Total</th><th>Ações</th></tr></thead><tbody>${rows.map(p=>`<tr><td>#${esc(p.numero)}</td><td>${esc(p.clienteNome||clienteNome(p.clienteId))}</td><td>${fmtDate(p.data)}</td><td><span class="ped-status ${statusClass(p.status)}">${statusLabel(p.status)}</span></td><td>${money(p.total)}</td><td><div class="ped-actions"><button class="ped-btn secondary" data-view="${esc(p.id)}">Abrir</button><button class="ped-btn secondary" data-edit="${esc(p.id)}">Editar</button><button class="ped-btn secondary" data-status="${esc(p.id)}">Status</button><button class="ped-btn danger" data-del="${esc(p.id)}">Excluir</button></div></td></tr>`).join("")}</tbody></table>`:`<div class="ped-empty">Nenhum pedido cadastrado. Clique em “Novo pedido” para começar.</div>`}</div></div>`;
    host.querySelector("#pedNew")?.addEventListener("click",()=>form());
    host.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{const p=list().find(x=>x.id===b.dataset.view);if(p)detail(p)});
    host.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{const p=list().find(x=>x.id===b.dataset.edit);if(p)form(p)});
    host.querySelectorAll("[data-status]").forEach(b=>b.onclick=()=>{const p=list().find(x=>x.id===b.dataset.status);if(p)changeStatus(p)});
    host.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>remove(b.dataset.del));
  }
  window.JCPedidos={render,list};
})();
