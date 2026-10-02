/* =========================================================
   J.C IMPORTS 2.0
   MÓDULO: COMPRAS
   Registro de compras, investimento e entrada de estoque
   ========================================================= */

(function () {

    "use strict";


    if (
        !window.JCStorage ||
        !window.JCProdutos
    ) {

        console.error(
            "JCStorage ou JCProdutos não foi carregado."
        );

        return;
    }


    const PAGAMENTOS = {

        dinheiro: "Dinheiro",

        pix: "Pix",

        cartao: "Cartão",

        prazo: "Prazo"

    };


    const SITUACOES = {

        transito: "Aguardando chegada",

        parcial: "Recebimento parcial",

        recebida: "Recebida"

    };


    function arredondarCentavos(valor) {
        const n = Number(valor);
        return Number.isFinite(n) ? Math.round((n + Number.EPSILON) * 100) / 100 : 0;
    }


    function moeda(valor) {

        const numero =
            Number(valor) || 0;

        return numero.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

    }


    function numero(valor) {

        if (typeof valor === "number") {
            return Number.isFinite(valor) ? valor : 0;
        }

        let texto = String(valor ?? "")
            .trim()
            .replace(/\s/g, "");

        if (!texto) return 0;

        // Aceita 1234,56 e também 1.234,56 sem alterar números
        // que já chegam no formato decimal do navegador.
        if (texto.includes(",") && texto.includes(".")) {
            texto = texto.replace(/\./g, "").replace(",", ".");
        } else if (texto.includes(",")) {
            texto = texto.replace(",", ".");
        }

        const n = Number(texto);
        return Number.isFinite(n) ? n : 0;

    }


    function escaparHTML(valor) {

        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function formatarData(data) {

        if (!data) {
            return "-";
        }

        const partes =
            String(data).split("-");

        if (partes.length === 3) {

            return (
                partes[2] +
                "/" +
                partes[1] +
                "/" +
                partes[0]
            );

        }

        const d =
            new Date(data);

        if (
            Number.isNaN(
                d.getTime()
            )
        ) {

            return "-";

        }

        return d.toLocaleDateString(
            "pt-BR"
        );

    }


    function dataHoje() {

        const agora =
            new Date();

        return (
            agora.getFullYear() +
            "-" +
            String(
                agora.getMonth() + 1
            ).padStart(2, "0") +
            "-" +
            String(
                agora.getDate()
            ).padStart(2, "0")
        );

    }


    function obterCompras() {

        if (
            typeof JCStorage.obterCompras !==
            "function"
        ) {

            return [];

        }

        const compras =
            JCStorage.obterCompras();

        return Array.isArray(compras)
            ? compras
            : [];

    }


    function situacaoCompra(compra) {

        const situacao = String(compra?.situacao || "recebida");

        if (situacao === "transito" || situacao === "parcial" || situacao === "recebida") {
            return situacao;
        }

        return "recebida";
    }


    function quantidadeRecebidaCompra(compra) {

        const total = Math.max(0, Number(compra?.quantidade) || 0);
        const registrada = Number(compra?.quantidadeRecebida);

        if (Number.isFinite(registrada)) {
            return Math.max(0, Math.min(total, registrada));
        }

        return situacaoCompra(compra) === "recebida" ? total : 0;
    }


    function quantidadePendenteCompra(compra) {
        return Math.max(0, (Number(compra?.quantidade) || 0) - quantidadeRecebidaCompra(compra));
    }


    function obterEtiquetaSituacao(compra) {

        const situacao = situacaoCompra(compra);
        const classes = {
            transito: "#fff7e6;color:#795b13;border:1px solid #f2d28a",
            parcial: "#eaf4ff;color:#1557a6;border:1px solid #b9d5f5",
            recebida: "#eaf8ef;color:#18794e;border:1px solid #b8e0c8"
        };

        return `<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;${classes[situacao] || classes.recebida}">${escaparHTML(SITUACOES[situacao] || SITUACOES.recebida)}</span>`;
    }


    function atualizarSelectProdutos() {

        const select =
            document.getElementById(
                "compraProduto"
            );

        if (!select) {
            return;
        }

        const valorAtual =
            select.value;

        const produtos =
            JCProdutos.listar()
                .sort(function (a, b) {

                    return String(
                        a.nome || ""
                    ).localeCompare(
                        String(
                            b.nome || ""
                        ),
                        "pt-BR"
                    );

                });

        select.innerHTML = `

            <option value="">
                Selecione um produto
            </option>

            ${
                produtos.map(
                    function (produto) {

                        const estoque =
                            Number(
                                produto.estoque
                            ) || 0;

                        return `

                            <option
                                value="${escaparHTML(
                                    produto.id
                                )}"
                            >
                                ${escaparHTML(
                                    produto.nome
                                )}
                                — Estoque: ${estoque}
                            </option>

                        `;

                    }
                ).join("")
            }

        `;

        if (
            produtos.some(
                function (produto) {
                    return String(
                        produto.id
                    ) === String(
                        valorAtual
                    );
                }
            )
        ) {

            select.value =
                valorAtual;

        }

    }


    function atualizarCamposProduto() {

        const select =
            document.getElementById(
                "compraProduto"
            );

        const custo =
            document.getElementById(
                "compraCusto"
            );

        const venda =
            document.getElementById(
                "compraVenda"
            );

        if (!select) {
            return;
        }

        const produto =
            JCProdutos.buscarPorId(
                select.value
            );

        if (!produto) {

            if (custo) custo.value = "";

            if (venda) venda.value = "";

            atualizarPreview();

            return;

        }

        if (custo) {

            custo.value =
                Number(
                    produto.precoCusto
                ) > 0
                    ? Number(
                        produto.precoCusto
                    ).toFixed(2)
                    : "";

        }

        if (venda) {

            venda.value =
                Number(
                    produto.precoVenda
                ) > 0
                    ? Number(
                        produto.precoVenda
                    ).toFixed(2)
                    : "";

        }

        atualizarPreview();

    }


    function atualizarPreview() {

        const custo =
            numero(
                document.getElementById(
                    "compraCusto"
                )?.value
            );

        const venda =
            numero(
                document.getElementById(
                    "compraVenda"
                )?.value
            );

        const lucro =
            venda - custo;

        const margem =
            venda > 0
                ? (lucro / venda) * 100
                : 0;

        const elementoLucro =
            document.getElementById(
                "compraLucroPreview"
            );

        const elementoMargem =
            document.getElementById(
                "compraMargemPreview"
            );

        if (elementoLucro) {

            elementoLucro.textContent =
                moeda(lucro);

        }

        if (elementoMargem) {

            elementoMargem.textContent =
                margem.toLocaleString(
                    "pt-BR",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                ) + "%";

        }

    }


    function dataLocalISOCompra(offsetDias = 0) {
        const d = new Date();
        d.setDate(d.getDate() + Number(offsetDias || 0));
        return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
    }

    function dataValidaISOCompra(data) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data || ""))) return false;
        const [ano, mes, dia] = String(data).split("-").map(Number);
        const teste = new Date(ano, mes - 1, dia, 12, 0, 0);
        return teste.getFullYear() === ano && teste.getMonth() === mes - 1 && teste.getDate() === dia;
    }

    function formatarDataISOCompra(d) {
        return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }

    function adicionarMesesPreservandoDiaCompra(dataBase, meses) {
        const original = new Date(dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate(), 12, 0, 0);
        const diaOriginal = original.getDate();
        const destinoMes = original.getMonth() + Number(meses || 0);
        const ultimoDia = new Date(original.getFullYear(), destinoMes + 1, 0, 12, 0, 0).getDate();
        return new Date(original.getFullYear(), destinoMes, Math.min(diaOriginal, ultimoDia), 12, 0, 0);
    }

    function gerarParcelasCompra(total, quantidade, primeiraData) {
        const qtd = Math.max(1, Number(quantidade) || 1);
        const valorTotal = Math.round((Number(total) || 0) * 100) / 100;
        const valorBase = Math.floor((valorTotal / qtd) * 100) / 100;
        const resto = Math.round((valorTotal - valorBase * qtd) * 100) / 100;
        const parcelas = [];
        const base = primeiraData || dataLocalISOCompra(30);
        if (!dataValidaISOCompra(base)) return [];
        const inicio = new Date(base + "T12:00:00");
        for (let i = 0; i < qtd; i++) {
            const data = adicionarMesesPreservandoDiaCompra(inicio, i);
            parcelas.push({ numero: i + 1, valor: Number((valorBase + (i === qtd - 1 ? resto : 0)).toFixed(2)), vencimento: formatarDataISOCompra(data) });
        }
        return parcelas;
    }

    function atualizarCamposPagamentoCompra() {
        const pagamento = document.getElementById("compraPagamento");
        const campoParcelas = document.getElementById("campoParcelasCompra");
        const campoPrimeira = document.getElementById("campoPrimeiraParcelaCompra");
        const campoPrazo = document.getElementById("campoVencimentoCompra");
        const parcelas = document.getElementById("compraParcelas");
        const primeira = document.getElementById("compraPrimeiraParcela");
        const vencimento = document.getElementById("compraVencimento");
        if (!pagamento) return;
        const cartao = pagamento.value === "cartao";
        const prazo = pagamento.value === "prazo";
        if (campoParcelas) campoParcelas.hidden = !cartao;
        if (campoPrimeira) campoPrimeira.hidden = !cartao;
        if (campoPrazo) campoPrazo.hidden = !prazo;
        if (cartao && primeira && !primeira.value) primeira.value = dataLocalISOCompra(30);
        if (prazo && vencimento && !vencimento.value) vencimento.value = dataLocalISOCompra(30);
        if (!cartao && primeira) primeira.value = "";
        if (!prazo && vencimento) vencimento.value = "";
        if (!cartao && parcelas) parcelas.value = "1";
    }


    function atualizarAvisoPrazo() {

        const select =
            document.getElementById(
                "compraPagamento"
            );

        const aviso =
            document.getElementById(
                "avisoCompraPrazo"
            );

        if (!select || !aviso) {
            return;
        }

        aviso.hidden =
            select.value !== "prazo";

    }


    function registrarCompra(evento) {

        evento.preventDefault();

        const produtoId = document.getElementById("compraProduto").value;
        const quantidade = numero(document.getElementById("compraQuantidade").value);
        const custo = numero(document.getElementById("compraCusto").value);
        const venda = numero(document.getElementById("compraVenda").value);
        const situacao = document.getElementById("compraSituacao")?.value || "transito";
        const previsaoEntrega = document.getElementById("compraPrevisaoEntrega")?.value || null;
        const pagamento = document.getElementById("compraPagamento").value;
        const parcelas = pagamento === "cartao"
            ? Math.max(1, Number(document.getElementById("compraParcelas")?.value || 1))
            : 1;
        const primeiraParcela = pagamento === "cartao"
            ? (document.getElementById("compraPrimeiraParcela")?.value || dataLocalISOCompra(30))
            : null;
        const vencimento = pagamento === "prazo"
            ? (document.getElementById("compraVencimento")?.value || "")
            : null;
        const data = document.getElementById("compraData").value;
        const observacoes = document.getElementById("compraObservacoes").value.trim();
        const produto = JCProdutos.buscarPorId(produtoId);

        if (!produto) { alert("Selecione um produto."); return; }
        if (!Number.isInteger(quantidade) || quantidade <= 0) { alert("Informe uma quantidade inteira válida."); return; }
        if (custo < 0 || !Number.isFinite(custo)) { alert("Informe um valor de compra válido."); return; }
        if (venda < 0 || !Number.isFinite(venda)) { alert("Informe um valor de venda válido."); return; }
        if (!data || !dataValidaISOCompra(data)) { alert("Informe uma data de compra válida."); return; }
        if (previsaoEntrega && !dataValidaISOCompra(previsaoEntrega)) { alert("Informe uma previsão de entrega válida."); return; }

        if (pagamento === "cartao") {
            if (!dataValidaISOCompra(primeiraParcela)) { alert("Informe uma data válida para a 1ª parcela."); return; }
            if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 12) { alert("Informe um parcelamento entre 1x e 12x."); return; }
        }
        if (pagamento === "prazo" && !dataValidaISOCompra(vencimento)) { alert("Informe a data de vencimento da compra a prazo."); return; }

        const valorTotal = arredondarCentavos(quantidade * custo);
        const lucroUnitario = arredondarCentavos(venda - custo);
        const margemPercentual = venda > 0 ? arredondarCentavos((lucroUnitario / venda) * 100) : 0;
        const recebidaAgora = situacao === "recebida";
        let entrada = null;

        if (recebidaAgora) {
            entrada = JCProdutos.registrarEntradaCompra(produto.id, quantidade, custo);
            if (!entrada || entrada.sucesso === false) {
                alert(entrada?.mensagem || "Não foi possível atualizar o estoque.");
                return;
            }
        }

        const produtos = JCProdutos.listar();
        const produtoAtualizado = produtos.find(function (item) { return item.id === produto.id; });
        if (produtoAtualizado && recebidaAgora) {
            produtoAtualizado.precoVenda = venda;
            produtoAtualizado.atualizadoEm = JCStorage.agora();
            JCStorage.salvarProdutos(produtos);
        }

        const compras = obterCompras();
        const numeroCompra = "COMP-" + String(compras.length + 1).padStart(5, "0");

        const compra = JCStorage.adicionarCompra({
            numero: numeroCompra,
            produtoId: produto.id,
            produtoCodigo: produto.codigo || "",
            produtoNome: produto.nome || "",
            categoria: produto.categoria || "Sem categoria",
            quantidade: quantidade,
            quantidadeRecebida: recebidaAgora ? quantidade : 0,
            situacao: recebidaAgora ? "recebida" : "transito",
            previsaoEntrega: previsaoEntrega,
            recebidaEm: recebidaAgora ? JCStorage.agora() : null,
            custoUnitario: custo,
            precoVendaUnitario: venda,
            totalCompra: valorTotal,
            lucroUnitario: lucroUnitario,
            margemPercentual: margemPercentual,
            formaPagamento: pagamento,
            statusPagamento: pagamento === "prazo" ? "pendente" : "pago",
            parcelas: parcelas,
            primeiraParcela: primeiraParcela,
            vencimento: vencimento,
            cronogramaParcelas: pagamento === "cartao" ? gerarParcelasCompra(valorTotal, parcelas, primeiraParcela) : [],
            data: data,
            observacoes: observacoes
        });

        /* O pagamento acontece independentemente de a mercadoria já ter chegado. */
        if (pagamento !== "prazo") {
            JCStorage.adicionarMovimentacao({
                tipo: "saida",
                categoria: "compra",
                descricao: "Compra " + numeroCompra + " - " + produto.nome,
                valor: valorTotal,
                data: data,
                formaPagamento: pagamento,
                produtoId: produto.id,
                compraId: compra.id,
                quantidade: quantidade,
                custoUnitario: custo,
                observacoes: observacoes
            });
        }

        atualizarTela();
        atualizarSelectProdutos();
        document.getElementById("formCompra").reset();
        document.getElementById("compraData").value = dataHoje();
        document.getElementById("compraQuantidade").value = 1;
        document.getElementById("compraSituacao").value = "transito";
        atualizarSelectProdutos();
        atualizarPreview();
        atualizarAvisoPrazo();
        atualizarCamposPagamentoCompra();

        if (recebidaAgora) {
            alert("Compra registrada e entrada realizada no estoque.\n\nProduto: " + produto.nome + "\nQuantidade: " + quantidade + "\nTotal: " + moeda(valorTotal) + "\nEstoque atual: " + (Number(entrada?.produto?.estoque) || 0));
        } else {
            alert("Compra registrada em trânsito.\n\nProduto: " + produto.nome + "\nQuantidade: " + quantidade + "\nTotal: " + moeda(valorTotal) + "\n\nA mercadoria não foi adicionada ao estoque. Quando chegar, use \"Receber mercadoria\" no histórico de compras.");
        }

    }

    function atualizarResumo() {

        const compras = obterCompras();
        const total = compras.length;
        const investimento = compras.reduce(function (soma, compra) { return soma + numero(compra.totalCompra); }, 0);
        const emTransito = compras.reduce(function (soma, compra) { return soma + quantidadePendenteCompra(compra); }, 0);
        const valorEmTransito = compras.reduce(function (soma, compra) { return soma + quantidadePendenteCompra(compra) * numero(compra.custoUnitario); }, 0);

        const elementoTotal = document.getElementById("comprasTotal");
        const elementoInvestimento = document.getElementById("comprasInvestimento");
        const elementoTransito = document.getElementById("comprasEmTransito");
        const elementoValorTransito = document.getElementById("comprasValorEmTransito");

        if (elementoTotal) elementoTotal.textContent = total;
        if (elementoInvestimento) elementoInvestimento.textContent = moeda(investimento);
        if (elementoTransito) elementoTransito.textContent = emTransito;
        if (elementoValorTransito) elementoValorTransito.textContent = moeda(valorEmTransito);
    }

    let categoriaComprasSelecionada = "__TODAS__";

    function categoriaDaCompra(compra) {
        if (compra && compra.categoria) return String(compra.categoria).trim() || "Sem categoria";
        const produto = JCProdutos.buscarPorId(compra?.produtoId);
        return String(produto?.categoria || "Sem categoria").trim() || "Sem categoria";
    }

    function renderizarPastasCompras(compras) {
        const host = document.getElementById("comprasPastasCategorias");
        if (!host) return;
        const mapa = {};
        compras.forEach(c => {
            const cat = categoriaDaCompra(c);
            mapa[cat] = (mapa[cat] || 0) + 1;
        });
        const cats = Object.keys(mapa).sort((a,b)=>a.localeCompare(b,"pt-BR"));
        const botoes = [
            `<button type="button" class="compra-pasta ${categoriaComprasSelecionada === "__TODAS__" ? "ativo" : ""}" data-categoria-compra="__TODAS__">📁 Todas <span>${compras.length}</span></button>`,
            ...cats.map(cat => `<button type="button" class="compra-pasta ${categoriaComprasSelecionada === cat ? "ativo" : ""}" data-categoria-compra="${escaparHTML(cat)}">📁 ${escaparHTML(cat)} <span>${mapa[cat]}</span></button>`)
        ];
        host.innerHTML = botoes.join("");
        host.querySelectorAll("[data-categoria-compra]").forEach(btn => {
            btn.onclick = () => {
                categoriaComprasSelecionada = btn.dataset.categoriaCompra || "__TODAS__";
                renderizarHistorico();
            };
        });
    }

    function renderizarHistorico() {

        const tabela = document.getElementById("listaCompras");
        if (!tabela) return;

        const compras = obterCompras().slice().sort(function (a, b) {
            return new Date(b.data || 0) - new Date(a.data || 0);
        });

        renderizarPastasCompras(compras);

        const filtradas = categoriaComprasSelecionada === "__TODAS__"
            ? compras
            : compras.filter(c => categoriaDaCompra(c) === categoriaComprasSelecionada);

        const pastaTotal = document.getElementById("comprasTotalPasta");
        if (pastaTotal) pastaTotal.textContent = filtradas.length;

        if (filtradas.length === 0) {
            tabela.innerHTML = `<tr><td colspan="12" class="empty-table">Nenhuma compra encontrada nesta categoria.</td></tr>`;
            return;
        }

        tabela.innerHTML = filtradas.map(function (compra) {
            const margem = numero(compra.margemPercentual);
            const total = Math.max(0, Number(compra.quantidade) || 0);
            const recebido = quantidadeRecebidaCompra(compra);
            const pendente = Math.max(0, total - recebido);
            const situacao = situacaoCompra(compra);
            const categoria = categoriaDaCompra(compra);
            const acaoReceber = pendente > 0
                ? `<button type="button" class="btn-receber-compra" data-id="${escaparHTML(compra.id)}" title="Registrar chegada da mercadoria">📥 Receber</button>`
                : `<span style="font-size:12px;color:#18794e;font-weight:700;">✓ Entrada concluída</span>`;

            return `
                <tr>
                    <td>${escaparHTML(formatarData(compra.data))}${compra.previsaoEntrega && pendente > 0 ? `<small class="historico-subinfo">Entrega: ${escaparHTML(formatarData(compra.previsaoEntrega))}</small>` : ""}</td>
                    <td><strong>${escaparHTML(compra.produtoNome)}</strong><small>${escaparHTML(compra.numero)}</small></td>
                    <td><span class="compra-categoria-badge">${escaparHTML(categoria)}</span></td>
                    <td>${total}</td>
                    <td><strong>${recebido}</strong>${pendente > 0 ? `<small class="historico-subinfo">${pendente} pendente(s)</small>` : ""}</td>
                    <td>${obterEtiquetaSituacao(compra)}</td>
                    <td>${moeda(compra.custoUnitario)}</td>
                    <td>${moeda(compra.precoVendaUnitario)}</td>
                    <td>${moeda(compra.totalCompra)}</td>
                    <td>${escaparHTML(PAGAMENTOS[compra.formaPagamento] || compra.formaPagamento || "-")}
                        ${compra.formaPagamento === "cartao" ? `<small class="historico-subinfo">${Number(compra.parcelas) || 1}x${compra.primeiraParcela ? ` · 1ª ${formatarData(compra.primeiraParcela)}` : ""}</small>` : ""}
                        ${compra.formaPagamento === "prazo" && compra.vencimento ? `<small class="historico-subinfo">Venc. ${formatarData(compra.vencimento)}</small>` : ""}
                    </td>
                    <td>${margem.toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2})}%</td>
                    <td class="compras-acoes">
                        ${acaoReceber}
                        <button type="button" class="btn-editar-compra" data-id="${escaparHTML(compra.id)}" title="Editar compra">✏️</button>
                        <button type="button" class="btn-excluir-compra" data-id="${escaparHTML(compra.id)}" title="Excluir compra">🗑️</button>
                    </td>
                </tr>`;
        }).join("");
    }


    function salvarListaCompras(compras) {
        return JCStorage.salvarCompras(compras);
    }


    function localizarCompra(compraId) {
        return obterCompras().find(function (compra) {
            return String(compra.id) === String(compraId);
        }) || null;
    }


    function ajustarEstoqueCompraEditada(compraAntiga, novaQuantidadeRecebida, novoCusto, produto) {

        const estoqueAtual = Number(produto.estoque) || 0;
        const custoAtual = Number(produto.precoCusto) || 0;
        const quantidadeAntigaRecebida = quantidadeRecebidaCompra(compraAntiga);
        const novaRecebida = Math.max(0, Number(novaQuantidadeRecebida) || 0);

        if (novaRecebida > (Number(compraAntiga.quantidade) || 0)) {
            return { sucesso: false, mensagem: "A quantidade recebida não pode ser maior que a quantidade comprada." };
        }

        const novoEstoque = estoqueAtual - quantidadeAntigaRecebida + novaRecebida;
        if (novoEstoque < 0) {
            return { sucesso: false, mensagem: "Não é possível reduzir essa entrada porque parte desse estoque já foi utilizada em vendas." };
        }

        const valorAtualEstoque = estoqueAtual * custoAtual;
        const valorSemCompraAntiga = valorAtualEstoque - (quantidadeAntigaRecebida * (Number(compraAntiga.custoUnitario) || 0));
        const novoValorEstoque = valorSemCompraAntiga + (novaRecebida * (Number(novoCusto) || 0));

        if (novoValorEstoque < -0.01) {
            return { sucesso: false, mensagem: "Não foi possível recalcular o custo do estoque com segurança." };
        }

        produto.estoque = novoEstoque;
        produto.precoCusto = novoEstoque > 0 ? Math.max(0, novoValorEstoque) / novoEstoque : 0;
        produto.atualizadoEm = JCStorage.agora();

        return { sucesso: true, produto: produto };
    }

    function atualizarMovimentacaoCompra(compraAntiga, compraNova, produto) {
        let movimentacoes = JCStorage.obterMovimentacoes();
        const indice = movimentacoes.findIndex(function (mov) {
            return String(mov.compraId || "") === String(compraAntiga.id);
        });

        const deveGerarSaida = compraNova.formaPagamento !== "prazo";

        const dadosMovimentacao = {
            tipo: "saida",
            categoria: "compra",
            descricao: "Compra " + compraNova.numero + " - " + produto.nome,
            valor: Number(compraNova.totalCompra) || 0,
            data: compraNova.data,
            formaPagamento: compraNova.formaPagamento,
            produtoId: produto.id,
            compraId: compraNova.id,
            quantidade: Number(compraNova.quantidade) || 0,
            custoUnitario: Number(compraNova.custoUnitario) || 0,
            observacoes: compraNova.observacoes || ""
        };

        if (deveGerarSaida) {
            if (indice >= 0) {
                movimentacoes[indice] = {
                    ...movimentacoes[indice],
                    ...dadosMovimentacao
                };
            } else {
                movimentacoes.push({
                    id: JCStorage.gerarId("FIN"),
                    ...dadosMovimentacao
                });
            }
        } else if (indice >= 0) {
            movimentacoes.splice(indice, 1);
        }

        JCStorage.salvarMovimentacoes(movimentacoes);
    }


    function atualizarCamposEdicaoCompra() {
        const pagamento = document.getElementById("editarCompraPagamento");
        const parcelas = document.getElementById("editarCampoParcelasCompra");
        const primeira = document.getElementById("editarCampoPrimeiraParcelaCompra");
        const vencimento = document.getElementById("editarCampoVencimentoCompra");
        if (!pagamento) return;

        const cartao = pagamento.value === "cartao";
        const prazo = pagamento.value === "prazo";

        if (parcelas) parcelas.hidden = !cartao;
        if (primeira) primeira.hidden = !cartao;
        if (vencimento) vencimento.hidden = !prazo;
    }


    function atualizarTotalEdicaoCompra() {
        const quantidade = numero(document.getElementById("editarCompraQuantidade")?.value);
        const custo = numero(document.getElementById("editarCompraCusto")?.value);
        const total = quantidade * custo;
        const elemento = document.getElementById("editarCompraTotal");
        if (elemento) elemento.textContent = moeda(total);
    }


    function abrirEdicaoCompra(compraId) {
        const compra = localizarCompra(compraId);
        if (!compra) return;

        document.getElementById("editarCompraId").value = compra.id;
        document.getElementById("editarCompraProduto").value = compra.produtoNome || "";
        document.getElementById("editarCompraQuantidade").value = Number(compra.quantidade) || 1;
        document.getElementById("editarCompraCusto").value = Number(compra.custoUnitario || 0).toFixed(2);
        document.getElementById("editarCompraVenda").value = Number(compra.precoVendaUnitario || 0).toFixed(2);
        document.getElementById("editarCompraPagamento").value = compra.formaPagamento || "";
        document.getElementById("editarCompraParcelas").value = String(Math.min(12, Math.max(1, Number(compra.parcelas) || 1)));
        document.getElementById("editarCompraPrimeiraParcela").value = compra.primeiraParcela || "";
        document.getElementById("editarCompraVencimento").value = compra.vencimento || "";
        document.getElementById("editarCompraData").value = String(compra.data || "").slice(0, 10);
        document.getElementById("editarCompraPrevisaoEntrega").value = compra.previsaoEntrega || "";
        document.getElementById("editarCompraObservacoes").value = compra.observacoes || "";

        atualizarCamposEdicaoCompra();
        atualizarTotalEdicaoCompra();
        document.getElementById("modalEditarCompra").hidden = false;
    }


    function fecharEdicaoCompra() {
        const modal = document.getElementById("modalEditarCompra");
        if (modal) modal.hidden = true;
    }


    function salvarEdicaoCompra(evento) {
        evento.preventDefault();

        const compraId = document.getElementById("editarCompraId").value;
        const compras = obterCompras();
        const indice = compras.findIndex(function (item) { return String(item.id) === String(compraId); });
        if (indice < 0) { alert("Compra não encontrada."); return; }

        const antiga = compras[indice];
        const quantidade = numero(document.getElementById("editarCompraQuantidade").value);
        const custo = numero(document.getElementById("editarCompraCusto").value);
        const venda = numero(document.getElementById("editarCompraVenda").value);
        const pagamento = document.getElementById("editarCompraPagamento").value;
        const data = document.getElementById("editarCompraData").value;
        const previsaoEntrega = document.getElementById("editarCompraPrevisaoEntrega")?.value || null;
        const observacoes = document.getElementById("editarCompraObservacoes").value.trim();
        const produto = JCProdutos.buscarPorId(antiga.produtoId);

        if (!produto) { alert("O produto desta compra não foi encontrado."); return; }
        if (!Number.isInteger(quantidade) || quantidade <= 0) { alert("Informe uma quantidade inteira válida."); return; }
        if (!Number.isFinite(custo) || custo < 0 || !Number.isFinite(venda) || venda < 0) { alert("Informe valores válidos para compra e venda."); return; }
        if (!data || !dataValidaISOCompra(data)) { alert("Informe uma data de compra válida."); return; }
        if (previsaoEntrega && !dataValidaISOCompra(previsaoEntrega)) { alert("Informe uma previsão de entrega válida."); return; }
        if (!pagamento) { alert("Selecione a forma de pagamento."); return; }

        const parcelas = pagamento === "cartao" ? Math.max(1, Number(document.getElementById("editarCompraParcelas").value || 1)) : 1;
        const primeiraParcela = pagamento === "cartao" ? document.getElementById("editarCompraPrimeiraParcela").value : null;
        const vencimento = pagamento === "prazo" ? document.getElementById("editarCompraVencimento").value : null;
        if (pagamento === "cartao") {
            if (parcelas < 1 || parcelas > 12 || !Number.isInteger(parcelas)) { alert("Informe um parcelamento entre 1x e 12x."); return; }
            if (!dataValidaISOCompra(primeiraParcela)) { alert("Informe a data da 1ª parcela."); return; }
        }
        if (pagamento === "prazo" && !dataValidaISOCompra(vencimento)) { alert("Informe a data de vencimento."); return; }

        const recebidaAntiga = quantidadeRecebidaCompra(antiga);
        let novaQuantidadeRecebida;
        if (situacaoCompra(antiga) === "recebida") {
            novaQuantidadeRecebida = quantidade;
        } else {
            novaQuantidadeRecebida = Math.min(recebidaAntiga, quantidade);
        }

        const ajuste = ajustarEstoqueCompraEditada(antiga, novaQuantidadeRecebida, custo, produto);
        if (!ajuste.sucesso) { alert(ajuste.mensagem); return; }

        const novaSituacao = novaQuantidadeRecebida >= quantidade ? "recebida" : (novaQuantidadeRecebida > 0 ? "parcial" : "transito");
        const novaCompra = {
            ...antiga,
            quantidade: quantidade,
            quantidadeRecebida: novaQuantidadeRecebida,
            situacao: novaSituacao,
            previsaoEntrega: previsaoEntrega,
            recebidaEm: novaSituacao === "recebida" ? (antiga.recebidaEm || JCStorage.agora()) : null,
            custoUnitario: custo,
            precoVendaUnitario: venda,
            totalCompra: arredondarCentavos(quantidade * custo),
            lucroUnitario: arredondarCentavos(venda - custo),
            margemPercentual: venda > 0 ? arredondarCentavos(((venda - custo) / venda) * 100) : 0,
            formaPagamento: pagamento,
            statusPagamento: pagamento === "prazo" ? "pendente" : "pago",
            parcelas: parcelas,
            primeiraParcela: primeiraParcela,
            vencimento: vencimento,
            cronogramaParcelas: pagamento === "cartao" ? gerarParcelasCompra(arredondarCentavos(quantidade * custo), parcelas, primeiraParcela) : [],
            data: data,
            observacoes: observacoes,
            atualizadoEm: JCStorage.agora()
        };

        if (novaQuantidadeRecebida > 0) {
            produto.precoVenda = venda;
        }
        const produtos = JCProdutos.listar();
        const produtoIndice = produtos.findIndex(function (item) { return item.id === produto.id; });
        if (produtoIndice >= 0) {
            produtos[produtoIndice] = ajuste.produto;
            JCStorage.salvarProdutos(produtos);
        }

        compras[indice] = novaCompra;
        if (!salvarListaCompras(compras)) { alert("Não foi possível salvar as alterações da compra."); return; }

        atualizarMovimentacaoCompra(antiga, novaCompra, ajuste.produto);
        fecharEdicaoCompra();
        atualizarTela();
        alert("Compra atualizada com sucesso.");
    }

    function excluirCompra(compraId) {
        const compras = obterCompras();
        const indice = compras.findIndex(function (item) {
            return String(item.id) === String(compraId);
        });
        if (indice < 0) return;

        const compra = compras[indice];
        const produto = JCProdutos.buscarPorId(compra.produtoId);
        if (!produto) {
            alert("O produto desta compra não foi encontrado. A exclusão foi cancelada para preservar a integridade do estoque.");
            return;
        }

        if (!confirm("Excluir esta compra? O estoque e o financeiro serão ajustados para desfazer essa operação.")) {
            return;
        }

        const ajuste = ajustarEstoqueCompraEditada(compra, 0, 0, produto);
        if (!ajuste.sucesso) {
            alert(ajuste.mensagem);
            return;
        }

        const restantes = compras.filter(function (item) {
            return String(item.id) !== String(compra.id);
        });

        const produtos = JCProdutos.listar();
        const produtoIndice = produtos.findIndex(function (item) { return item.id === produto.id; });
        if (produtoIndice >= 0) {
            produtos[produtoIndice] = ajuste.produto;
            JCStorage.salvarProdutos(produtos);
        }

        // Se houver outra compra mais recente do mesmo produto, usa o último preço de venda registrado.
        const ultimaCompra = restantes
            .filter(function (item) { return String(item.produtoId) === String(produto.id); })
            .sort(function (a, b) { return new Date(b.data || 0) - new Date(a.data || 0); })[0];
        if (ultimaCompra && produtoIndice >= 0) {
            produtos[produtoIndice].precoVenda = Number(ultimaCompra.precoVendaUnitario) || 0;
            produtos[produtoIndice].atualizadoEm = JCStorage.agora();
            JCStorage.salvarProdutos(produtos);
        }

        salvarListaCompras(restantes);

        let movimentacoes = JCStorage.obterMovimentacoes();
        movimentacoes = movimentacoes.filter(function (mov) {
            return String(mov.compraId || "") !== String(compra.id);
        });
        JCStorage.salvarMovimentacoes(movimentacoes);

        atualizarTela();
        alert("Compra excluída com sucesso. Estoque e financeiro foram ajustados.");
    }


    function abrirRecebimentoCompra(compraId) {
        const compra = localizarCompra(compraId);
        if (!compra) return;

        const pendente = quantidadePendenteCompra(compra);
        if (pendente <= 0) {
            alert("Esta compra já foi totalmente recebida.");
            return;
        }

        document.getElementById("receberCompraId").value = compra.id;
        document.getElementById("receberCompraProduto").value = compra.produtoNome || "";
        document.getElementById("receberCompraQuantidadeTotal").value = String(Number(compra.quantidade) || 0);
        document.getElementById("receberCompraQuantidadeRecebida").value = String(quantidadeRecebidaCompra(compra));
        const campo = document.getElementById("receberCompraQuantidade");
        campo.value = pendente;
        campo.max = pendente;
        document.getElementById("modalReceberCompra").hidden = false;
        setTimeout(function () { campo.focus(); campo.select(); }, 50);
    }


    function fecharRecebimentoCompra() {
        const modal = document.getElementById("modalReceberCompra");
        if (modal) modal.hidden = true;
    }


    function confirmarRecebimentoCompra(evento) {
        evento.preventDefault();

        const compraId = document.getElementById("receberCompraId").value;
        const compras = obterCompras();
        const indice = compras.findIndex(function (item) { return String(item.id) === String(compraId); });
        if (indice < 0) { alert("Compra não encontrada."); return; }

        const compra = compras[indice];
        const produto = JCProdutos.buscarPorId(compra.produtoId);
        if (!produto) { alert("O produto desta compra não foi encontrado."); return; }

        const pendente = quantidadePendenteCompra(compra);
        const quantidadeEntrada = numero(document.getElementById("receberCompraQuantidade").value);
        if (!Number.isInteger(quantidadeEntrada) || quantidadeEntrada <= 0 || quantidadeEntrada > pendente) {
            alert("Informe uma quantidade válida. O máximo para esta entrada é " + pendente + ".");
            return;
        }

        const entrada = JCProdutos.registrarEntradaCompra(produto.id, quantidadeEntrada, Number(compra.custoUnitario) || 0);
        if (!entrada || entrada.sucesso === false) {
            alert(entrada?.mensagem || "Não foi possível realizar a entrada no estoque.");
            return;
        }

        const novaRecebida = quantidadeRecebidaCompra(compra) + quantidadeEntrada;
        compra.quantidadeRecebida = novaRecebida;
        compra.situacao = novaRecebida >= Number(compra.quantidade || 0) ? "recebida" : "parcial";
        compra.recebidaEm = compra.situacao === "recebida" ? JCStorage.agora() : (compra.recebidaEm || null);
        compra.atualizadoEm = JCStorage.agora();

        const produtos = JCProdutos.listar();
        const produtoAtualizado = produtos.find(function (item) { return item.id === produto.id; });
        if (produtoAtualizado) {
            produtoAtualizado.precoVenda = Number(compra.precoVendaUnitario) || 0;
            compra.categoria = produtoAtualizado.categoria || compra.categoria || "Sem categoria";
            produtoAtualizado.atualizadoEm = JCStorage.agora();
            JCStorage.salvarProdutos(produtos);
        }

        if (!salvarListaCompras(compras)) {
            alert("A entrada foi realizada no estoque, mas não foi possível salvar o status da compra. Faça um backup e confira os dados antes de repetir a operação.");
            return;
        }

        fecharRecebimentoCompra();
        atualizarTela();
        alert(compra.situacao === "recebida"
            ? "Mercadoria recebida. A entrada foi concluída no estoque."
            : "Recebimento parcial registrado. A quantidade restante continua em trânsito.");
    }


    function injetarEstilosCategoriasCompras() {
        if (document.getElementById("compras-categorias-style")) return;
        const s = document.createElement("style");
        s.id = "compras-categorias-style";
        s.textContent = `
            .compras-pastas-categorias{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 16px}
            .compra-pasta{border:1px solid #d9e2ef;background:#fff;color:#24415f;border-radius:12px;padding:10px 13px;cursor:pointer;font-weight:700;display:inline-flex;align-items:center;gap:7px;box-shadow:0 3px 10px rgba(20,50,90,.04)}
            .compra-pasta span{font-size:11px;background:#eef3f8;border-radius:999px;padding:2px 7px}
            .compra-pasta.ativo{background:#1761b5;color:#fff;border-color:#1761b5}
            .compra-pasta.ativo span{background:rgba(255,255,255,.18);color:#fff}
            .compra-categoria-badge{display:inline-flex;padding:4px 8px;border-radius:999px;background:#eef5ff;color:#1557a6;font-size:11px;font-weight:700;white-space:nowrap}
            @media(max-width:700px){.compras-pastas-categorias{display:grid;grid-template-columns:1fr 1fr}.compra-pasta{justify-content:space-between}.compra-categoria-badge{white-space:normal}}
        `;
        document.head.appendChild(s);
    }

    function atualizarTela() {

        atualizarResumo();

        renderizarHistorico();

        atualizarSelectProdutos();

        atualizarPreview();

        atualizarAvisoPrazo();
        atualizarCamposPagamentoCompra();

        if (
            typeof JCProdutos.atualizarTela ===
            "function"
        ) {

            JCProdutos.atualizarTela();

        }

        if (
            window.JCApp &&
            typeof JCApp.atualizarDashboard ===
            "function"
        ) {

            JCApp.atualizarDashboard();

        }

    }


    function configurarEventos() {

        const formulario =
            document.getElementById(
                "formCompra"
            );

        const produto =
            document.getElementById(
                "compraProduto"
            );

        const custo =
            document.getElementById(
                "compraCusto"
            );

        const venda =
            document.getElementById(
                "compraVenda"
            );

        const pagamento =
            document.getElementById(
                "compraPagamento"
            );

        const limpar =
            document.getElementById(
                "limparCompra"
            );


        if (formulario) {

            formulario.addEventListener(
                "submit",
                registrarCompra
            );

        }


        if (produto) {

            produto.addEventListener(
                "change",
                atualizarCamposProduto
            );

        }


        if (custo) {

            custo.addEventListener(
                "input",
                atualizarPreview
            );

        }


        if (venda) {

            venda.addEventListener(
                "input",
                atualizarPreview
            );

        }


        if (pagamento) {

            pagamento.addEventListener(
                "change",
                function () {
                    atualizarAvisoPrazo();
                    atualizarCamposPagamentoCompra();
                }
            );

        }



        const tabela = document.getElementById("listaCompras");
        if (tabela) {
            tabela.addEventListener("click", function (evento) {
                const botaoEditar = evento.target.closest(".btn-editar-compra");
                const botaoExcluir = evento.target.closest(".btn-excluir-compra");
                const botaoReceber = evento.target.closest(".btn-receber-compra");
                if (botaoEditar) abrirEdicaoCompra(botaoEditar.dataset.id);
                if (botaoExcluir) excluirCompra(botaoExcluir.dataset.id);
                if (botaoReceber) abrirRecebimentoCompra(botaoReceber.dataset.id);
            });
        }

        const formularioEdicao = document.getElementById("formEditarCompra");
        if (formularioEdicao) formularioEdicao.addEventListener("submit", salvarEdicaoCompra);

        const pagamentoEdicao = document.getElementById("editarCompraPagamento");
        if (pagamentoEdicao) pagamentoEdicao.addEventListener("change", atualizarCamposEdicaoCompra);

        ["editarCompraQuantidade", "editarCompraCusto"].forEach(function (id) {
            const campo = document.getElementById(id);
            if (campo) campo.addEventListener("input", atualizarTotalEdicaoCompra);
        });

        const fecharEdicao = document.getElementById("fecharModalEditarCompra");
        const cancelarEdicao = document.getElementById("cancelarEdicaoCompra");
        if (fecharEdicao) fecharEdicao.addEventListener("click", fecharEdicaoCompra);
        if (cancelarEdicao) cancelarEdicao.addEventListener("click", fecharEdicaoCompra);

        const formularioRecebimento = document.getElementById("formReceberCompra");
        if (formularioRecebimento) formularioRecebimento.addEventListener("submit", confirmarRecebimentoCompra);

        const fecharRecebimento = document.getElementById("fecharModalReceberCompra");
        const cancelarRecebimento = document.getElementById("cancelarRecebimentoCompra");
        if (fecharRecebimento) fecharRecebimento.addEventListener("click", fecharRecebimentoCompra);
        if (cancelarRecebimento) cancelarRecebimento.addEventListener("click", fecharRecebimentoCompra);

        if (limpar) {

            limpar.addEventListener(
                "click",
                function () {

                    setTimeout(
                        function () {

                            document.getElementById(
                                "compraData"
                            ).value =
                                dataHoje();

                            document.getElementById(
                                "compraQuantidade"
                            ).value =
                                1;

                            const situacao = document.getElementById("compraSituacao");
                            if (situacao) situacao.value = "transito";

                            atualizarPreview();

                            atualizarAvisoPrazo();
                            atualizarCamposPagamentoCompra();

                        },
                        0
                    );

                }
            );

        }

    }


    function inicializar() {

        injetarEstilosCategoriasCompras();

        const data =
            document.getElementById(
                "compraData"
            );

        if (data) {

            data.value =
                dataHoje();

        }

        configurarEventos();

        atualizarCamposPagamentoCompra();
        atualizarTela();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            inicializar
        );

    } else {

        inicializar();

    }


    window.JCCompras = {

        listar:
            obterCompras,

        atualizar:
            atualizarTela,

        registrar:
            registrarCompra

    };


})();
