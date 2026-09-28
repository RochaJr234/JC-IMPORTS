/* =========================================================
   J.C IMPORTS — MÓDULO DE RELATÓRIOS
   Versão robusta: inicialização sob demanda + tolerância a
   dados antigos/incompletos do LocalStorage.
   ========================================================= */
(function () {
    "use strict";

    const estado = { periodo: "mes", inicio: "", fim: "" };

    const moeda = (valor) => Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency", currency: "BRL"
    });
    const numero = (valor) => Number(valor || 0).toLocaleString("pt-BR");
    const escapar = (valor) => String(valor == null ? "" : valor)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

    function lista(fn) {
        try {
            const valor = typeof fn === "function" ? fn() : [];
            return Array.isArray(valor) ? valor : [];
        } catch (erro) {
            console.warn("J.C Imports — não foi possível ler uma base do relatório:", erro);
            return [];
        }
    }

    function dataValor(valor) {
        if (!valor) return null;
        if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
        const texto = String(valor).trim();
        if (!texto) return null;
        let d = new Date(texto);
        if (!Number.isNaN(d.getTime())) return d;
        const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
        if (br) {
            d = new Date(
                Number(br[3]), Number(br[2]) - 1, Number(br[1]),
                Number(br[4] || 0), Number(br[5] || 0), Number(br[6] || 0)
            );
            return Number.isNaN(d.getTime()) ? null : d;
        }
        return null;
    }

    const dataBR = (valor) => {
        const d = dataValor(valor);
        return d ? d.toLocaleDateString("pt-BR") : "-";
    };

    function inicioHoje() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function intervalo() {
        if (estado.periodo === "personalizado") {
            const inicio = estado.inicio ? new Date(estado.inicio + "T00:00:00") : null;
            const fim = estado.fim ? new Date(estado.fim + "T23:59:59.999") : null;
            return { inicio, fim };
        }

        const fim = new Date();
        fim.setHours(23, 59, 59, 999);
        const inicio = inicioHoje();

        if (estado.periodo === "hoje") return { inicio, fim };
        if (estado.periodo === "7") { inicio.setDate(inicio.getDate() - 6); return { inicio, fim }; }
        if (estado.periodo === "30") { inicio.setDate(inicio.getDate() - 29); return { inicio, fim }; }
        if (estado.periodo === "ano") { inicio.setMonth(0, 1); return { inicio, fim }; }
        if (estado.periodo === "tudo") return { inicio: null, fim: null };

        inicio.setDate(1);
        return { inicio, fim };
    }

    function dentro(data, faixa) {
        if (!faixa.inicio && !faixa.fim) return true;
        const d = dataValor(data);
        if (!d) return false;
        if (faixa.inicio && d < faixa.inicio) return false;
        if (faixa.fim && d > faixa.fim) return false;
        return true;
    }

    function rotuloPeriodo() {
        const labels = {
            hoje: "Hoje", "7": "Últimos 7 dias", "30": "Últimos 30 dias",
            mes: "Mês atual", ano: "Ano atual", tudo: "Todo o período",
            personalizado: "Período personalizado"
        };
        if (estado.periodo === "personalizado" && estado.inicio && estado.fim) {
            return `${dataBR(estado.inicio + "T12:00:00")} a ${dataBR(estado.fim + "T12:00:00")}`;
        }
        return labels[estado.periodo] || "Mês atual";
    }

    function formaLabel(v) {
        return ({
            dinheiro: "Dinheiro", pix: "Pix", cartao: "Cartão", cartão: "Cartão",
            prazo: "A prazo", transferencia: "Transferência", boleto: "Boleto"
        })[String(v || "").toLowerCase()] || (v ? String(v) : "Não informado");
    }

    function obterDados() {
        const storage = window.JCStorage || {};
        const faixa = intervalo();
        const vendasBase = lista(storage.obterVendas);
        const comprasBase = lista(storage.obterCompras);
        const produtos = lista(storage.obterProdutos);
        const clientes = lista(storage.obterClientes);
        const contasBase = lista(storage.obterContasReceber);
        const financeiroBase = lista(storage.obterMovimentacoes);

        const vendas = vendasBase.filter(v => v && v.status !== "cancelada" && dentro(v.data || v.criadoEm, faixa));
        const compras = comprasBase.filter(c => c && dentro(c.data || c.criadoEm, faixa));
        const contas = contasBase.filter(c => c && c.status !== "cancelado" && c.status !== "cancelada");
        const movimentos = financeiroBase.filter(x => x && dentro(x.data || x.criadoEm, faixa));

        const totalVendas = vendas.reduce((s, v) => s + (Number(v.total) || 0), 0);
        const totalCompras = compras.reduce((s, c) => s + (Number(c.totalCompra) || 0), 0);
        const lucro = vendas.reduce((s, v) => s + (Number(v.lucroEstimado) || 0), 0);
        const entradas = movimentos.filter(x => String(x.tipo).toLowerCase() === "entrada")
            .reduce((s, x) => s + (Number(x.valor) || 0), 0);
        const saidas = movimentos.filter(x => String(x.tipo).toLowerCase() === "saida" || String(x.tipo).toLowerCase() === "saída")
            .reduce((s, x) => s + (Number(x.valor) || 0), 0);
        const recebidas = contas.reduce((s, c) => s + (Number(c.valorPago) || 0), 0);
        const aReceber = contas.reduce((s, c) => s + Math.max(0, Number(c.saldo) || 0), 0);
        const estoque = produtos.reduce((s, p) => s + (Number(p.estoque) || 0) * (Number(p.precoCusto) || 0), 0);

        const formas = {};
        vendas.forEach(v => {
            const chave = String(v.formaPagamento || "nao_informado").toLowerCase();
            formas[chave] = (formas[chave] || 0) + (Number(v.total) || 0);
        });

        const produtosMap = {};
        vendas.forEach(v => {
            const itens = Array.isArray(v.itens) ? v.itens : [];
            itens.forEach(i => {
                if (!i) return;
                const chave = i.produtoId || i.codigo || i.nome || "Produto";
                if (!produtosMap[chave]) {
                    produtosMap[chave] = { nome: i.nome || "Produto", quantidade: 0, total: 0 };
                }
                const qtd = Number(i.quantidade) || 0;
                const subtotal = Number(i.subtotal);
                produtosMap[chave].quantidade += qtd;
                produtosMap[chave].total += Number.isFinite(subtotal) ? subtotal : qtd * (Number(i.valorUnitario) || 0);
            });
        });

        const ranking = Object.values(produtosMap)
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);

        return {
            vendas, compras, produtos, clientes, contas, movimentos,
            totalVendas, totalCompras, lucro, entradas, saidas,
            recebidas, aReceber, estoque, formas, ranking
        };
    }

    function tabelaVendas(vendas) {
        if (!vendas.length) return `<div class="relatorio-vazio">Nenhuma venda encontrada no período selecionado.</div>`;
        const listaVendas = vendas.slice().sort((a, b) => (dataValor(b.data) || 0) - (dataValor(a.data) || 0));
        return `<div class="relatorio-tabela-wrap"><table class="relatorio-tabela"><thead><tr><th>Nº</th><th>Data</th><th>Cliente</th><th>Pagamento</th><th>Status</th><th>Total</th></tr></thead><tbody>${listaVendas.map(v => `<tr><td>${escapar(v.numero || "-")}</td><td>${dataBR(v.data)}</td><td>${escapar(v.clienteNome || "Cliente não informado")}</td><td>${escapar(formaLabel(v.formaPagamento))}</td><td><span class="relatorio-status ${v.status === "pendente" ? "pendente" : ""}">${v.status === "pendente" ? "Pendente" : "Pago"}</span></td><td class="valor">${moeda(v.total)}</td></tr>`).join("")}</tbody></table></div>`;
    }

    function tabelaCompras(compras) {
        if (!compras.length) return `<div class="relatorio-vazio">Nenhuma compra encontrada no período selecionado.</div>`;
        const listaCompras = compras.slice().sort((a, b) => (dataValor(b.data) || 0) - (dataValor(a.data) || 0));
        return `<div class="relatorio-tabela-wrap"><table class="relatorio-tabela"><thead><tr><th>Nº</th><th>Data</th><th>Produto</th><th>Qtd.</th><th>Pagamento</th><th>Total</th></tr></thead><tbody>${listaCompras.map(c => `<tr><td>${escapar(c.numero || "-")}</td><td>${dataBR(c.data)}</td><td>${escapar(c.produtoNome || "-")}</td><td>${numero(c.quantidade)}</td><td>${escapar(formaLabel(c.formaPagamento))}</td><td class="valor">${moeda(c.totalCompra)}</td></tr>`).join("")}</tbody></table></div>`;
    }

    function render() {
        const container = document.getElementById("relatoriosContent");
        if (!container) return;

        try {
            const d = obterDados();
            const valoresFormas = Object.values(d.formas).map(Number).filter(Number.isFinite);
            const maxForma = Math.max(1, ...valoresFormas);
            const formasHtml = Object.keys(d.formas).length
                ? Object.entries(d.formas).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="relatorio-forma"><span>${escapar(formaLabel(k))}</span><div class="relatorio-barra"><i style="width:${Math.max(2, (v / maxForma) * 100)}%"></i></div><strong>${moeda(v)}</strong></div>`).join("")
                : `<div class="relatorio-vazio">Não há vendas para analisar.</div>`;

            const rankingHtml = d.ranking.length
                ? d.ranking.map((p, i) => `<div class="relatorio-produto"><div class="relatorio-produto-num">${i + 1}</div><div class="relatorio-produto-info"><strong>${escapar(p.nome)}</strong><span>${numero(p.quantidade)} unidade(s) vendida(s)</span></div><div class="relatorio-produto-total">${moeda(p.total)}</div></div>`).join("")
                : `<div class="relatorio-vazio">Nenhum produto vendido no período.</div>`;

            container.innerHTML = `
                <div class="relatorios-toolbar">
                    <div class="relatorios-filtros">
                        <label>Período<select id="relatorioPeriodo"><option value="hoje">Hoje</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="mes">Mês atual</option><option value="ano">Ano atual</option><option value="tudo">Todo o período</option><option value="personalizado">Personalizado</option></select></label>
                        <label>Data inicial<input type="date" id="relatorioInicio" value="${escapar(estado.inicio)}"></label>
                        <label>Data final<input type="date" id="relatorioFim" value="${escapar(estado.fim)}"></label>
                    </div>
                    <div class="relatorios-acoes"><button type="button" class="relatorio-btn-secundario" id="relatorioAtualizar">↻ Atualizar</button><button type="button" class="relatorio-btn-principal" id="relatorioImprimir">🖨 Imprimir</button></div>
                </div>
                <div class="relatorio-impressao"><div class="relatorio-print-titulo">J.C Imports — Relatório gerencial</div><div class="relatorio-print-periodo">Período: ${escapar(rotuloPeriodo())} · Gerado em ${dataBR(new Date())}</div></div>
                <div class="relatorios-cards">
                    <div class="relatorio-metrica azul"><span>Vendas</span><strong>${moeda(d.totalVendas)}</strong><small>${numero(d.vendas.length)} venda(s) no período</small></div>
                    <div class="relatorio-metrica laranja"><span>Compras</span><strong>${moeda(d.totalCompras)}</strong><small>${numero(d.compras.length)} registro(s) no período</small></div>
                    <div class="relatorio-metrica verde"><span>Lucro estimado</span><strong>${moeda(d.lucro)}</strong><small>Com base no custo dos produtos vendidos</small></div>
                    <div class="relatorio-metrica roxo"><span>A receber</span><strong>${moeda(d.aReceber)}</strong><small>Saldo atual de contas em aberto</small></div>
                </div>
                <div class="relatorios-grid">
                    <div class="relatorio-bloco"><div class="relatorio-bloco-cabecalho"><h2>Resumo financeiro</h2><span>${escapar(rotuloPeriodo())}</span></div><div class="relatorio-bloco-corpo"><div class="relatorio-financeiro"><div class="relatorio-mini"><span>Entradas</span><strong>${moeda(d.entradas)}</strong></div><div class="relatorio-mini"><span>Saídas</span><strong>${moeda(d.saidas)}</strong></div><div class="relatorio-mini"><span>Saldo</span><strong>${moeda(d.entradas - d.saidas)}</strong></div><div class="relatorio-mini"><span>Recebido a prazo</span><strong>${moeda(d.recebidas)}</strong></div><div class="relatorio-mini"><span>Estoque pelo custo</span><strong>${moeda(d.estoque)}</strong></div><div class="relatorio-mini"><span>Margem estimada</span><strong>${d.totalVendas > 0 ? ((d.lucro / d.totalVendas) * 100).toFixed(1).replace(".", ",") : "0,0"}%</strong></div></div></div></div>
                    <div class="relatorio-bloco"><div class="relatorio-bloco-cabecalho"><h2>Vendas por pagamento</h2><span>${numero(d.vendas.length)} vendas</span></div><div class="relatorio-bloco-corpo"><div class="relatorio-formas">${formasHtml}</div></div></div>
                    <div class="relatorio-bloco"><div class="relatorio-bloco-cabecalho"><h2>Produtos mais vendidos</h2><span>Por valor vendido</span></div><div class="relatorio-bloco-corpo"><div class="relatorio-produtos">${rankingHtml}</div></div></div>
                    <div class="relatorio-bloco"><div class="relatorio-bloco-cabecalho"><h2>Últimas vendas do período</h2><span>${numero(d.vendas.length)} registro(s)</span></div>${tabelaVendas(d.vendas)}</div>
                </div>
                <div class="relatorio-bloco" style="margin-top:18px;"><div class="relatorio-bloco-cabecalho"><h2>Compras registradas</h2><span>${numero(d.compras.length)} registro(s)</span></div>${tabelaCompras(d.compras)}</div>
            `;

            const periodo = document.getElementById("relatorioPeriodo");
            const inicio = document.getElementById("relatorioInicio");
            const fim = document.getElementById("relatorioFim");
            periodo.value = estado.periodo;

            const syncDatas = () => {
                const personalizado = periodo.value === "personalizado";
                inicio.disabled = !personalizado;
                fim.disabled = !personalizado;
            };

            periodo.addEventListener("change", () => {
                estado.periodo = periodo.value;
                syncDatas();
                render();
            });
            inicio.addEventListener("change", () => { estado.inicio = inicio.value; });
            fim.addEventListener("change", () => { estado.fim = fim.value; });
            document.getElementById("relatorioAtualizar").addEventListener("click", render);
            document.getElementById("relatorioImprimir").addEventListener("click", () => window.print());
            syncDatas();
        } catch (erro) {
            console.error("J.C Imports — erro no módulo Relatórios:", erro);
            container.innerHTML = `<div class="relatorio-bloco relatorio-erro"><div class="relatorio-bloco-cabecalho"><h2>Relatórios</h2><span>J.C Imports</span></div><div class="relatorio-vazio">Não foi possível montar os dados do relatório. Clique em <strong>Atualizar</strong> para tentar novamente.</div></div>`;
        }
    }

    function iniciar() {
        window.JCRelatorios = { atualizarInterface: render };
        render();
    }

    iniciar();
})();
