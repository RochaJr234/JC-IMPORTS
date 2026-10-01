/* =========================================================
   J.C IMPORTS
   STORAGE.JS
   Banco de dados local do sistema
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIGURAÇÕES PRINCIPAIS
       ===================================================== */

    const STORAGE_KEYS = {

        sistema: "jc_imports_sistema",

        produtos: "jc_imports_produtos",

        clientes: "jc_imports_clientes",

        vendas: "jc_imports_vendas",

        financeiro: "jc_imports_financeiro",

        receber: "jc_imports_contas_receber",

        configuracoes: "jc_imports_configuracoes",

        compras: "jc_imports_compras",

        vendasPessoais: "jc_imports_vendas_pessoais",

        cartoesPessoais: "jc_imports_cartoes_pessoais",

        pedidos: "jc_imports_pedidos"

    };


    const STORAGE_VERSION = 3;


    /* =====================================================
       CONFIGURAÇÕES PADRÃO
       ===================================================== */

    const CONFIGURACOES_PADRAO = {

        empresa: "J.C Imports",

        telefone: "",

        email: "",

        endereco: "",

        documento: "",

        logo: "images/logo-completa.png",

        moeda: "BRL",

        formatoMoeda: "pt-BR",

        estoqueMinimoPadrao: 1,

        ultimaAtualizacao: null

    };


    /* =====================================================
       ESTRUTURA DO SISTEMA
       ===================================================== */

    const SISTEMA_PADRAO = {

        nome: "J.C Imports",

        versao: STORAGE_VERSION,

        criadoEm: null,

        atualizadoEm: null

    };


    /* =====================================================
       FUNÇÕES AUXILIARES
       ===================================================== */

    function agora() {

        return new Date().toISOString();

    }


    function gerarId(prefixo) {

        const tempo = Date.now();

        const aleatorio =
            Math.random()
                .toString(36)
                .substring(2, 8);

        return `${prefixo}-${tempo}-${aleatorio}`;

    }


    function salvar(chave, dados) {

        try {

            localStorage.setItem(
                chave,
                JSON.stringify(dados)
            );

            try {
                if (!window.__jcCloudRestoring) {
                    localStorage.setItem(
                        "jc_imports_nuvem_updated_at",
                        agora()
                    );
                    window.dispatchEvent(
                        new CustomEvent("jcstoragechange", { detail: { chave } })
                    );
                }
            } catch (_) {}

            return true;

        } catch (erro) {

            console.error(
                "Erro ao salvar dados:",
                erro
            );

            return false;
        }
    }


    function ler(chave, padrao) {

        try {

            const dados =
                localStorage.getItem(chave);

            if (!dados) {

                return padrao;

            }

            return JSON.parse(dados);

        } catch (erro) {

            console.error(
                "Erro ao ler dados:",
                erro
            );

            return padrao;
        }
    }


    function remover(chave) {

        try {

            localStorage.removeItem(chave);

            return true;

        } catch (erro) {

            console.error(
                "Erro ao remover dados:",
                erro
            );

            return false;
        }
    }


    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    function inicializar() {

        let sistema =
            ler(
                STORAGE_KEYS.sistema,
                null
            );


        if (!sistema) {

            sistema = {
                ...SISTEMA_PADRAO,

                criadoEm: agora(),

                atualizadoEm: agora()
            };

            salvar(
                STORAGE_KEYS.sistema,
                sistema
            );

        } else if (
            Number(sistema.versao) < STORAGE_VERSION
        ) {

            sistema.versao = STORAGE_VERSION;
            sistema.atualizadoEm = agora();

            salvar(
                STORAGE_KEYS.sistema,
                sistema
            );

        }


        /* Produtos */

        if (
            localStorage.getItem(
                STORAGE_KEYS.produtos
            ) === null
        ) {

            salvar(
                STORAGE_KEYS.produtos,
                []
            );

        }


        /* Clientes */

        if (
            localStorage.getItem(
                STORAGE_KEYS.clientes
            ) === null
        ) {

            salvar(
                STORAGE_KEYS.clientes,
                []
            );

        }


        /* Vendas */

        if (
            localStorage.getItem(
                STORAGE_KEYS.vendas
            ) === null
        ) {

            salvar(
                STORAGE_KEYS.vendas,
                []
            );

        }


        /* Financeiro */

        if (
            localStorage.getItem(
                STORAGE_KEYS.financeiro
            ) === null
        ) {

            salvar(
                STORAGE_KEYS.financeiro,
                []
            );

        }


        /* Contas a receber */

        if (
            localStorage.getItem(
                STORAGE_KEYS.receber
            ) === null
        ) {

            salvar(
                STORAGE_KEYS.receber,
                []
            );

        }


        /* Configurações */

        if (
            localStorage.getItem(
                STORAGE_KEYS.configuracoes
            ) === null
        ) {

            salvar(
                STORAGE_KEYS.configuracoes,
                CONFIGURACOES_PADRAO
            );

        }


        /* Compras */

        if (
            localStorage.getItem(
                STORAGE_KEYS.compras
            ) === null
        ) {

            salvar(
                STORAGE_KEYS.compras,
                []
            );

        }


        /* Vendas Pessoais */
        if (localStorage.getItem(STORAGE_KEYS.vendasPessoais) === null) {
            salvar(STORAGE_KEYS.vendasPessoais, []);
        }

        /* Cartões Pessoais */
        if (localStorage.getItem(STORAGE_KEYS.cartoesPessoais) === null) {
            salvar(STORAGE_KEYS.cartoesPessoais, []);
        }
        if (localStorage.getItem(STORAGE_KEYS.pedidos) === null) {
            salvar(STORAGE_KEYS.pedidos, []);
        }

    }


    /* =====================================================
       PRODUTOS
       ===================================================== */

    function obterProdutos() {

        const dados = ler(STORAGE_KEYS.produtos, []);

        return Array.isArray(dados) ? dados : [];

    }


    function salvarProdutos(produtos) {

        return salvar(
            STORAGE_KEYS.produtos,
            produtos
        );

    }


    function adicionarProduto(produto) {

        const produtos =
            obterProdutos();


        const novoProduto = {

            id: produto.id ||
                gerarId("PROD"),

            codigo: produto.codigo || "",

            nome: produto.nome || "",

            categoria: produto.categoria || "",

            descricao: produto.descricao || "",

            quantidade: Number(
                produto.quantidade
            ) || 0,

            estoqueMinimo: Number(
                produto.estoqueMinimo
            ) || 1,

            custo: Number(
                produto.custo
            ) || 0,

            precoVenda: Number(
                produto.precoVenda
            ) || 0,

            criadoEm:
                produto.criadoEm ||
                agora(),

            atualizadoEm:
                agora()

        };


        produtos.push(
            novoProduto
        );


        salvarProdutos(produtos);


        return novoProduto;

    }


    /* =====================================================
       CLIENTES
       ===================================================== */

    function obterClientes() {

        const dados = ler(STORAGE_KEYS.clientes, []);

        return Array.isArray(dados) ? dados : [];

    }


    function salvarClientes(clientes) {

        return salvar(
            STORAGE_KEYS.clientes,
            clientes
        );

    }


    function adicionarCliente(cliente) {

        const clientes =
            obterClientes();


        const novoCliente = {

            id: cliente.id ||
                gerarId("CLI"),

            nome: cliente.nome || "",

            telefone:
                cliente.telefone || "",

            documento:
                cliente.documento || "",

            email:
                cliente.email || "",

            endereco:
                cliente.endereco || "",

            observacoes:
                cliente.observacoes || "",

            criadoEm:
                cliente.criadoEm ||
                agora(),

            atualizadoEm:
                agora()

        };


        clientes.push(
            novoCliente
        );


        salvarClientes(clientes);


        return novoCliente;

    }


    /* =====================================================
       VENDAS
       ===================================================== */

    function obterVendas() {

        const dados = ler(STORAGE_KEYS.vendas, []);

        return Array.isArray(dados) ? dados : [];

    }


    function salvarVendas(vendas) {

        return salvar(
            STORAGE_KEYS.vendas,
            vendas
        );

    }


    function adicionarVenda(venda) {

        const vendas =
            obterVendas();


        const novaVenda = {

            id: venda.id ||
                gerarId("VENDA"),

            numero:
                venda.numero || "",

            clienteId:
                venda.clienteId || null,

            clienteNome:
                venda.clienteNome || "",

            itens:
                Array.isArray(venda.itens)
                    ? venda.itens
                    : [],

            subtotal:
                Number(venda.subtotal)
                || 0,

            desconto:
                Number(venda.desconto)
                || 0,

            total:
                Number(venda.total)
                || 0,

            formaPagamento:
                venda.formaPagamento
                || "",

            status:
                venda.status
                || (venda.formaPagamento === "prazo" ? "pendente" : "pago"),

            statusPagamento:
                venda.statusPagamento
                || (venda.formaPagamento === "prazo" ? "pendente" : "pago"),

            custoTotal:
                Number(venda.custoTotal) || 0,

            lucroEstimado:
                Number(venda.lucroEstimado) || 0,

            parcelas:
                Math.max(1, Number(venda.parcelas) || 1),

            primeiraParcela:
                venda.primeiraParcela || null,

            cronogramaParcelas:
                Array.isArray(venda.cronogramaParcelas)
                    ? venda.cronogramaParcelas
                    : [],

            data:
                venda.data ||
                agora(),

            vencimento:
                venda.vencimento ||
                null,

            observacoes:
                venda.observacoes
                || "",

            garantia:
                venda.garantia || "",

            numeroNF:
                venda.numeroNF || "",

            criadoEm:
                venda.criadoEm ||
                agora()

        };


        vendas.push(
            novaVenda
        );


        salvarVendas(vendas);


        return novaVenda;

    }


    /* =====================================================
       FINANCEIRO
       ===================================================== */

    function obterMovimentacoes() {

        const dados = ler(STORAGE_KEYS.financeiro, []);

        return Array.isArray(dados) ? dados : [];

    }


    function salvarMovimentacoes(
        movimentacoes
    ) {

        return salvar(
            STORAGE_KEYS.financeiro,
            movimentacoes
        );

    }


    function adicionarMovimentacao(
        movimentacao
    ) {

        const movimentacoes =
            obterMovimentacoes();


        const novaMovimentacao = {

            id:
                movimentacao.id ||
                gerarId("FIN"),

            tipo:
                movimentacao.tipo || "",

            categoria:
                movimentacao.categoria
                || "",

            descricao:
                movimentacao.descricao
                || "",

            valor:
                Number(
                    movimentacao.valor
                ) || 0,

            data:
                movimentacao.data ||
                agora(),

            origem:
                movimentacao.origem
                || "",

            referenciaId:
                movimentacao.referenciaId
                || null,

            observacoes:
                movimentacao.observacoes
                || "",

            formaPagamento:
                movimentacao.formaPagamento
                || "",

            produtoId:
                movimentacao.produtoId
                || null,

            compraId:
                movimentacao.compraId
                || null,

            vendaId:
                movimentacao.vendaId
                || null,

            quantidade:
                Number(movimentacao.quantidade)
                || 0,

            custoUnitario:
                Number(movimentacao.custoUnitario)
                || 0,

            criadoEm:
                movimentacao.criadoEm
                || agora()

        };


        movimentacoes.push(
            novaMovimentacao
        );


        salvarMovimentacoes(
            movimentacoes
        );


        return novaMovimentacao;

    }


    /* =====================================================
       COMPRAS
       ===================================================== */

    function obterCompras() {

        const dados = ler(STORAGE_KEYS.compras, []);

        return Array.isArray(dados) ? dados : [];

    }


    function salvarCompras(compras) {

        return salvar(
            STORAGE_KEYS.compras,
            Array.isArray(compras) ? compras : []
        );

    }


    function adicionarCompra(compra) {

        const compras =
            obterCompras();


        const novaCompra = {

            id:
                compra.id ||
                gerarId("COMPRA"),

            numero:
                compra.numero ||
                ("COMP-" +
                    String(compras.length + 1).padStart(5, "0")),

            produtoId:
                compra.produtoId || null,

            produtoCodigo:
                compra.produtoCodigo || "",

            produtoNome:
                compra.produtoNome || "",

            quantidade:
                Number(compra.quantidade) || 0,

            custoUnitario:
                Number(compra.custoUnitario) || 0,

            precoVendaUnitario:
                Number(compra.precoVendaUnitario) || 0,

            totalCompra:
                Number(compra.totalCompra) || 0,

            lucroUnitario:
                Number(compra.lucroUnitario) || 0,

            margemPercentual:
                Number(compra.margemPercentual) || 0,

            formaPagamento:
                compra.formaPagamento || "",

            statusPagamento:
                compra.statusPagamento || "pago",

            parcelas:
                Math.max(1, Number(compra.parcelas) || 1),

            primeiraParcela:
                compra.primeiraParcela || null,

            vencimento:
                compra.vencimento || null,

            cronogramaParcelas:
                Array.isArray(compra.cronogramaParcelas)
                    ? compra.cronogramaParcelas
                    : [],

            /* Controle físico da mercadoria */
            situacao:
                compra.situacao || "recebida",

            quantidadeRecebida:
                Number.isFinite(Number(compra.quantidadeRecebida))
                    ? Number(compra.quantidadeRecebida)
                    : (compra.situacao === "transito" ? 0 : Number(compra.quantidade) || 0),

            previsaoEntrega:
                compra.previsaoEntrega || null,

            recebidaEm:
                compra.recebidaEm || null,

            data:
                compra.data || agora(),

            observacoes:
                compra.observacoes || "",

            criadoEm:
                compra.criadoEm || agora()

        };


        compras.push(novaCompra);

        salvarCompras(compras);

        return novaCompra;

    }


    /* =====================================================
       CONTAS A RECEBER
       ===================================================== */

    function obterContasReceber() {

        const dados = ler(STORAGE_KEYS.receber, []);

        return Array.isArray(dados) ? dados : [];

    }


    function salvarContasReceber(
        contas
    ) {

        return salvar(
            STORAGE_KEYS.receber,
            contas
        );

    }


    function adicionarContaReceber(
        conta
    ) {

        const contas =
            obterContasReceber();


        const novaConta = {

            id:
                conta.id ||
                gerarId("REC"),

            vendaId:
                conta.vendaId ||
                null,

            clienteId:
                conta.clienteId ||
                null,

            clienteNome:
                conta.clienteNome ||
                "",

            valor:
                Number(conta.valor)
                || 0,

            vencimento:
                conta.vencimento
                || null,

            status:
                conta.status === "pago"
                    ? "pago"
                    : (conta.status === "cancelado" || conta.status === "cancelada"
                        ? "cancelado"
                        : "pendente"),

            dataPagamento:
                conta.dataPagamento
                || null,

            valorPago:
                Number(
                    conta.valorPago
                ) || 0,

            saldo:
                Number(conta.saldo) ||
                Number(conta.valor) ||
                0,

            descricao:
                conta.descricao ||
                "",

            parcela:
                Number(conta.parcela) ||
                1,

            totalParcelas:
                Number(conta.totalParcelas) ||
                1,

            primeiraParcela:
                conta.primeiraParcela ||
                null,

            formaPagamento:
                conta.formaPagamento ||
                "prazo",

            criadoEm:
                conta.criadoEm ||
                agora()

        };


        contas.push(
            novaConta
        );


        salvarContasReceber(
            contas
        );


        return novaConta;

    }


    /* =====================================================
       CONFIGURAÇÕES
       ===================================================== */

    function obterConfiguracoes() {

        return ler(
            STORAGE_KEYS.configuracoes,
            {
                ...CONFIGURACOES_PADRAO
            }
        );

    }


    function salvarConfiguracoes(
        configuracoes
    ) {

        const dados = {

            ...CONFIGURACOES_PADRAO,

            ...configuracoes,

            ultimaAtualizacao:
                agora()

        };


        return salvar(
            STORAGE_KEYS.configuracoes,
            dados
        );

    }


    /* =====================================================
       ESTOQUE
       ===================================================== */

    function atualizarEstoque(
        produtoId,
        quantidade,
        operacao
    ) {

        const produtos =
            obterProdutos();


        const produto =
            produtos.find(
                item =>
                    item.id === produtoId
            );


        if (!produto) {

            return {
                sucesso: false,
                mensagem:
                    "Produto não encontrado."
            };

        }


        const valor =
            Number(quantidade);


        if (
            !Number.isFinite(valor) ||
            valor <= 0
        ) {

            return {
                sucesso: false,
                mensagem:
                    "Quantidade inválida."
            };

        }


        if (operacao === "entrada") {

            produto.quantidade += valor;

        }


        else if (
            operacao === "saida"
        ) {

            if (
                produto.quantidade < valor
            ) {

                return {
                    sucesso: false,
                    mensagem:
                        "Estoque insuficiente."
                };

            }

            produto.quantidade -= valor;

        }


        else {

            return {
                sucesso: false,
                mensagem:
                    "Operação inválida."
            };

        }


        produto.atualizadoEm =
            agora();


        salvarProdutos(
            produtos
        );


        return {
            sucesso: true,
            produto: produto
        };

    }


    /* =====================================================
       BACKUP DOS DADOS
       ===================================================== */

    function obterTodosDados() {

        return {

            sistema:
                ler(
                    STORAGE_KEYS.sistema,
                    SISTEMA_PADRAO
                ),

            produtos:
                obterProdutos(),

            clientes:
                obterClientes(),

            vendas:
                obterVendas(),

            financeiro:
                obterMovimentacoes(),

            receber:
                obterContasReceber(),

            compras:
                obterCompras(),

            vendasPessoais:
                obterVendasPessoais(),

            cartoesPessoais:
                obterCartoesPessoais(),

            pedidos:
                obterPedidos(),

            configuracoes:
                obterConfiguracoes(),

            backupInfo: {

                versao:
                    STORAGE_VERSION,

                criadoEm:
                    agora(),

                aplicativo:
                    "J.C Imports"

            }

        };

    }


    /* =====================================================
       RESTAURAÇÃO
       ===================================================== */

    function restaurarTodosDados(
        dados
    ) {

        if (
            !dados ||
            typeof dados !== "object"
        ) {

            return {
                sucesso: false,
                mensagem:
                    "Arquivo de backup inválido."
            };

        }


        try {

            if (
                Array.isArray(
                    dados.produtos
                )
            ) {

                salvar(
                    STORAGE_KEYS.produtos,
                    dados.produtos
                );

            }


            if (
                Array.isArray(
                    dados.clientes
                )
            ) {

                salvar(
                    STORAGE_KEYS.clientes,
                    dados.clientes
                );

            }


            if (
                Array.isArray(
                    dados.vendas
                )
            ) {

                salvar(
                    STORAGE_KEYS.vendas,
                    dados.vendas
                );

            }


            if (
                Array.isArray(
                    dados.financeiro
                )
            ) {

                salvar(
                    STORAGE_KEYS.financeiro,
                    dados.financeiro
                );

            }


            if (
                Array.isArray(
                    dados.receber
                )
            ) {

                salvar(
                    STORAGE_KEYS.receber,
                    dados.receber
                );

            }


            if (
                Array.isArray(
                    dados.compras
                )
            ) {

                salvar(
                    STORAGE_KEYS.compras,
                    dados.compras
                );

            }


            if (
                Array.isArray(
                    dados.vendasPessoais
                )
            ) {
                salvar(STORAGE_KEYS.vendasPessoais, dados.vendasPessoais);
            }

            if (
                Array.isArray(
                    dados.cartoesPessoais
                )
            ) {
                salvar(STORAGE_KEYS.cartoesPessoais, dados.cartoesPessoais);
            }

            if (
                Array.isArray(
                    dados.pedidos
                )
            ) {
                salvar(STORAGE_KEYS.pedidos, dados.pedidos);
            }


            if (
                dados.configuracoes &&
                typeof dados.configuracoes
                === "object"
            ) {

                salvarConfiguracoes(
                    dados.configuracoes
                );

            }


            return {

                sucesso: true,

                mensagem:
                    "Dados restaurados com sucesso."

            };

        }

        catch (erro) {

            console.error(
                "Erro na restauração:",
                erro
            );


            return {

                sucesso: false,

                mensagem:
                    "Não foi possível restaurar os dados."

            };

        }

    }


    /* =====================================================
       VENDAS PESSOAIS
       ===================================================== */

    function obterVendasPessoais() {
        const dados = ler(STORAGE_KEYS.vendasPessoais, []);
        return Array.isArray(dados) ? dados : [];
    }

    function salvarVendasPessoais(vendas) {
        return salvar(STORAGE_KEYS.vendasPessoais, Array.isArray(vendas) ? vendas : []);
    }

    function adicionarVendaPessoal(venda) {
        const lista = obterVendasPessoais();
        const novo = { ...venda, id: venda.id || gerarId("VP"), pagamentos: Array.isArray(venda.pagamentos) ? venda.pagamentos : [], periodosJuros: Array.isArray(venda.periodosJuros) ? venda.periodosJuros : [], criadoEm: venda.criadoEm || agora(), atualizadoEm: agora() };
        lista.push(novo);
        salvarVendasPessoais(lista);
        return novo;
    }

    function atualizarVendaPessoal(venda) {
        const lista = obterVendasPessoais();
        const i = lista.findIndex(x => x && x.id === venda.id);
        if (i < 0) return false;
        lista[i] = { ...lista[i], ...venda, atualizadoEm: agora() };
        return salvarVendasPessoais(lista);
    }

    function excluirVendaPessoal(id) {
        return salvarVendasPessoais(obterVendasPessoais().filter(x => x && x.id !== id));
    }

    function limparVendasPessoais() { return salvarVendasPessoais([]); }

    /* =====================================================
       CARTÕES PESSOAIS
       ===================================================== */

    function obterCartoesPessoais() {
        const dados = ler(STORAGE_KEYS.cartoesPessoais, []);
        return Array.isArray(dados) ? dados : [];
    }

    function salvarCartoesPessoais(cartoes) {
        return salvar(STORAGE_KEYS.cartoesPessoais, Array.isArray(cartoes) ? cartoes : []);
    }

    function adicionarCartaoPessoal(cartao) {
        const lista = obterCartoesPessoais();
        const novo = { ...cartao, id: cartao.id || gerarId("CARD"), criadoEm: cartao.criadoEm || agora(), atualizadoEm: agora() };
        lista.push(novo);
        salvarCartoesPessoais(lista);
        return novo;
    }

    function atualizarCartaoPessoal(cartao) {
        const lista = obterCartoesPessoais();
        const i = lista.findIndex(x => x && x.id === cartao.id);
        if (i < 0) return false;
        lista[i] = { ...lista[i], ...cartao, atualizadoEm: agora() };
        return salvarCartoesPessoais(lista);
    }

    function excluirCartaoPessoal(id) {
        return salvarCartoesPessoais(obterCartoesPessoais().filter(x => x && x.id !== id));
    }

    function limparCartoesPessoais() { return salvarCartoesPessoais([]); }

    /* =====================================================
       PEDIDOS
       ===================================================== */

    function obterPedidos() {
        const dados = ler(STORAGE_KEYS.pedidos, []);
        return Array.isArray(dados) ? dados : [];
    }

    function salvarPedidos(pedidos) {
        return salvar(STORAGE_KEYS.pedidos, Array.isArray(pedidos) ? pedidos : []);
    }

    /* =====================================================
       EXPOSIÇÃO GLOBAL
       ===================================================== */

    window.JCStorage = {

        STORAGE_KEYS,

        STORAGE_VERSION,

        gerarId,

        agora,

        inicializar,

        obterProdutos,

        salvarProdutos,

        adicionarProduto,

        obterClientes,

        salvarClientes,

        adicionarCliente,

        obterVendas,

        salvarVendas,

        adicionarVenda,

        obterMovimentacoes,

        salvarMovimentacoes,

        adicionarMovimentacao,

        obterCompras,
        salvarCompras,
        adicionarCompra,

        obterVendasPessoais,
        salvarVendasPessoais,
        adicionarVendaPessoal,
        atualizarVendaPessoal,
        excluirVendaPessoal,
        limparVendasPessoais,

        obterCartoesPessoais,
        salvarCartoesPessoais,
        adicionarCartaoPessoal,
        atualizarCartaoPessoal,
        excluirCartaoPessoal,
        limparCartoesPessoais,

        obterPedidos,
        salvarPedidos,

        obterContasReceber,

        salvarContasReceber,

        adicionarContaReceber,

        obterConfiguracoes,

        salvarConfiguracoes,

        atualizarEstoque,

        obterTodosDados,

        restaurarTodosDados

    };


    /* =====================================================
       INICIALIZAÇÃO AUTOMÁTICA
       ===================================================== */

    inicializar();


})();