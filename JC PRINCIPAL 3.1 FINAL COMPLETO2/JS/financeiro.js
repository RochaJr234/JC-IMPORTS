/* =========================================================
   J.C IMPORTS 2.0
   MÓDULO FINANCEIRO — CONTROLE DE CAIXA — 2.3.2
   ========================================================= */

(function () {
    "use strict";

    if (!window.JCStorage) {
        console.error("JCStorage não foi carregado.");
        return;
    }

    const CATEGORIAS = [
        ["venda", "Venda"],
        ["recebimento", "Recebimento"],
        ["compra", "Compra"],
        ["despesa", "Despesa"],
        ["receita", "Receita"],
        ["ajuste", "Ajuste"],
        ["outros", "Outros"]
    ];

    const FORMAS = [
        ["dinheiro", "Dinheiro"],
        ["pix", "Pix"],
        ["cartao", "Cartão"],
        ["transferencia", "Transferência"],
        ["outro", "Outro"]
    ];

    function moeda(valor) {
        const numero = Number(valor) || 0;
        return numero.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function dataLocalHoje() {
        const d = new Date();
        const ano = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, "0");
        const dia = String(d.getDate()).padStart(2, "0");
        return `${ano}-${mes}-${dia}`;
    }

    function formatarData(data) {
        if (!data) return "—";
        const texto = String(data).slice(0, 10);
        const partes = texto.split("-");
        if (partes.length !== 3) return "—";
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function escapar(texto) {
        return String(texto ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function rotuloCategoria(valor) {
        const item = CATEGORIAS.find(x => x[0] === valor);
        return item ? item[1] : (valor || "Outros");
    }

    function rotuloForma(valor) {
        const item = FORMAS.find(x => x[0] === valor);
        return item ? item[1] : (valor || "Não informado");
    }

    function intervaloValido(data, inicio, fim) {
        const valor = String(data || "").slice(0, 10);
        if (inicio && valor < inicio) return false;
        if (fim && valor > fim) return false;
        return true;
    }

    const JCFinanceiro = {

        listar: function () {
            const dados = window.JCStorage.obterMovimentacoes();
            return Array.isArray(dados) ? dados : [];
        },

        buscarPorId: function (id) {
            return this.listar().find(item => item.id === id) || null;
        },

        normalizar: function (dados) {
            return {
                id: dados.id || window.JCStorage.gerarId("MOV"),
                tipo: String(dados.tipo || "").toLowerCase(),
                categoria: String(dados.categoria || "outros").trim().toLowerCase(),
                descricao: String(dados.descricao || "").trim(),
                valor: Number(dados.valor) || 0,
                data: dados.data || dataLocalHoje(),
                formaPagamento: String(dados.formaPagamento || "").toLowerCase(),
                vendaId: dados.vendaId || null,
                compraId: dados.compraId || null,
                produtoId: dados.produtoId || null,
                referenciaId: dados.referenciaId || null,
                origem: String(dados.origem || "").toLowerCase(),
                observacoes: String(dados.observacoes || "").trim(),
                quantidade: Number(dados.quantidade) || 0,
                custoUnitario: Number(dados.custoUnitario) || 0,
                criadoEm: dados.criadoEm || window.JCStorage.agora()
            };
        },

        validar: function (dados) {
            const tipo = String(dados.tipo || "").toLowerCase();
            const valor = Number(dados.valor);
            const data = String(dados.data || "").slice(0, 10);

            if (tipo !== "entrada" && tipo !== "saida") {
                return { valido: false, mensagem: "Informe se o lançamento é uma entrada ou saída." };
            }
            if (!Number.isFinite(valor) || valor <= 0) {
                return { valido: false, mensagem: "Informe um valor maior que zero." };
            }
            if (!String(dados.descricao || "").trim()) {
                return { valido: false, mensagem: "Informe a descrição do lançamento." };
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
                return { valido: false, mensagem: "Informe uma data válida." };
            }
            return { valido: true, mensagem: "" };
        },

        registrar: function (dados) {
            const validacao = this.validar(dados || {});
            if (!validacao.valido) {
                return { sucesso: false, mensagem: validacao.mensagem };
            }

            const movimentacao = this.normalizar(dados);
            const movimentacoes = this.listar();
            movimentacoes.push(movimentacao);

            if (!window.JCStorage.salvarMovimentacoes(movimentacoes)) {
                return { sucesso: false, mensagem: "Não foi possível salvar o lançamento." };
            }

            this.atualizarDashboard();
            this.atualizarTela();
            return {
                sucesso: true,
                movimentacao,
                mensagem: "Lançamento financeiro registrado com sucesso."
            };
        },

        entrada: function (valor, descricao, categoria, dadosExtras) {
            return this.registrar({
                tipo: "entrada",
                valor,
                descricao,
                categoria: categoria || "outros",
                ...(dadosExtras || {})
            });
        },

        saida: function (valor, descricao, categoria, dadosExtras) {
            return this.registrar({
                tipo: "saida",
                valor,
                descricao,
                categoria: categoria || "outros",
                ...(dadosExtras || {})
            });
        },

        editar: function (id, dados) {
            const movimentacoes = this.listar();
            const indice = movimentacoes.findIndex(item => item.id === id);
            if (indice === -1) {
                return { sucesso: false, mensagem: "Lançamento não encontrado." };
            }

            const atual = movimentacoes[indice];
            if (atual.vendaId || atual.compraId || atual.origem === "recebimento") {
                return {
                    sucesso: false,
                    mensagem: "Lançamentos gerados automaticamente pelo sistema não podem ser editados aqui."
                };
            }

            const novo = this.normalizar({
                ...atual,
                ...dados,
                id: atual.id,
                criadoEm: atual.criadoEm
            });

            const validacao = this.validar(novo);
            if (!validacao.valido) {
                return { sucesso: false, mensagem: validacao.mensagem };
            }

            movimentacoes[indice] = novo;
            window.JCStorage.salvarMovimentacoes(movimentacoes);
            this.atualizarDashboard();
            this.atualizarTela();

            return { sucesso: true, movimentacao: novo, mensagem: "Lançamento atualizado com sucesso." };
        },

        excluir: function (id) {
            const movimentacoes = this.listar();
            const movimentacao = movimentacoes.find(item => item.id === id);

            if (!movimentacao) {
                return { sucesso: false, mensagem: "Lançamento não encontrado." };
            }

            if (movimentacao.vendaId || movimentacao.compraId || movimentacao.origem === "recebimento") {
                return {
                    sucesso: false,
                    mensagem: "Este lançamento é vinculado a outra operação e não pode ser excluído diretamente."
                };
            }

            const novaLista = movimentacoes.filter(item => item.id !== id);
            window.JCStorage.salvarMovimentacoes(novaLista);
            this.atualizarDashboard();
            this.atualizarTela();

            return { sucesso: true, mensagem: "Lançamento excluído com sucesso." };
        },

        totalPorTipo: function (tipo, dataInicio, dataFim) {
            return this.listar()
                .filter(item => item.tipo === tipo && intervaloValido(item.data, dataInicio, dataFim))
                .reduce((total, item) => total + (Number(item.valor) || 0), 0);
        },

        totalEntradas: function (dataInicio, dataFim) {
            return this.totalPorTipo("entrada", dataInicio, dataFim);
        },

        totalSaidas: function (dataInicio, dataFim) {
            return this.totalPorTipo("saida", dataInicio, dataFim);
        },

        saldo: function (dataInicio, dataFim) {
            return this.totalEntradas(dataInicio, dataFim) - this.totalSaidas(dataInicio, dataFim);
        },

        doDia: function (dataReferencia) {
            const data = dataReferencia || dataLocalHoje();
            return this.listar().filter(item => String(item.data).slice(0, 10) === data);
        },

        doMes: function (ano, mes) {
            const agora = new Date();
            ano = ano !== undefined ? Number(ano) : agora.getFullYear();
            mes = mes !== undefined ? Number(mes) : agora.getMonth() + 1;
            return this.listar().filter(item => {
                const texto = String(item.data || "").slice(0, 10);
                return Number(texto.slice(0, 4)) === ano && Number(texto.slice(5, 7)) === mes;
            });
        },

        entradasDoMes: function (ano, mes) {
            return this.doMes(ano, mes)
                .filter(item => item.tipo === "entrada")
                .reduce((total, item) => total + (Number(item.valor) || 0), 0);
        },

        saidasDoMes: function (ano, mes) {
            return this.doMes(ano, mes)
                .filter(item => item.tipo === "saida")
                .reduce((total, item) => total + (Number(item.valor) || 0), 0);
        },

        saldoDoMes: function (ano, mes) {
            return this.entradasDoMes(ano, mes) - this.saidasDoMes(ano, mes);
        },

        totalPorCategoria: function (tipo, categoria) {
            return this.listar()
                .filter(item => item.tipo === tipo && item.categoria === categoria)
                .reduce((total, item) => total + (Number(item.valor) || 0), 0);
        },

        atualizarDashboard: function () {
            if (window.JCApp && typeof window.JCApp.atualizarDashboard === "function") {
                window.JCApp.atualizarDashboard();
            }
        },

        /* =====================================================
           INTERFACE
           ===================================================== */

        filtros: {
            inicio: "",
            fim: "",
            tipo: "todos",
            categoria: "todas",
            busca: ""
        },

        obterFiltradas: function () {
            const f = this.filtros;
            const busca = String(f.busca || "").trim().toLowerCase();

            return this.listar()
                .filter(item => {
                    if (f.tipo !== "todos" && item.tipo !== f.tipo) return false;
                    if (f.categoria !== "todas" && item.categoria !== f.categoria) return false;
                    if (!intervaloValido(item.data, f.inicio, f.fim)) return false;
                    if (busca) {
                        const texto = [item.descricao, item.observacoes, item.categoria, item.formaPagamento]
                            .join(" ").toLowerCase();
                        if (!texto.includes(busca)) return false;
                    }
                    return true;
                })
                .sort((a, b) => {
                    const dataA = String(a.data || "");
                    const dataB = String(b.data || "");
                    if (dataA !== dataB) return dataB.localeCompare(dataA);
                    return String(b.criadoEm || "").localeCompare(String(a.criadoEm || ""));
                });
        },

        atualizarTela: function () {
            const pagina = document.getElementById("page-financeiro");
            if (!pagina || pagina.hidden) return;
            this.renderizar();
        },

        renderizar: function () {
            const pagina = document.getElementById("page-financeiro");
            const container = document.getElementById("financeiroContent");
            if (!container) return;
            if (pagina) {
                pagina.hidden = false;
                pagina.classList.add("active");
            }

            const filtradas = this.obterFiltradas();
            const entradas = filtradas.filter(x => x.tipo === "entrada")
                .reduce((s, x) => s + (Number(x.valor) || 0), 0);
            const saidas = filtradas.filter(x => x.tipo === "saida")
                .reduce((s, x) => s + (Number(x.valor) || 0), 0);
            const saldo = entradas - saidas;
            const contasBrutas = window.JCStorage && typeof window.JCStorage.obterContasReceber === "function"
                ? window.JCStorage.obterContasReceber()
                : [];
            const contas = Array.isArray(contasBrutas) ? contasBrutas : [];
            const aReceber = contas.reduce((s, c) => {
                const valor = Number(c.valor) || 0;
                const pago = Number(c.valorPago) || 0;
                return s + Math.max(0, valor - pago);
            }, 0);

            container.innerHTML = `
                <div class="financeiro-dashboard">
                    <div class="financeiro-topo">
                        <div>
                            <span class="financeiro-eyebrow">CONTROLE FINANCEIRO</span>
                            <h2>Movimentação financeira</h2>
                            <p>Veja o dinheiro que entrou, saiu e o saldo do período selecionado.</p>
                        </div>
                        <button type="button" class="primary-button financeiro-novo" id="btnNovoLancamentoFinanceiro">
                            + Novo lançamento
                        </button>
                    </div>

                    <div class="financeiro-cards">
                        <div class="financeiro-card entrada">
                            <span class="financeiro-card-icon">↗</span>
                            <span class="financeiro-card-label">Entradas</span>
                            <strong>${moeda(entradas)}</strong>
                            <small>no período</small>
                        </div>
                        <div class="financeiro-card saida">
                            <span class="financeiro-card-icon">↘</span>
                            <span class="financeiro-card-label">Saídas</span>
                            <strong>${moeda(saidas)}</strong>
                            <small>no período</small>
                        </div>
                        <div class="financeiro-card saldo">
                            <span class="financeiro-card-icon">R$</span>
                            <span class="financeiro-card-label">Saldo</span>
                            <strong>${moeda(saldo)}</strong>
                            <small>entradas − saídas</small>
                        </div>
                        <div class="financeiro-card receber">
                            <span class="financeiro-card-icon">◷</span>
                            <span class="financeiro-card-label">A receber</span>
                            <strong>${moeda(aReceber)}</strong>
                            <small>pendente</small>
                        </div>
                    </div>

                    <div class="financeiro-filtros">
                        <div class="financeiro-filtros-titulo">
                            <strong>Filtrar movimentações</strong>
                            <div class="financeiro-atalhos">
                                <button type="button" data-fin-periodo="hoje">Hoje</button>
                                <button type="button" data-fin-periodo="mes">Mês atual</button>
                                <button type="button" data-fin-periodo="tudo">Tudo</button>
                            </div>
                        </div>
                        <div class="financeiro-filtros-grid">
                            <label>De<input type="date" id="finDataInicio" value="${escapar(this.filtros.inicio)}"></label>
                            <label>Até<input type="date" id="finDataFim" value="${escapar(this.filtros.fim)}"></label>
                            <label>Tipo<select id="finTipo"><option value="todos">Todos</option><option value="entrada" ${this.filtros.tipo === "entrada" ? "selected" : ""}>Entradas</option><option value="saida" ${this.filtros.tipo === "saida" ? "selected" : ""}>Saídas</option></select></label>
                            <label>Categoria<select id="finCategoria"><option value="todas">Todas</option>${CATEGORIAS.map(([v, l]) => `<option value="${v}" ${this.filtros.categoria === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
                            <label class="financeiro-busca">Pesquisar<input type="search" id="finBusca" placeholder="Descrição, categoria..." value="${escapar(this.filtros.busca)}"></label>
                        </div>
                    </div>

                    <div class="financeiro-lista-panel">
                        <div class="financeiro-lista-header">
                            <div>
                                <strong>Histórico financeiro</strong>
                                <span>${filtradas.length} movimentação${filtradas.length === 1 ? "" : "ões"}</span>
                            </div>
                            <button type="button" class="secondary-button" id="btnLimparFiltrosFinanceiro">Limpar filtros</button>
                        </div>
                        <div class="financeiro-lista" id="listaFinanceiro">
                            ${this.renderizarLista(filtradas)}
                        </div>
                    </div>
                </div>
            `;

            this.vincularEventos();
        },

        renderizarLista: function (lista) {
            if (!lista.length) {
                return `<div class="financeiro-vazio"><div>R$</div><strong>Nenhuma movimentação encontrada</strong><p>Altere os filtros ou registre um novo lançamento.</p></div>`;
            }

            return lista.map(item => {
                const automatico = Boolean(item.vendaId || item.compraId || item.origem === "recebimento");
                const sinal = item.tipo === "entrada" ? "+" : "−";
                const classe = item.tipo === "entrada" ? "entrada" : "saida";
                const origem = item.vendaId ? "Venda" : item.compraId ? "Compra" : item.origem === "recebimento" ? "Recebimento" : "Manual";
                return `
                    <article class="financeiro-item ${classe}">
                        <div class="financeiro-item-icone">${item.tipo === "entrada" ? "↗" : "↘"}</div>
                        <div class="financeiro-item-main">
                            <strong>${escapar(item.descricao || "Movimentação")}</strong>
                            <div class="financeiro-item-meta">
                                <span>${formatarData(item.data)}</span>
                                <span>${escapar(rotuloCategoria(item.categoria))}</span>
                                ${item.formaPagamento ? `<span>${escapar(rotuloForma(item.formaPagamento))}</span>` : ""}
                                <span class="financeiro-origem">${origem}</span>
                            </div>
                        </div>
                        <div class="financeiro-item-valor ${classe}">${sinal} ${moeda(item.valor)}</div>
                        <div class="financeiro-item-acoes">
                            ${automatico ? `<span class="financeiro-automatico">Automático</span>` : `<button type="button" class="financeiro-acao editar" data-fin-editar="${escapar(item.id)}">Editar</button><button type="button" class="financeiro-acao excluir" data-fin-excluir="${escapar(item.id)}">Excluir</button>`}
                        </div>
                    </article>
                `;
            }).join("");
        },

        vincularEventos: function () {
            const self = this;
            const container = document.getElementById("financeiroContent");
            if (!container) return;

            const aplicar = () => {
                self.filtros.inicio = document.getElementById("finDataInicio")?.value || "";
                self.filtros.fim = document.getElementById("finDataFim")?.value || "";
                self.filtros.tipo = document.getElementById("finTipo")?.value || "todos";
                self.filtros.categoria = document.getElementById("finCategoria")?.value || "todas";
                self.filtros.busca = document.getElementById("finBusca")?.value || "";
                self.renderizar();
            };

            ["finDataInicio", "finDataFim", "finTipo", "finCategoria"].forEach(id => {
                document.getElementById(id)?.addEventListener("change", aplicar);
            });
            document.getElementById("finBusca")?.addEventListener("input", aplicar);

            container.querySelectorAll("[data-fin-periodo]").forEach(btn => {
                btn.addEventListener("click", () => {
                    const hoje = dataLocalHoje();
                    if (btn.dataset.finPeriodo === "hoje") {
                        self.filtros.inicio = hoje;
                        self.filtros.fim = hoje;
                    } else if (btn.dataset.finPeriodo === "mes") {
                        const agora = new Date();
                        const inicio = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-01`;
                        const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
                        self.filtros.inicio = inicio;
                        self.filtros.fim = `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, "0")}-${String(fim.getDate()).padStart(2, "0")}`;
                    } else {
                        self.filtros.inicio = "";
                        self.filtros.fim = "";
                    }
                    self.renderizar();
                });
            });

            document.getElementById("btnLimparFiltrosFinanceiro")?.addEventListener("click", () => {
                self.filtros = { inicio: "", fim: "", tipo: "todos", categoria: "todas", busca: "" };
                self.renderizar();
            });

            document.getElementById("btnNovoLancamentoFinanceiro")?.addEventListener("click", () => self.abrirModal());

            container.querySelectorAll("[data-fin-editar]").forEach(btn => {
                btn.addEventListener("click", () => self.abrirModal(btn.dataset.finEditar));
            });

            container.querySelectorAll("[data-fin-excluir]").forEach(btn => {
                btn.addEventListener("click", () => {
                    const id = btn.dataset.finExcluir;
                    const item = self.buscarPorId(id);
                    if (!item) return;
                    if (!confirm(`Excluir o lançamento "${item.descricao}"?`)) return;
                    const resultado = self.excluir(id);
                    alert(resultado.mensagem);
                });
            });
        },

        abrirModal: function (id) {
            const existente = id ? this.buscarPorId(id) : null;
            if (existente && (existente.vendaId || existente.compraId || existente.origem === "recebimento")) {
                alert("Este lançamento é automático e é controlado pela operação de origem.");
                return;
            }

            document.getElementById("modalFinanceiro")?.remove();
            const editando = Boolean(existente);
            const modal = document.createElement("div");
            modal.id = "modalFinanceiro";
            modal.className = "financeiro-modal-overlay";
            modal.innerHTML = `
                <div class="financeiro-modal" role="dialog" aria-modal="true">
                    <div class="financeiro-modal-header">
                        <div><span>FINANCEIRO</span><h2>${editando ? "Editar lançamento" : "Novo lançamento"}</h2><p>Registre uma entrada ou saída manual.</p></div>
                        <button type="button" class="financeiro-modal-fechar" aria-label="Fechar">×</button>
                    </div>
                    <form id="formFinanceiroManual" class="financeiro-modal-body">
                        <div class="financeiro-tipo-switch">
                            <label><input type="radio" name="finTipoManual" value="entrada" ${!existente || existente.tipo === "entrada" ? "checked" : ""}><span>Entrada</span></label>
                            <label><input type="radio" name="finTipoManual" value="saida" ${existente?.tipo === "saida" ? "checked" : ""}><span>Saída</span></label>
                        </div>
                        <div class="financeiro-form-grid">
                            <label>Descrição *<input id="finManualDescricao" required maxlength="120" placeholder="Ex.: pagamento de fornecedor" value="${escapar(existente?.descricao || "")}"></label>
                            <label>Valor *<input id="finManualValor" required type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="0,00" value="${existente ? Number(existente.valor) : ""}"></label>
                            <label>Data *<input id="finManualData" required type="date" value="${escapar(String(existente?.data || dataLocalHoje()).slice(0, 10))}"></label>
                            <label>Categoria<select id="finManualCategoria">${CATEGORIAS.map(([v,l]) => `<option value="${v}" ${existente?.categoria === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
                            <label>Forma de pagamento<select id="finManualForma"><option value="">Não informado</option>${FORMAS.map(([v,l]) => `<option value="${v}" ${existente?.formaPagamento === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
                            <label class="financeiro-form-full">Observações<textarea id="finManualObs" rows="3" maxlength="300" placeholder="Informações adicionais...">${escapar(existente?.observacoes || "")}</textarea></label>
                        </div>
                        <div class="financeiro-modal-footer"><button type="button" class="secondary-button" data-fechar-financeiro>Cancelar</button><button type="submit" class="primary-button">${editando ? "Salvar alterações" : "Registrar lançamento"}</button></div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            const fechar = () => modal.remove();
            modal.querySelector(".financeiro-modal-fechar").addEventListener("click", fechar);
            modal.querySelector("[data-fechar-financeiro]").addEventListener("click", fechar);
            modal.addEventListener("click", e => { if (e.target === modal) fechar(); });

            modal.querySelector("#formFinanceiroManual").addEventListener("submit", e => {
                e.preventDefault();
                const dados = {
                    tipo: modal.querySelector("input[name='finTipoManual']:checked")?.value,
                    descricao: modal.querySelector("#finManualDescricao").value,
                    valor: modal.querySelector("#finManualValor").value,
                    data: modal.querySelector("#finManualData").value,
                    categoria: modal.querySelector("#finManualCategoria").value,
                    formaPagamento: modal.querySelector("#finManualForma").value,
                    observacoes: modal.querySelector("#finManualObs").value,
                    origem: "manual"
                };
                const resultado = editando ? this.editar(id, dados) : this.registrar(dados);
                if (!resultado.sucesso) {
                    alert(resultado.mensagem);
                    return;
                }
                fechar();
                alert(resultado.mensagem);
            });
        }
    };

    window.JCFinanceiro = JCFinanceiro;

    document.addEventListener("DOMContentLoaded", function () {
        JCFinanceiro.atualizarTela();
    });

})();
