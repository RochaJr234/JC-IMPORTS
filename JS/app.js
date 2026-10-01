/* =========================================================
   J.C IMPORTS
   APP.JS
   Controle principal da aplicação
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       VERIFICAÇÃO DA BASE
       ===================================================== */

    if (!window.JCStorage) {

        console.error(
            "JCStorage não foi carregado."
        );

        return;
    }


    /* =====================================================
       ELEMENTOS PRINCIPAIS
       ===================================================== */

    const sidebar =
        document.getElementById("sidebar");

    const sidebarOverlay =
        document.getElementById("sidebarOverlay");

    const sidebarClose =
        document.getElementById("sidebarClose");

    const menuToggle =
        document.getElementById("menuToggle");

    const pageTitle =
        document.getElementById("pageTitle");

    const appContent =
        document.getElementById("appContent");

    const toastContainer =
        document.getElementById("toastContainer");


    /* =====================================================
       NOMES DAS PÁGINAS
       ===================================================== */

    const PAGE_NAMES = {

        dashboard: "Início",

        vendas: "Vendas",

        pedidos: "Pedidos",

        produtos: "Produtos",

        compras: "Compras",

        clientes: "Clientes",

        financeiro: "Financeiro",

        receber: "A receber",

        "vendas-pessoais": "Vendas Pessoais",

        despesas: "Despesas",

        relatorios: "Relatórios",

        backup: "Backup",

        configuracoes: "Configurações"

    };


    /* =====================================================
       FORMATAR MOEDA
       ===================================================== */

    function formatarMoeda(valor) {

        const numero =
            Number(valor);


        if (!Number.isFinite(numero)) {

            return "R$ 0,00";

        }


        return numero.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

    }


    /* =====================================================
       ABRIR MENU
       ===================================================== */

    function abrirMenu() {

        if (!sidebar) {
            return;
        }


        sidebar.classList.add("open");


        if (sidebarOverlay) {

            sidebarOverlay.hidden = false;

        }

    }


    /* =====================================================
       FECHAR MENU
       ===================================================== */

    function fecharMenu() {

        if (!sidebar) {
            return;
        }


        sidebar.classList.remove("open");


        if (sidebarOverlay) {

            sidebarOverlay.hidden = true;

        }

    }


    /* =====================================================
       TROCAR PÁGINA
       ===================================================== */

    function navegarPara(pagina) {

        if (!pagina) {
            return;
        }


        const paginaDestino =
            document.querySelector(
                `[data-page-content="${pagina}"]`
            );


        if (!paginaDestino) {

            console.warn(
                "Página não encontrada:",
                pagina
            );

            return;
        }


        /* Esconde todas as páginas */

        const paginas =
            document.querySelectorAll(
                ".page"
            );


        paginas.forEach(
            function (item) {

                item.classList.remove(
                    "active"
                );

                item.hidden = true;

            }
        );


        /* Mostra a página escolhida */

        paginaDestino.classList.add(
            "active"
        );

        paginaDestino.hidden = false;


        /* Recolhe o painel independente da nuvem quando sair de Configurações. */
        if (pagina !== "configuracoes") {
            const cloudHost = document.getElementById("nuvemContent");
            const configPage = document.getElementById("page-configuracoes");
            if (cloudHost && configPage && cloudHost.parentElement === document.body) {
                const anchor = document.getElementById("configuracoesContent");
                if (anchor) anchor.insertAdjacentElement("afterend", cloudHost);
                cloudHost.style.cssText = "";
            }
        }


        /* Atualiza título */

        if (pageTitle) {

            pageTitle.textContent =
                PAGE_NAMES[pagina]
                || "J.C Imports";

        }


        /* Atualiza menu */

        const itensMenu =
            document.querySelectorAll(
                ".nav-item"
            );


        itensMenu.forEach(
            function (item) {

                const paginaItem =
                    item.dataset.page;


                item.classList.toggle(
                    "active",
                    paginaItem === pagina
                );

            }
        );


        /* Fecha menu no celular */

        if (
            window.innerWidth <= 900
        ) {

            fecharMenu();

        }


        /* Volta o conteúdo para o topo */

        if (appContent) {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }


        /* ====================================================
        Eventos específicos 
        =======================================================*/


        if (
            pagina === "vendas" &&
            window.JCVendas &&
            typeof window.JCVendas.atualizarInterface === "function"
        ) {

            window.JCVendas.atualizarInterface();

        }

        if (
            pagina === "pedidos" &&
            window.JCPedidos &&
            typeof window.JCPedidos.render === "function"
        ) {
            window.JCPedidos.render();
        }


        if (
            pagina === "produtos" &&
            window.JCProdutos &&
            typeof window.JCProdutos.atualizarTela === "function"
        ) {

            window.JCProdutos.atualizarTela();

        }

        if (
            pagina === "compras" &&
            window.JCCompras &&
            typeof window.JCCompras.atualizar === "function"
        ) {

            window.JCCompras.atualizar();

        }

        if (
            pagina === "relatorios" &&
            window.JCRelatorios &&
            typeof window.JCRelatorios.atualizarInterface === "function"
        ) {

            window.JCRelatorios.atualizarInterface();

        }

        if (
            pagina === "despesas" &&
            window.JCDespesas &&
            typeof window.JCDespesas.atualizarInterface === "function"
        ) {

            window.JCDespesas.atualizarInterface();

        }


        /* =====================================================
           VENDAS PESSOAIS
           ===================================================== */
        if (
            pagina === "vendas-pessoais" &&
            window.JCVendasPessoais &&
            typeof window.JCVendasPessoais.render === "function"
        ) {
            window.JCVendasPessoais.render();
        }


        /* =====================================================
           A RECEBER
           ===================================================== */

        if (
            pagina === "receber" &&
            window.JCReceber &&
            typeof window.JCReceber.atualizarInterface === "function"
        ) {

            window.JCReceber.atualizarInterface();

        }


        /* Nuvem / sincronização multidispositivo */

        if (
            pagina === "configuracoes"
        ) {

            if (window.JCCloud && typeof window.JCCloud.render === "function") {
                window.JCCloud.render();
            } else {
                console.warn("JCCloud ainda não foi carregado; tentando inicializar novamente.");
                const tentarNuvem = function () {
                    if (window.JCCloud && typeof window.JCCloud.render === "function") {
                        window.JCCloud.render();
                        return;
                    }
                    setTimeout(tentarNuvem, 150);
                };
                tentarNuvem();
            }

        }


    }


    /* =====================================================
       NOTIFICAÇÃO
       ===================================================== */

    function mostrarToast(
        mensagem,
        tipo = "info"
    ) {

        if (!toastContainer) {
            return;
        }


        const toast =
            document.createElement(
                "div"
            );


        toast.className =
            "toast";


        if (tipo === "sucesso") {

            toast.style.borderLeftColor =
                "var(--verde)";

        }


        else if (tipo === "erro") {

            toast.style.borderLeftColor =
                "var(--vermelho)";

        }


        else if (tipo === "alerta") {

            toast.style.borderLeftColor =
                "var(--laranja)";

        }


        toast.textContent =
            mensagem;


        toastContainer.appendChild(
            toast
        );


        setTimeout(
            function () {

                toast.remove();

            },
            3500
        );

    }


    /* =====================================================
       CALCULAR VENDAS DO DIA
       ===================================================== */

    function calcularVendasHoje(
        vendas
    ) {

        const hoje =
            new Date();


        const ano =
            hoje.getFullYear();

        const mes =
            hoje.getMonth();

        const dia =
            hoje.getDate();


        return vendas.reduce(
            function (
                total,
                venda
            ) {

                if (
                    !venda ||
                    !venda.data
                ) {

                    return total;

                }


                const data =
                    new Date(
                        venda.data
                    );


                if (
                    data.getFullYear()
                    === ano &&
                    data.getMonth()
                    === mes &&
                    data.getDate()
                    === dia
                ) {

                    return total +
                        Number(
                            venda.total
                        ) || total;

                }


                return total;

            },
            0
        );

    }


    /* =====================================================
       CALCULAR VENDAS DO MÊS
       ===================================================== */

    function calcularVendasMes(
        vendas
    ) {

        const hoje =
            new Date();


        const ano =
            hoje.getFullYear();

        const mes =
            hoje.getMonth();


        return vendas.reduce(
            function (
                total,
                venda
            ) {

                if (
                    !venda ||
                    !venda.data
                ) {

                    return total;

                }


                const data =
                    new Date(
                        venda.data
                    );


                if (
                    data.getFullYear()
                    === ano &&
                    data.getMonth()
                    === mes
                ) {

                    return total +
                        Number(
                            venda.total
                        ) || total;

                }


                return total;

            },
            0
        );

    }


    /* =====================================================
       CONTAS A RECEBER
       ===================================================== */

    function calcularAReceber(
        contas
    ) {

        return contas.reduce(
            function (total, conta) {

                if (
                    !conta ||
                    conta.status === "pago" ||
                    conta.status === "cancelado" ||
                    conta.status === "cancelada"
                ) {
                    return total;
                }

                const saldo = Number(conta.saldo);
                const valor = Number(conta.valor) || 0;
                const pago = Number(conta.valorPago) || 0;

                const pendente = Number.isFinite(saldo)
                    ? saldo
                    : Math.max(0, valor - pago);

                return total + Math.max(0, pendente);
            },
            0
        );

    }


    /* =====================================================
       VALOR DO ESTOQUE
       ===================================================== */

    function calcularValorEstoque(
        produtos
    ) {

        return produtos.reduce(
            function (
                total,
                produto
            ) {

                const quantidade =
                    Number(
                        produto.estoque
                    ) || 0;


                const custo =
                    Number(
                        produto.precoCusto
                    ) || 0;


                return total +
                    quantidade * custo;

            },
            0
        );

    }


    /* =====================================================
       ENTRADAS FINANCEIRAS
       ===================================================== */

    function calcularEntradas(
        movimentacoes
    ) {

        return movimentacoes.reduce(
            function (
                total,
                item
            ) {

                if (
                    item.tipo !== "entrada"
                ) {

                    return total;

                }


                return total +
                    (
                        Number(
                            item.valor
                        ) || 0
                    );

            },
            0
        );

    }


    /* =====================================================
       SAÍDAS FINANCEIRAS
       ===================================================== */

    function calcularSaidas(
        movimentacoes
    ) {

        return movimentacoes.reduce(
            function (
                total,
                item
            ) {

                if (
                    item.tipo !== "saida"
                ) {

                    return total;

                }


                return total +
                    (
                        Number(
                            item.valor
                        ) || 0
                    );

            },
            0
        );

    }


    /* =====================================================
       RESULTADO / LUCRO DO MÊS
       ===================================================== */

    function calcularResultadoMes(vendas, movimentacoes) {

        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = hoje.getMonth();

        const vendasMes = vendas.filter(function (venda) {
            if (!venda || venda.status === "cancelada" || venda.status === "cancelado") {
                return false;
            }

            const data = new Date(venda.data);
            return data.getFullYear() === ano && data.getMonth() === mes;
        });

        const faturamento = vendasMes.reduce(function (total, venda) {
            return total + (Number(venda.total) || 0);
        }, 0);

        /*
         * O custo considerado no lucro é somente o custo das mercadorias
         * efetivamente vendidas (CMV). Compra de estoque não é lucro/prejuízo
         * no momento da compra; ela reduz o caixa e aumenta o estoque.
         */
        const custoVendas = vendasMes.reduce(function (total, venda) {
            return total + (Number(venda.custoTotal) || 0);
        }, 0);

        const lucroBruto = faturamento - custoVendas;

        /* Despesas operacionais não incluem compras de mercadoria. */
        const despesas = movimentacoes.reduce(function (total, item) {
            if (item.tipo !== "saida" || item.categoria !== "despesa") {
                return total;
            }

            const data = new Date(item.data);
            if (data.getFullYear() !== ano || data.getMonth() !== mes) {
                return total;
            }

            return total + (Number(item.valor) || 0);
        }, 0);

        return {
            faturamento: faturamento,
            custoVendas: custoVendas,
            lucroBruto: lucroBruto,
            despesas: despesas,
            lucroLiquido: lucroBruto - despesas
        };
    }


    /* =====================================================
       ATUALIZAR DASHBOARD
       ===================================================== */

    function configurarUltimasVendasRecolhiveis() {

        const painel = document.getElementById("dashboardRecentSalesPanel");
        const botao = document.getElementById("recentSalesToggle");

        if (!painel || !botao || botao.dataset.configurado === "true") {
            return;
        }

        botao.dataset.configurado = "true";

        botao.addEventListener("click", function () {

            const recolhido = painel.classList.toggle("is-collapsed");
            const expandido = !recolhido;

            botao.setAttribute("aria-expanded", String(expandido));
            botao.title = recolhido
                ? "Expandir últimas vendas"
                : "Recolher últimas vendas";

            const texto = botao.querySelector(".sr-only");
            if (texto) {
                texto.textContent = recolhido
                    ? "Expandir últimas vendas"
                    : "Recolher últimas vendas";
            }

        });

    }


    function atualizarDashboard() {

        configurarUltimasVendasRecolhiveis();

        const vendas =
            JCStorage.obterVendas();


        const produtos =
            JCStorage.obterProdutos();


        const clientes =
            JCStorage.obterClientes();


        const contas =
            JCStorage.obterContasReceber();


        const movimentacoes =
            JCStorage.obterMovimentacoes();


        const vendasHoje =
            calcularVendasHoje(
                vendas
            );


        const vendasMes =
            calcularVendasMes(
                vendas
            );


        const aReceber =
            calcularAReceber(
                contas
            );


        const estoque =
            calcularValorEstoque(
                produtos
            );


        const entradas =
            calcularEntradas(
                movimentacoes
            );


        const saidas =
            calcularSaidas(
                movimentacoes
            );


        const saldo =
            entradas - saidas;

        const resultadoMes =
            calcularResultadoMes(
                vendas,
                movimentacoes
            );


        /* Indicadores de cadastro */

        const elementoProdutos =
            document.getElementById(
                "dashboardProductsCount"
            );

        if (elementoProdutos) {
            elementoProdutos.textContent = produtos.length;
        }

        const elementoClientes =
            document.getElementById(
                "dashboardClientsCount"
            );

        if (elementoClientes) {
            elementoClientes.textContent = clientes.length;
        }


        /* Vendas hoje */

        const elementoHoje =
            document.getElementById(
                "dashboardSalesToday"
            );


        if (elementoHoje) {

            elementoHoje.textContent =
                formatarMoeda(
                    vendasHoje
                );

        }


        /* Vendas mês */

        const elementoMes =
            document.getElementById(
                "dashboardSalesMonth"
            );


        if (elementoMes) {

            elementoMes.textContent =
                formatarMoeda(
                    vendasMes
                );

        }


        /* A receber */

        const elementoReceber =
            document.getElementById(
                "dashboardReceivable"
            );


        if (elementoReceber) {

            elementoReceber.textContent =
                formatarMoeda(
                    aReceber
                );

        }


        /* Estoque */

        const elementoEstoque =
            document.getElementById(
                "dashboardStock"
            );


        if (elementoEstoque) {

            elementoEstoque.textContent =
                formatarMoeda(
                    estoque
                );

        }


        /* Entradas */

        const elementoEntradas =
            document.getElementById(
                "dashboardIncome"
            );


        if (elementoEntradas) {

            elementoEntradas.textContent =
                formatarMoeda(
                    entradas
                );

        }


        /* Saídas */

        const elementoSaidas =
            document.getElementById(
                "dashboardExpense"
            );


        if (elementoSaidas) {

            elementoSaidas.textContent =
                formatarMoeda(
                    saidas
                );

        }


        /* Saldo */

        const elementoSaldo =
            document.getElementById(
                "dashboardBalance"
            );


        if (elementoSaldo) {

            elementoSaldo.textContent =
                formatarMoeda(
                    saldo
                );

        }

        const elementosResultado = {
            faturamento: document.getElementById("dashboardProfitRevenue"),
            custo: document.getElementById("dashboardProfitCost"),
            bruto: document.getElementById("dashboardGrossProfit"),
            despesas: document.getElementById("dashboardProfitExpenses"),
            liquido: document.getElementById("dashboardNetProfit")
        };

        if (elementosResultado.faturamento) {
            elementosResultado.faturamento.textContent = formatarMoeda(resultadoMes.faturamento);
        }
        if (elementosResultado.custo) {
            elementosResultado.custo.textContent = formatarMoeda(resultadoMes.custoVendas);
        }
        if (elementosResultado.bruto) {
            elementosResultado.bruto.textContent = formatarMoeda(resultadoMes.lucroBruto);
        }
        if (elementosResultado.despesas) {
            elementosResultado.despesas.textContent = formatarMoeda(resultadoMes.despesas);
        }
        if (elementosResultado.liquido) {
            elementosResultado.liquido.textContent = formatarMoeda(resultadoMes.lucroLiquido);
        }


        atualizarUltimasVendas(
            vendas
        );

    }


    /* =====================================================
       ÚLTIMAS VENDAS
       ===================================================== */

    function atualizarUltimasVendas(
        vendas
    ) {

        const lista =
            document.getElementById(
                "recentSalesList"
            );


        const vazio =
            document.getElementById(
                "recentSalesEmpty"
            );


        if (!lista || !vazio) {
            return;
        }


        lista.innerHTML = "";


        if (
            !Array.isArray(vendas)
            ||
            vendas.length === 0
        ) {

            lista.hidden = true;

            vazio.hidden = false;

            return;

        }


        const vendasOrdenadas =
            [...vendas]
                .sort(
                    function (
                        a,
                        b
                    ) {

                        return new Date(
                            b.data || 0
                        ) -
                        new Date(
                            a.data || 0
                        );

                    }
                )
                .slice(
                    0,
                    5
                );


        vendasOrdenadas.forEach(
            function (venda) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "recent-sale";


                const info =
                    document.createElement(
                        "div"
                    );


                info.className =
                    "recent-sale-info";


                const nome =
                    document.createElement(
                        "strong"
                    );


                nome.textContent =
                    venda.clienteNome
                    || "Venda sem cliente";


                const data =
                    document.createElement(
                        "span"
                    );


                data.textContent =
                    formatarData(
                        venda.data
                    );


                info.appendChild(
                    nome
                );

                info.appendChild(
                    data
                );


                const valor =
                    document.createElement(
                        "strong"
                    );


                valor.className =
                    "recent-sale-value";


                valor.textContent =
                    formatarMoeda(
                        venda.total
                    );


                item.appendChild(
                    info
                );

                item.appendChild(
                    valor
                );


                lista.appendChild(
                    item
                );

            }
        );


        vazio.hidden = true;

        lista.hidden = false;

    }


    /* =====================================================
       FORMATAR DATA
       ===================================================== */

    function formatarData(
        data
    ) {

        if (!data) {

            return "--";

        }


        const objeto =
            new Date(data);


        if (
            Number.isNaN(
                objeto.getTime()
            )
        ) {

            return "--";

        }


        return objeto.toLocaleDateString(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    }

    

    /* =====================================================
       BOTÃO NOVA VENDA
       ===================================================== */

    function abrirNovaVenda() {

        /*
         * O módulo de vendas já é inicializado pelo
         * próprio JS de vendas. Este botão deve apenas
         * levar o usuário para a tela, sem exibir a
         * antiga mensagem de módulo não implementado.
         */
        navegarPara(
            "vendas"
        );

        if (
            window.JCVendas &&
            typeof window.JCVendas.atualizarInterface ===
            "function"
        ) {
            window.JCVendas.atualizarInterface();
        }

    }


    /* =====================================================
       EVENTOS DO MENU
       ===================================================== */

    function configurarMenu() {

        if (menuToggle) {

            menuToggle.addEventListener(
                "click",
                abrirMenu
            );

        }


        if (sidebarClose) {

            sidebarClose.addEventListener(
                "click",
                fecharMenu
            );

        }


        if (sidebarOverlay) {

            sidebarOverlay.addEventListener(
                "click",
                fecharMenu
            );

        }


        const itens =
            document.querySelectorAll(
                "[data-page]"
            );


        itens.forEach(
            function (item) {

                item.addEventListener(
                    "click",
                    function () {

                        const pagina =
                            item.dataset.page;


                        if (
                            pagina ===
                            "vendas" &&
                            item.id ===
                            "quickSaleButton"
                        ) {

                            abrirNovaVenda();

                            return;

                        }


                        navegarPara(
                            pagina
                        );

                    }
                );

            }
        );

    }


    /* =====================================================
       BOTÕES DE NOVA VENDA
       ===================================================== */

    function configurarBotoesVenda() {

        const novo =
            document.getElementById(
                "newSaleButton"
            );


        if (novo) {

            novo.addEventListener(
                "click",
                abrirNovaVenda
            );

        }



    }


    /* =====================================================
       TECLA ESC
       ===================================================== */

    function configurarTeclado() {

        document.addEventListener(
            "keydown",
            function (evento) {

                if (
                    evento.key ===
                    "Escape"
                ) {

                    fecharMenu();

                }

            }
        );

    }


    /* =====================================================
       REDIMENSIONAMENTO
       ===================================================== */

    function configurarResize() {

        window.addEventListener(
            "resize",
            function () {

                if (
                    window.innerWidth > 900
                ) {

                    fecharMenu();

                }

            }
        );

    }


    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    function iniciarAplicacao() {

        configurarMenu();

        configurarBotoesVenda();

        configurarTeclado();

        configurarResize();

        atualizarDashboard();


        console.log(
            "J.C Imports iniciado com sucesso."
        );

    }


    /* =====================================================
       API GLOBAL
       ===================================================== */

    window.JCApp = {

        navegarPara,

        atualizarDashboard,

        mostrarToast,

        formatarMoeda,

        formatarData

    };


    /* =====================================================
       INICIAR
       ===================================================== */

    iniciarAplicacao();


})();