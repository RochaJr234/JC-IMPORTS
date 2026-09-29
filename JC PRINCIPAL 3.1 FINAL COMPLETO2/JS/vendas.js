/* VERSÃO DE RECIBO AUTOMÁTICO: 2.3.0 */
/* =========================================================
   J.C IMPORTS 2.0
   MÓDULO DE VENDAS
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       VERIFICAÇÕES
       ===================================================== */

    if (!window.JCStorage) {

        console.error(
            "JCStorage não foi carregado."
        );

        return;
    }


    if (!window.JCProdutos) {

        console.error(
            "JCProdutos não foi carregado."
        );

        return;
    }


    /* =====================================================
       OBJETO PRINCIPAL
       ===================================================== */

    const JCVendas = {


        /* =================================================
           LISTAR
           ================================================= */

        listar: function () {

            const vendas =
                JCStorage.obterVendas();

            return Array.isArray(vendas)
                ? vendas
                : [];

        },


        /* =================================================
           BUSCAR POR ID
           ================================================= */

        buscarPorId: function (id) {

            return this.listar().find(
                function (venda) {

                    return String(venda.id) ===
                        String(id);

                }
            ) || null;

        },


        /* =================================================
           GERAR NÚMERO
           ================================================= */

        gerarNumero: function () {

            const vendas =
                this.listar();

            let maiorNumero = 0;


            vendas.forEach(
                function (venda) {

                    const numero =
                        parseInt(
                            String(
                                venda.numero || ""
                            ).replace(
                                /\D/g,
                                ""
                            ),
                            10
                        );


                    if (
                        Number.isFinite(numero) &&
                        numero > maiorNumero
                    ) {

                        maiorNumero =
                            numero;

                    }

                }
            );


            return (
                "VEN-" +
                String(
                    maiorNumero + 1
                ).padStart(
                    5,
                    "0"
                )
            );

        },


        /* =================================================
           ARREDONDAR
           ================================================= */

        arredondar: function (valor) {

            return Math.round(
                (
                    Number(valor) || 0
                ) * 100
            ) / 100;

        },


        /* =================================================
           NORMALIZAR ITEM
           ================================================= */

        normalizarItem: function (item) {

            item =
                item || {};


            const produto =
                JCProdutos.buscarPorId(
                    item.produtoId
                );


            if (!produto) {

                return null;

            }


            const quantidade =
                Number(
                    item.quantidade
                );


            if (
                !Number.isFinite(quantidade) ||
                quantidade <= 0
            ) {

                return null;

            }


            let valorUnitario =
                Number(
                    item.valorUnitario
                );


            if (
                !Number.isFinite(valorUnitario) ||
                valorUnitario < 0
            ) {

                valorUnitario =
                    Number(
                        produto.precoVenda
                    ) || 0;

            }


            const subtotal =
                this.arredondar(
                    quantidade *
                    valorUnitario
                );


            return {

                produtoId:
                    produto.id,

                codigo:
                    produto.codigo || "",

                nome:
                    produto.nome || "",

                quantidade:
                    quantidade,

                valorCusto:
                    Number(
                        produto.precoCusto
                    ) || 0,

                valorUnitario:
                    valorUnitario,

                subtotal:
                    subtotal

            };

        },


        /* =================================================
           CONSOLIDAR QUANTIDADES
           ================================================= */

        consolidarQuantidades: function (itens) {

            const mapa = {};


            if (
                !Array.isArray(itens)
            ) {

                return mapa;

            }


            itens.forEach(
                function (item) {

                    if (
                        !item ||
                        !item.produtoId
                    ) {

                        return;

                    }


                    const id =
                        String(
                            item.produtoId
                        );


                    if (
                        !mapa[id]
                    ) {

                        mapa[id] = 0;

                    }


                    mapa[id] +=
                        Number(
                            item.quantidade
                        ) || 0;

                }
            );


            return mapa;

        },


        /* =================================================
           VALIDAR ITENS
           ================================================= */

        validarItens: function (itens) {

            if (
                !Array.isArray(itens) ||
                itens.length === 0
            ) {

                return {

                    valido: false,

                    mensagem:
                        "Adicione pelo menos um produto à venda."

                };

            }


            const quantidades =
                this.consolidarQuantidades(
                    itens
                );


            for (
                let i = 0;
                i < itens.length;
                i++
            ) {

                const item =
                    itens[i];


                if (
                    !item ||
                    !item.produtoId
                ) {

                    return {

                        valido: false,

                        mensagem:
                            "Existe um item sem produto."

                    };

                }


                const quantidade =
                    Number(
                        item.quantidade
                    );


                if (
                    !Number.isFinite(quantidade) ||
                    quantidade <= 0
                ) {

                    return {

                        valido: false,

                        mensagem:
                            "A quantidade do produto deve ser maior que zero."

                    };

                }


                const produto =
                    JCProdutos.buscarPorId(
                        item.produtoId
                    );


                if (!produto) {

                    return {

                        valido: false,

                        mensagem:
                            "Um dos produtos selecionados não foi encontrado."

                    };

                }


                const estoque =
                    Number(
                        produto.estoque
                    ) || 0;


                const quantidadeTotal =
                    Number(
                        quantidades[
                            String(
                                item.produtoId
                            )
                        ]
                    ) || 0;


                if (
                    quantidadeTotal >
                    estoque
                ) {

                    return {

                        valido: false,

                        mensagem:
                            "Estoque insuficiente para o produto: " +
                            produto.nome +
                            ". Disponível: " +
                            estoque +
                            ". Quantidade solicitada: " +
                            quantidadeTotal +
                            "."

                    };

                }

            }


            return {

                valido: true,

                mensagem: ""

            };

        },


        /* =================================================
           CALCULAR SUBTOTAL
           ================================================= */

        calcularSubtotal: function (itens) {

            if (
                !Array.isArray(itens)
            ) {

                return 0;

            }


            return this.arredondar(
                itens.reduce(
                    function (
                        total,
                        item
                    ) {

                        return total +
                            (
                                Number(
                                    item.subtotal
                                ) || 0
                            );

                    },
                    0
                )
            );

        },


        /* =================================================
           CALCULAR TOTAL
           ================================================= */

        calcularTotal: function (
            itens,
            desconto
        ) {

            const subtotal =
                this.calcularSubtotal(
                    itens
                );


            const valorDesconto =
                Math.max(
                    Number(
                        desconto
                    ) || 0,
                    0
                );


            return this.arredondar(
                Math.max(
                    subtotal -
                    valorDesconto,
                    0
                )
            );

        },


        /* =================================================
           CALCULAR CUSTO
           ================================================= */

        calcularCusto: function (itens) {

            if (
                !Array.isArray(itens)
            ) {

                return 0;

            }


            return this.arredondar(
                itens.reduce(
                    function (
                        total,
                        item
                    ) {

                        return total +
                            (
                                (
                                    Number(
                                        item.quantidade
                                    ) || 0
                                ) *
                                (
                                    Number(
                                        item.valorCusto
                                    ) || 0
                                )
                            );

                    },
                    0
                )
            );

        },


        /* =================================================
           OBTER CLIENTE
           ================================================= */

        obterCliente: function (clienteId) {

            if (!clienteId) {

                return null;

            }


            const clientes =
                JCStorage.obterClientes();


            if (
                !Array.isArray(clientes)
            ) {

                return null;

            }


            return clientes.find(
                function (cliente) {

                    return String(
                        cliente.id
                    ) === String(
                        clienteId
                    );

                }
            ) || null;

        },


        /* =================================================
           FORMAS DE PAGAMENTO
           ================================================= */

        formasPagamento: function () {

            return [
                "dinheiro",
                "pix",
                "cartao",
                "prazo"
            ];

        },


        /* =================================================
           VALIDAR PAGAMENTO
           ================================================= */

        validarFormaPagamento: function (forma) {

            return this.formasPagamento()
                .includes(
                    String(
                        forma || ""
                    ).toLowerCase()
                );

        },


        /* =================================================
           REGISTRAR VENDA
           ================================================= */

        registrar: function (dados) {

            dados =
                dados || {};


            /* ---------------------------------------------
               ITENS
               --------------------------------------------- */

            const itensOriginais =
                Array.isArray(
                    dados.itens
                )
                    ? dados.itens
                    : [];


            const validacao =
                this.validarItens(
                    itensOriginais
                );


            if (
                !validacao.valido
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        validacao.mensagem

                };

            }


            /* ---------------------------------------------
               NORMALIZAR ITENS
               --------------------------------------------- */

            const itens = [];


            for (
                let i = 0;
                i < itensOriginais.length;
                i++
            ) {

                const item =
                    this.normalizarItem(
                        itensOriginais[i]
                    );


                if (!item) {

                    return {

                        sucesso: false,

                        mensagem:
                            "Não foi possível identificar um dos produtos."

                    };

                }


                itens.push(
                    item
                );

            }


            /* ---------------------------------------------
               PAGAMENTO
               --------------------------------------------- */

            const formaPagamento =
                String(
                    dados.formaPagamento ||
                    "dinheiro"
                ).toLowerCase();


            if (
                !this.validarFormaPagamento(
                    formaPagamento
                )
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "Forma de pagamento inválida."

                };

            }


            /* ---------------------------------------------
               CLIENTE
               --------------------------------------------- */

            const cliente =
                this.obterCliente(
                    dados.clienteId
                );


            if (
                dados.clienteId &&
                !cliente
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "Cliente não encontrado."

                };

            }


            if (
                formaPagamento === "prazo" &&
                !cliente
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "Venda a prazo precisa estar vinculada a um cliente."

                };

            }


            /* ---------------------------------------------
               VALORES
               --------------------------------------------- */

            const subtotal =
                this.calcularSubtotal(
                    itens
                );


            const desconto =
                Math.max(
                    Number(
                        dados.desconto
                    ) || 0,
                    0
                );


            if (
                desconto >
                subtotal
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "O desconto não pode ser maior que o subtotal da venda."

                };

            }


            const total =
                this.calcularTotal(
                    itens,
                    desconto
                );


            if (
                total <= 0
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "O total da venda precisa ser maior que zero."

                };

            }


            const custoTotal =
                this.calcularCusto(
                    itens
                );


            const lucroEstimado =
                this.arredondar(
                    total -
                    custoTotal
                );


            /* ---------------------------------------------
               VENCIMENTO
               --------------------------------------------- */

            let vencimento = null;
            let parcelas = 1;
            let primeiraParcela = null;
            let cronogramaParcelas = [];


            if (formaPagamento === "prazo" || formaPagamento === "cartao") {

                parcelas = Number(dados.parcelas);

                if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 10) {
                    return {
                        sucesso: false,
                        mensagem: "Informe um parcelamento entre 1x e 10x."
                    };
                }

                primeiraParcela =
                    dados.primeiraParcela ||
                    dataLocalISO(30);

                if (!dataValidaISO(primeiraParcela)) {
                    return {
                        sucesso: false,
                        mensagem: "Informe uma data válida para o início das parcelas."
                    };
                }

                cronogramaParcelas = gerarParcelas(
                    total,
                    parcelas,
                    primeiraParcela
                );

                if (!cronogramaParcelas.length) {
                    return {
                        sucesso: false,
                        mensagem: "Não foi possível gerar o cronograma das parcelas."
                    };
                }

                // Mantém compatibilidade com o campo antigo de vencimento.
                vencimento = cronogramaParcelas[0].vencimento;
            }

            /* ---------------------------------------------
               VENDA
               --------------------------------------------- */

            const venda = {

                id:
                    JCStorage.gerarId(
                        "VEN"
                    ),

                numero:
                    this.gerarNumero(),

                data:
                    dados.data ||
                    JCStorage.agora(),

                clienteId:
                    cliente
                        ? cliente.id
                        : null,

                clienteNome:
                    cliente
                        ? cliente.nome
                        : "Cliente não informado",

                itens:
                    itens,

                subtotal:
                    subtotal,

                desconto:
                    desconto,

                total:
                    total,

                custoTotal:
                    custoTotal,

                lucroEstimado:
                    lucroEstimado,

                formaPagamento:
                    formaPagamento,

                vencimento:
                    vencimento,

                parcelas:
                    (formaPagamento === "cartao" || formaPagamento === "prazo")
                        ? parcelas
                        : 1,

                primeiraParcela:
                    (formaPagamento === "cartao" || formaPagamento === "prazo")
                        ? primeiraParcela
                        : null,

                cronogramaParcelas:
                    (formaPagamento === "cartao" || formaPagamento === "prazo")
                        ? cronogramaParcelas
                        : [],

                status:
                    formaPagamento === "prazo"
                        ? "pendente"
                        : "pago",

                statusPagamento:
                    formaPagamento === "prazo"
                        ? "pendente"
                        : "pago",

                observacoes:
                    String(
                        dados.observacoes ||
                        ""
                    ).trim(),

                garantia:
                    dados.garantia || "",

                numeroNF:
                    dados.numeroNF || "",

                criadoEm:
                    JCStorage.agora()

            };


            /* ---------------------------------------------
               GUARDAR ESTOQUE ORIGINAL
               --------------------------------------------- */

            const produtosAntes =
                JCStorage
                    .obterProdutos()
                    .map(
                        function (produto) {

                            return {
                                ...produto
                            };

                        }
                    );


            /* ---------------------------------------------
               BAIXAR ESTOQUE
               --------------------------------------------- */

            for (
                let i = 0;
                i < itens.length;
                i++
            ) {

                const item =
                    itens[i];


                const resultado =
                    JCProdutos.saida(
                        item.produtoId,
                        item.quantidade,
                        "Venda " +
                        venda.numero
                    );


                if (
                    !resultado ||
                    resultado.sucesso === false
                ) {

                    JCStorage.salvarProdutos(
                        produtosAntes
                    );


                    JCProdutos.atualizarTela();


                    return {

                        sucesso: false,

                        mensagem:
                            resultado &&
                            resultado.mensagem
                                ? resultado.mensagem
                                : "Não foi possível baixar o estoque."

                    };

                }

            }


            /* ---------------------------------------------
               SALVAR VENDA
               --------------------------------------------- */

            const vendaSalva =
                JCStorage.adicionarVenda(venda);

            const salva = !!vendaSalva;


            if (
                salva === false
            ) {

                JCStorage.salvarProdutos(
                    produtosAntes
                );


                JCProdutos.atualizarTela();


                return {

                    sucesso: false,

                    mensagem:
                        "Não foi possível salvar a venda."

                };

            }


            /* ---------------------------------------------
               FINANCEIRO
               --------------------------------------------- */

            if (
                formaPagamento !== "prazo"
            ) {

                JCStorage.adicionarMovimentacao({

                    tipo:
                        "entrada",

                    categoria:
                        "venda",

                    descricao:
                        "Venda " +
                        venda.numero,

                    valor:
                        total,

                    data:
                        venda.data,

                    referenciaId:
                        venda.id,

                    vendaId:
                        venda.id,

                    formaPagamento:
                        formaPagamento,

                    observacoes:
                        "Forma de pagamento: " +
                        formaPagamento

                });

            }


            /* ---------------------------------------------
               CONTAS A RECEBER
               --------------------------------------------- */

            if (formaPagamento === "prazo") {

                const cronograma =
                    Array.isArray(venda.cronogramaParcelas) &&
                    venda.cronogramaParcelas.length
                        ? venda.cronogramaParcelas
                        : [{
                            numero: 1,
                            valor: total,
                            vencimento: venda.vencimento
                        }];

                for (let i = 0; i < cronograma.length; i++) {

                    const parcela = cronograma[i];

                    const conta =
                        JCStorage.adicionarContaReceber({
                            vendaId: venda.id,
                            clienteId: cliente.id,
                            clienteNome: cliente.nome,
                            valor: Number(parcela.valor) || 0,
                            vencimento: parcela.vencimento,
                            status: "pendente",
                            valorPago: 0,
                            saldo: Number(parcela.valor) || 0,
                            descricao: "Venda " + venda.numero + " - Parcela " + parcela.numero + "/" + venda.parcelas,
                            parcela: Number(parcela.numero) || 1,
                            totalParcelas: Number(venda.parcelas) || 1,
                            primeiraParcela: venda.primeiraParcela,
                            formaPagamento: "prazo"
                        });

                    if (!conta || !conta.id) {

                        console.error("Falha ao registrar parcela em A receber.", parcela);

                    }
                }
            }

            /* ---------------------------------------------
               ATUALIZAÇÕES
               --------------------------------------------- */

            if (
                window.JCApp &&
                typeof window.JCApp
                    .atualizarDashboard ===
                    "function"
            ) {

                window.JCApp.atualizarDashboard();

            }


            if (
                typeof JCProdutos.atualizarTela ===
                "function"
            ) {

                JCProdutos.atualizarTela();

            }


            return {

                sucesso: true,

                venda:
                    venda,

                mensagem:
                    "Venda " +
                    venda.numero +
                    " registrada com sucesso."

            };

        },


        /* =================================================
           RESTAURAR ESTOQUE
           ================================================= */

        restaurarEstoque: function (itens) {

            if (
                !Array.isArray(itens) ||
                itens.length === 0
            ) {

                return {

                    sucesso: true

                };

            }


            const produtos =
                JCStorage.obterProdutos();


            if (
                !Array.isArray(produtos)
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "Não foi possível acessar o estoque."

                };

            }


            for (
                let i = 0;
                i < itens.length;
                i++
            ) {

                const item =
                    itens[i];


                const indice =
                    produtos.findIndex(
                        function (produto) {

                            return String(
                                produto.id
                            ) === String(
                                item.produtoId
                            );

                        }
                    );


                if (
                    indice === -1
                ) {

                    return {

                        sucesso: false,

                        mensagem:
                            "Produto não encontrado para devolução ao estoque."

                    };

                }


                produtos[indice].estoque =
                    (
                        Number(
                            produtos[indice].estoque
                        ) || 0
                    ) +
                    (
                        Number(
                            item.quantidade
                        ) || 0
                    );


                produtos[indice].atualizadoEm =
                    JCStorage.agora();

            }


            const salvo =
                JCStorage.salvarProdutos(
                    produtos
                );


            if (
                salvo === false
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "Não foi possível devolver os produtos ao estoque."

                };

            }


            JCProdutos.atualizarTela();


            return {

                sucesso: true

            };

        },


        /* =================================================
           CANCELAR VENDA
           ================================================= */

        cancelar: function (id) {

            const vendas =
                this.listar();


            const indice =
                vendas.findIndex(
                    function (venda) {

                        return String(
                            venda.id
                        ) === String(
                            id
                        );

                    }
                );


            if (
                indice === -1
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "Venda não encontrada."

                };

            }


            const venda =
                vendas[indice];


            if (
                venda.status ===
                "cancelada"
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "Esta venda já foi cancelada."

                };

            }


            /* ---------------------------------------------
               CONTA A RECEBER
               --------------------------------------------- */

            const contas =
                JCStorage.obterContasReceber();


            const conta =
                Array.isArray(contas)
                    ? contas.find(
                        function (item) {

                            return String(
                                item.vendaId
                            ) === String(
                                venda.id
                            );

                        }
                    )
                    : null;


            if (
                conta &&
                (
                    Number(
                        conta.valorPago
                    ) || 0
                ) > 0
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "Esta venda possui recebimentos registrados. Estorne os recebimentos antes de cancelar a venda."

                };

            }


            /* ---------------------------------------------
               RESTAURAR ESTOQUE
               --------------------------------------------- */

            const estoque =
                this.restaurarEstoque(
                    venda.itens
                );


            if (
                !estoque.sucesso
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        estoque.mensagem

                };

            }


            /* ---------------------------------------------
               CANCELAR CONTA
               --------------------------------------------- */

            if (
                conta
            ) {

                const contasAtualizadas =
                    contas.map(
                        function (item) {

                            if (
                                String(
                                    item.vendaId
                                ) !== String(
                                    venda.id
                                )
                            ) {

                                return item;

                            }


                            return {

                                ...item,

                                saldo: 0,

                                status:
                                    "cancelada",

                                canceladaEm:
                                    JCStorage.agora()

                            };

                        }
                    );


                JCStorage.salvarContasReceber(
                    contasAtualizadas
                );

            }


            /* ---------------------------------------------
               ESTORNO FINANCEIRO
               --------------------------------------------- */

            if (
                venda.formaPagamento !==
                "prazo"
            ) {

                JCStorage.adicionarMovimentacao({

                    tipo:
                        "saida",

                    categoria:
                        "estorno_venda",

                    descricao:
                        "Estorno da venda " +
                        venda.numero,

                    valor:
                        Number(
                            venda.total
                        ) || 0,

                    data:
                        JCStorage.agora(),

                    referenciaId:
                        venda.id,

                    observacoes:
                        "Cancelamento da venda " +
                        venda.numero

                });

            }


            /* ---------------------------------------------
               MARCAR COMO CANCELADA
               --------------------------------------------- */

            venda.status =
                "cancelada";


            venda.statusPagamento =
                "cancelada";


            venda.canceladaEm =
                JCStorage.agora();


            vendas[indice] =
                venda;


            const salvo =
                JCStorage.salvarVendas(
                    vendas
                );


            if (
                salvo === false
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "A venda foi processada, mas não foi possível atualizar o histórico."

                };

            }


            if (
                window.JCApp &&
                typeof window.JCApp
                    .atualizarDashboard ===
                    "function"
            ) {

                window.JCApp.atualizarDashboard();

            }


            return {

                sucesso: true,

                venda:
                    venda,

                mensagem:
                    "Venda cancelada e produtos devolvidos ao estoque."

            };

        },


        /* =================================================
           VENDAS DO DIA
           ================================================= */

        vendasDoDia: function (dataReferencia) {

            const data =
                dataReferencia ||
                new Date()
                    .toISOString()
                    .slice(
                        0,
                        10
                    );


            return this.listar()
                .filter(
                    function (venda) {

                        if (
                            venda.status ===
                            "cancelada"
                        ) {

                            return false;

                        }


                        return String(
                            venda.data
                        ).slice(
                            0,
                            10
                        ) === data;

                    }
                );

        },


        /* =================================================
           VENDAS DO MÊS
           ================================================= */

        vendasDoMes: function (
            ano,
            mes
        ) {

            const agora =
                new Date();


            ano =
                ano !== undefined
                    ? Number(ano)
                    : agora.getFullYear();


            mes =
                mes !== undefined
                    ? Number(mes)
                    : agora.getMonth() + 1;


            return this.listar()
                .filter(
                    function (venda) {

                        if (
                            venda.status ===
                            "cancelada"
                        ) {

                            return false;

                        }


                        const data =
                            new Date(
                                venda.data
                            );


                        return (
                            data.getFullYear() ===
                            ano &&
                            data.getMonth() + 1 ===
                            mes
                        );

                    }
                );

        },


        /* =================================================
           TOTAL DO DIA
           ================================================= */

        totalDoDia: function (
            dataReferencia
        ) {

            return this.vendasDoDia(
                dataReferencia
            ).reduce(
                function (
                    total,
                    venda
                ) {

                    return total +
                        (
                            Number(
                                venda.total
                            ) || 0
                        );

                },
                0
            );

        },


        /* =================================================
           TOTAL DO MÊS
           ================================================= */

        totalDoMes: function (
            ano,
            mes
        ) {

            return this.vendasDoMes(
                ano,
                mes
            ).reduce(
                function (
                    total,
                    venda
                ) {

                    return total +
                        (
                            Number(
                                venda.total
                            ) || 0
                        );

                },
                0
            );

        },


        /* =================================================
           LUCRO DO MÊS
           ================================================= */

        lucroDoMes: function (
            ano,
            mes
        ) {

            return this.vendasDoMes(
                ano,
                mes
            ).reduce(
                function (
                    total,
                    venda
                ) {

                    return total +
                        (
                            Number(
                                venda.lucroEstimado
                            ) || 0
                        );

                },
                0
            );

        }

    };


    /* =====================================================
       FUNÇÕES DA INTERFACE
       ===================================================== */

    function moedaVenda(valor) {

        return Number(
            valor || 0
        ).toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

    }


    function escaparVenda(valor) {

        return String(
            valor ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    function numeroVenda(valor) {

        if (
            typeof valor === "number"
        ) {

            return valor;

        }


        return Number(
            String(
                valor ?? ""
            )
                .replace(/\s/g, "")
                .replace(/\./g, "")
                .replace(",", ".")
        ) || 0;

    }


    /* =====================================================
       OBTER CLIENTES
       ===================================================== */

    function obterClientesVenda() {

        if (
            typeof JCStorage.obterClientes !==
            "function"
        ) {

            return [];

        }


        const clientes =
            JCStorage.obterClientes();


        return Array.isArray(
            clientes
        )
            ? clientes
            : [];

    }


    /* =====================================================
       OBTER PRODUTOS
       ===================================================== */

    function obterProdutosVenda() {

        const produtos =
            JCProdutos.listar();


        return Array.isArray(
            produtos
        )
            ? produtos
            : [];

    }


    /* =====================================================
       ITENS TEMPORÁRIOS DA VENDA
       ===================================================== */

    let itensVendaTela = [];


    /* =====================================================
       ESTILO
       ===================================================== */

    function inserirEstiloVendas() {

        if (
            document.getElementById(
                "estiloModuloVendas"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "estiloModuloVendas";


        style.textContent = `

            .vendas-module {
                display: grid;
                gap: 18px;
            }

            .vendas-card {
                background: var(--card-bg, #ffffff);
                border: 1px solid rgba(0,0,0,.08);
                border-radius: 16px;
                padding: 18px;
                box-shadow: 0 5px 20px rgba(0,0,0,.05);
            }

            .vendas-card-title {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 16px;
            }

            .vendas-card-title h2 {
                margin: 0;
                font-size: 18px;
            }

            .vendas-grid {
                display: grid;
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
                gap: 14px;
            }

            .vendas-field {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .vendas-field[hidden] {
                display: none !important;
            }

            .vendas-field-full {
                grid-column: 1 / -1;
            }

            .vendas-field label {
                font-size: 13px;
                font-weight: 600;
            }

            .vendas-field input,
            .vendas-field select,
            .vendas-field textarea {
                width: 100%;
                box-sizing: border-box;
                border: 1px solid #d7dce2;
                border-radius: 10px;
                padding: 11px 12px;
                background: #fff;
                font-size: 14px;
                outline: none;
            }

            .vendas-field input:focus,
            .vendas-field select:focus,
            .vendas-field textarea:focus {
                border-color: #2563eb;
            }

            .vendas-button {
                border: 0;
                border-radius: 10px;
                padding: 11px 15px;
                cursor: pointer;
                font-weight: 700;
                font-size: 14px;
            }

            .vendas-button-primary {
                background: #2563eb;
                color: #fff;
            }

            .vendas-button-secondary {
                background: #eef2f7;
                color: #263241;
            }

            .vendas-button-danger {
                background: #fee2e2;
                color: #b91c1c;
            }

            .vendas-items {
                overflow-x: auto;
            }

            .vendas-items table,
            .vendas-historico table {
                width: 100%;
                border-collapse: collapse;
                min-width: 650px;
            }

            .vendas-items th,
            .vendas-items td,
            .vendas-historico th,
            .vendas-historico td {
                padding: 10px 8px;
                border-bottom: 1px solid #edf0f3;
                text-align: left;
                font-size: 13px;
            }

            .vendas-items th,
            .vendas-historico th {
                font-weight: 700;
            }

            .vendas-total-box {
                display: flex;
                justify-content: flex-end;
                margin-top: 16px;
            }

            .vendas-totais {
                width: 100%;
                max-width: 360px;
                display: grid;
                gap: 8px;
            }

            .vendas-total-linha {
                display: flex;
                justify-content: space-between;
                gap: 20px;
            }

            .vendas-total-final {
                padding-top: 10px;
                margin-top: 5px;
                border-top: 2px solid #e5e7eb;
                font-size: 20px;
                font-weight: 800;
            }

            .vendas-acoes {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                flex-wrap: wrap;
                margin-top: 16px;
            }

            .vendas-vazia {
                padding: 22px;
                text-align: center;
                color: #6b7280;
            }

            .venda-status {
                display: inline-flex;
                padding: 4px 8px;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 700;
            }

            .venda-status-pago {
                background: #dcfce7;
                color: #166534;
            }

            .venda-status-pendente {
                background: #fef3c7;
                color: #92400e;
            }

            .venda-status-cancelada {
                background: #fee2e2;
                color: #991b1b;
            }

            .vendas-historico {
                overflow-x: auto;
            }

            @media (max-width: 700px) {

                .vendas-module,
                .vendas-card,
                .vendas-grid,
                .vendas-field {
                    width: 100%;
                    max-width: 100%;
                    min-width: 0;
                    box-sizing: border-box;
                }

                .vendas-grid {
                    grid-template-columns: 1fr;
                }

                .vendas-field-full {
                    grid-column: auto;
                }

                .vendas-card {
                    padding: 14px;
                }

                .vendas-card-title {
                    flex-wrap: wrap;
                    min-width: 0;
                }

                .vendas-card-title > div {
                    min-width: 0;
                }

                .vendas-field input,
                .vendas-field select,
                .vendas-field textarea,
                .vendas-button {
                    width: 100%;
                    max-width: 100%;
                    min-width: 0;
                    box-sizing: border-box;
                }

                .vendas-field .vendas-button {
                    display: block;
                    white-space: normal;
                    overflow-wrap: anywhere;
                }

                .vendas-acoes {
                    justify-content: stretch;
                    flex-direction: column;
                }

                .vendas-acoes .vendas-button {
                    flex: none;
                }

            }

        `;


        document.head.appendChild(
            style
        );

    }


    /* =====================================================
       RENDERIZAR INTERFACE
       ===================================================== */

    function renderizarInterfaceVendas() {

        const container =
            document.getElementById(
                "vendasContent"
            );


        if (!container) {

            return;

        }


        inserirEstiloVendas();


        const produtos =
            obterProdutosVenda();


        const clientes =
            obterClientesVenda();


        container.innerHTML = `

            <div class="vendas-module">

                <div class="vendas-card">

                    <div class="vendas-card-title">

                        <div>

                            <h2>Nova venda</h2>

                            <small>
                                Registre a venda e dê baixa automática no estoque.
                            </small>

                        </div>

                        <strong id="vendaNumeroPreview">
                            ${escaparVenda(
                                JCVendas.gerarNumero()
                            )}
                        </strong>

                    </div>


                    <div class="vendas-grid">

                        <div class="vendas-field vendas-field-full">

                            <label for="vendaCliente">
                                Cliente
                            </label>

                            <select id="vendaCliente">

                                <option value="">
                                    Cliente não informado
                                </option>

                                ${clientes.map(
                                    function (cliente) {

                                        return `
                                            <option value="${escaparVenda(
                                                cliente.id
                                            )}">
                                                ${escaparVenda(
                                                    cliente.nome
                                                )}
                                            </option>
                                        `;

                                    }
                                ).join("")}

                            </select>

                        </div>


                        <div class="vendas-field">

                            <label for="vendaProduto">
                                Produto
                            </label>

                            <select id="vendaProduto">

                                <option value="">
                                    Selecione um produto
                                </option>

                                ${produtos.map(
                                    function (produto) {

                                        const estoque =
                                            Number(
                                                produto.estoque
                                            ) || 0;


                                        return `
                                            <option
                                                value="${escaparVenda(
                                                    produto.id
                                                )}"
                                                ${
                                                    estoque <= 0
                                                        ? "disabled"
                                                        : ""
                                                }
                                            >
                                                ${escaparVenda(
                                                    produto.nome
                                                )}
                                                — Estoque: ${estoque}
                                            </option>
                                        `;

                                    }
                                ).join("")}

                            </select>

                        </div>


                        <div class="vendas-field">

                            <label for="vendaQuantidade">
                                Quantidade
                            </label>

                            <input
                                type="number"
                                id="vendaQuantidade"
                                min="0.01"
                                step="0.01"
                                value="1"
                            >

                        </div>


                        <div class="vendas-field">

                            <label for="vendaPreco">
                                Preço unitário
                            </label>

                            <input
                                type="number"
                                id="vendaPreco"
                                min="0"
                                step="0.01"
                                value="0"
                            >

                        </div>


                        <div class="vendas-field">

                            <label>
                                &nbsp;
                            </label>

                            <button
                                type="button"
                                class="vendas-button vendas-button-primary"
                                id="adicionarItemVenda"
                            >
                                + Adicionar produto
                            </button>

                        </div>

                    </div>

                </div>


                <div class="vendas-card">

                    <div class="vendas-card-title">

                        <h2>Itens da venda</h2>

                        <span id="vendasQuantidadeItens">
                            0 itens
                        </span>

                    </div>


                    <div
                        class="vendas-items"
                        id="vendasItensContainer"
                    ></div>

                </div>


                <div class="vendas-card">

                    <div class="vendas-grid">

                        <div class="vendas-field">

                            <label for="vendaDesconto">
                                Desconto
                            </label>

                            <input
                                type="number"
                                id="vendaDesconto"
                                min="0"
                                step="0.01"
                                value="0"
                            >

                        </div>


                        <div class="vendas-field">

                            <label for="vendaPagamento">
                                Forma de pagamento
                            </label>

                            <select id="vendaPagamento">

                                <option value="dinheiro">
                                    Dinheiro
                                </option>

                                <option value="pix">
                                    Pix
                                </option>

                                <option value="cartao">
                                    Cartão
                                </option>

                                <option value="prazo">
                                    Prazo
                                </option>

                            </select>

                        </div>


                        <div
                            class="vendas-field"
                            id="campoParcelasVenda"
                            hidden
                        >

                            <label for="vendaParcelas">
                                Parcelamento
                            </label>

                            <select id="vendaParcelas">
                                <option value="1">1x</option>
                                <option value="2">2x</option>
                                <option value="3">3x</option>
                                <option value="4">4x</option>
                                <option value="5">5x</option>
                                <option value="6">6x</option>
                                <option value="7">7x</option>
                                <option value="8">8x</option>
                                <option value="9">9x</option>
                                <option value="10">10x</option>
                                                                                            </select>

                        </div>


                        <div
                            class="vendas-field"
                            id="campoPrimeiraParcelaVenda"
                            hidden
                        >

                            <label for="vendaPrimeiraParcela">
                                Data da 1ª parcela
                            </label>

                            <input
                                type="date"
                                id="vendaPrimeiraParcela"
                            >

                        </div>


                        <div
                            class="vendas-field"
                            id="campoVencimentoVenda"
                            hidden
                        >

                            <label for="vendaVencimento">
                                Vencimento
                            </label>

                            <input
                                type="date"
                                id="vendaVencimento"
                            >

                        </div>


                        <div class="vendas-field">

                            <label for="vendaGarantia">
                                Garantia
                            </label>

                            <select id="vendaGarantia">

                                <option value="">
                                    Sem garantia / não informado
                                </option>

                                <option value="7 dias">
                                    7 dias
                                </option>

                                <option value="15 dias">
                                    15 dias
                                </option>

                                <option value="30 dias">
                                    30 dias
                                </option>

                                <option value="60 dias">
                                    60 dias
                                </option>

                                <option value="90 dias">
                                    90 dias
                                </option>

                                <option value="180 dias">
                                    180 dias
                                </option>

                                <option value="1 ano">
                                    1 ano
                                </option>

                                <option value="personalizada">
                                    Personalizada
                                </option>

                            </select>

                        </div>


                        <div class="vendas-field">

                            <label for="vendaNumeroNF">
                                N° N.F
                            </label>

                            <input
                                type="text"
                                id="vendaNumeroNF"
                                placeholder="Número da N.F"
                                inputmode="numeric"
                                autocomplete="off"
                            >

                        </div>


                        <div
                            class="vendas-field"
                            id="campoGarantiaPersonalizada"
                            hidden
                        >

                            <label for="vendaGarantiaPersonalizada">
                                Período de garantia
                            </label>

                            <input
                                type="text"
                                id="vendaGarantiaPersonalizada"
                                placeholder="Ex.: 45 dias"
                                autocomplete="off"
                            >

                        </div>


                        <div class="vendas-field vendas-field-full">

                            <label for="vendaObservacoes">
                                Observações
                            </label>

                            <textarea
                                id="vendaObservacoes"
                                rows="3"
                                placeholder="Observações da venda..."
                            ></textarea>

                        </div>

                    </div>


                    <div class="vendas-total-box">

                        <div class="vendas-totais">

                            <div class="vendas-total-linha">

                                <span>
                                    Subtotal
                                </span>

                                <strong id="vendaSubtotal">
                                    R$ 0,00
                                </strong>

                            </div>


                            <div class="vendas-total-linha">

                                <span>
                                    Desconto
                                </span>

                                <strong id="vendaDescontoResumo">
                                    R$ 0,00
                                </strong>

                            </div>


                            <div
                                class="vendas-total-linha vendas-total-final"
                            >

                                <span>
                                    Total
                                </span>

                                <strong id="vendaTotal">
                                    R$ 0,00
                                </strong>

                            </div>

                        </div>

                    </div>


                    <div class="vendas-acoes">

                        <button
                            type="button"
                            class="vendas-button vendas-button-secondary"
                            id="limparVenda"
                        >
                            Limpar
                        </button>


                        <button
                            type="button"
                            class="vendas-button vendas-button-primary"
                            id="finalizarVenda"
                        >
                            Finalizar venda
                        </button>

                    </div>

                </div>


                <div class="jc-folder vendas-historico-folder">

                    <button
                        type="button"
                        class="jc-folder-toggle"
                        id="abrirPastaVendas"
                        aria-expanded="false"
                    >
                        <span class="jc-folder-icon">📁</span>
                        <span class="jc-folder-info">
                            <strong>Histórico de vendas</strong>
                            <small><b id="vendasTotalPasta">0</b> vendas registradas</small>
                        </span>
                        <span class="jc-folder-arrow" id="setaPastaVendas">›</span>
                    </button>

                    <div class="jc-folder-content" id="conteudoPastaVendas" hidden>
                        <div class="jc-folder-content-head">
                            <div>
                                <h2>Histórico de vendas</h2>
                                <p>Vendas registradas neste dispositivo.</p>
                            </div>
                            <button type="button" class="jc-folder-close" id="fecharPastaVendas">Fechar</button>
                        </div>
                        <div class="jc-folder-body">
                            <div class="vendas-historico" id="historicoVendas"></div>
                        </div>
                    </div>

                </div>

            </div>

        `;


        itensVendaTela = [];


        configurarEventosInterfaceVendas();

        atualizarItensTelaVenda();

        atualizarHistoricoVendas();

        const pasta = document.getElementById("abrirPastaVendas");
        const conteudoPasta = document.getElementById("conteudoPastaVendas");
        const fecharPasta = document.getElementById("fecharPastaVendas");
        const setaPasta = document.getElementById("setaPastaVendas");
        if (pasta && conteudoPasta && !pasta.dataset.configurada) {
            pasta.dataset.configurada = "1";
            pasta.addEventListener("click", function(){ conteudoPasta.hidden=false; pasta.setAttribute("aria-expanded","true"); if(setaPasta)setaPasta.classList.add("aberta"); });
            if (fecharPasta) fecharPasta.addEventListener("click", function(){ conteudoPasta.hidden=true; pasta.setAttribute("aria-expanded","false"); if(setaPasta)setaPasta.classList.remove("aberta"); });
        }

    }


    /* =====================================================
       ATUALIZAR CLIENTES
       ===================================================== */

    function atualizarClientesVenda() {

        const select =
            document.getElementById(
                "vendaCliente"
            );


        if (!select) {

            return;

        }


        const valorAtual =
            select.value;


        const clientes =
            obterClientesVenda();


        select.innerHTML = `

            <option value="">
                Cliente não informado
            </option>

            ${clientes.map(
                function (cliente) {

                    return `
                        <option
                            value="${escaparVenda(
                                cliente.id
                            )}"
                        >
                            ${escaparVenda(
                                cliente.nome
                            )}
                        </option>
                    `;

                }
            ).join("")}

        `;


        const clienteAindaExiste =
            clientes.some(
                function (cliente) {

                    return String(
                        cliente.id
                    ) === String(
                        valorAtual
                    );

                }
            );


        if (
            clienteAindaExiste
        ) {

            select.value =
                valorAtual;

        }

    }


    /* =====================================================
       ATUALIZAR PRODUTOS
       ===================================================== */

    function atualizarProdutosVenda() {

        const select =
            document.getElementById(
                "vendaProduto"
            );


        if (!select) {

            return;

        }


        const valorAtual =
            select.value;


        const produtos =
            obterProdutosVenda();


        select.innerHTML = `

            <option value="">
                Selecione um produto
            </option>

            ${produtos.map(
                function (produto) {

                    const estoque =
                        Number(
                            produto.estoque
                        ) || 0;


                    return `
                        <option
                            value="${escaparVenda(
                                produto.id
                            )}"
                            ${
                                estoque <= 0
                                    ? "disabled"
                                    : ""
                            }
                        >
                            ${escaparVenda(
                                produto.nome
                            )}
                            — Estoque: ${estoque}
                        </option>
                    `;

                }
            ).join("")}

        `;


        const produtoAindaExiste =
            produtos.some(
                function (produto) {

                    return String(
                        produto.id
                    ) === String(
                        valorAtual
                    );

                }
            );


        if (
            produtoAindaExiste
        ) {

            select.value =
                valorAtual;

            atualizarPrecoProdutoVenda();

        }

    }


    /* =====================================================
       ATUALIZAR PREÇO
       ===================================================== */

    function atualizarPrecoProdutoVenda() {

        const select =
            document.getElementById(
                "vendaProduto"
            );


        const campoPreco =
            document.getElementById(
                "vendaPreco"
            );


        if (
            !select ||
            !campoPreco
        ) {

            return;

        }


        const produto =
            JCProdutos.buscarPorId(
                select.value
            );


        if (!produto) {

            campoPreco.value =
                "0";

            return;

        }


        campoPreco.value =
            Number(
                produto.precoVenda
            ) || 0;

    }


    /* =====================================================
       ADICIONAR ITEM
       ===================================================== */

    function adicionarItemVendaTela() {

        const produtoSelect =
            document.getElementById(
                "vendaProduto"
            );


        const quantidadeCampo =
            document.getElementById(
                "vendaQuantidade"
            );


        const precoCampo =
            document.getElementById(
                "vendaPreco"
            );


        if (
            !produtoSelect ||
            !quantidadeCampo ||
            !precoCampo
        ) {

            return;

        }


        const produto =
            JCProdutos.buscarPorId(
                produtoSelect.value
            );


        if (!produto) {

            alert(
                "Selecione um produto."
            );

            return;

        }


        const quantidade =
            numeroVenda(
                quantidadeCampo.value
            );


        if (
            quantidade <= 0
        ) {

            alert(
                "Informe uma quantidade válida."
            );

            return;

        }


        const estoque =
            Number(
                produto.estoque
            ) || 0;


        if (
            quantidade >
            estoque
        ) {

            alert(
                "Quantidade maior que o estoque disponível.\n\n" +
                "Disponível: " +
                estoque
            );

            return;

        }


        const preco =
            numeroVenda(
                precoCampo.value
            );


        if (
            preco < 0
        ) {

            alert(
                "Informe um preço válido."
            );

            return;

        }


        const existente =
            itensVendaTela.find(
                function (item) {

                    return String(
                        item.produtoId
                    ) === String(
                        produto.id
                    );

                }
            );


        if (
            existente
        ) {

            const novaQuantidade =
                Number(
                    existente.quantidade
                ) +
                quantidade;


            if (
                novaQuantidade >
                estoque
            ) {

                alert(
                    "A quantidade total deste produto ultrapassa o estoque disponível."
                );

                return;

            }


            existente.quantidade =
                novaQuantidade;


            existente.valorUnitario =
                preco;


            existente.subtotal =
                JCVendas.arredondar(
                    novaQuantidade *
                    preco
                );

        } else {

            itensVendaTela.push({

                produtoId:
                    produto.id,

                codigo:
                    produto.codigo || "",

                nome:
                    produto.nome || "",

                quantidade:
                    quantidade,

                valorCusto:
                    Number(
                        produto.precoCusto
                    ) || 0,

                valorUnitario:
                    preco,

                subtotal:
                    JCVendas.arredondar(
                        quantidade *
                        preco
                    )

            });

        }


        quantidadeCampo.value =
            "1";


        produtoSelect.value =
            "";


        precoCampo.value =
            "0";


        atualizarItensTelaVenda();

    }


    /* =====================================================
       REMOVER ITEM
       ===================================================== */

    function removerItemVendaTela(indice) {

        if (
            indice < 0 ||
            indice >= itensVendaTela.length
        ) {

            return;

        }


        itensVendaTela.splice(
            indice,
            1
        );


        atualizarItensTelaVenda();

    }


    /* =====================================================
       ATUALIZAR ITENS
       ===================================================== */

    function atualizarItensTelaVenda() {

        const container =
            document.getElementById(
                "vendasItensContainer"
            );


        const contador =
            document.getElementById(
                "vendasQuantidadeItens"
            );


        if (!container) {

            return;

        }


        if (contador) {

            contador.textContent =
                itensVendaTela.length +
                (
                    itensVendaTela.length === 1
                        ? " item"
                        : " itens"
                );

        }

        atualizarContadorPastaVendas();

        if (
            itensVendaTela.length === 0
        ) {

            container.innerHTML = `

                <div class="vendas-vazia">
                    Nenhum produto adicionado à venda.
                </div>

            `;


            atualizarTotaisVenda();

            return;

        }


        container.innerHTML = `

            <table>

                <thead>

                    <tr>

                        <th>
                            Produto
                        </th>

                        <th>
                            Qtd.
                        </th>

                        <th>
                            Unitário
                        </th>

                        <th>
                            Subtotal
                        </th>

                        <th>
                            Ação
                        </th>

                    </tr>

                </thead>

                <tbody>

                    ${itensVendaTela.map(
                        function (
                            item,
                            indice
                        ) {

                            return `

                                <tr>

                                    <td>

                                        <strong>
                                            ${escaparVenda(
                                                item.nome
                                            )}
                                        </strong>

                                        <br>

                                        <small>
                                            ${escaparVenda(
                                                item.codigo
                                            )}
                                        </small>

                                    </td>

                                    <td>
                                        ${item.quantidade}
                                    </td>

                                    <td>
                                        ${moedaVenda(
                                            item.valorUnitario
                                        )}
                                    </td>

                                    <td>
                                        ${moedaVenda(
                                            item.subtotal
                                        )}
                                    </td>

                                    <td>

                                        <button
                                            type="button"
                                            class="vendas-button vendas-button-danger"
                                            data-remover-item-venda="${indice}"
                                        >
                                            Remover
                                        </button>

                                    </td>

                                </tr>

                            `;

                        }
                    ).join("")}

                </tbody>

            </table>

        `;


        atualizarTotaisVenda();

    }


    /* =====================================================
       ATUALIZAR TOTAIS
       ===================================================== */

    function atualizarTotaisVenda() {

        const subtotal =
            JCVendas.calcularSubtotal(
                itensVendaTela
            );


        const campoDesconto =
            document.getElementById(
                "vendaDesconto"
            );


        const desconto =
            numeroVenda(
                campoDesconto
                    ? campoDesconto.value
                    : 0
            );


        const descontoAplicado =
            Math.min(
                Math.max(
                    desconto,
                    0
                ),
                subtotal
            );


        const total =
            Math.max(
                subtotal -
                descontoAplicado,
                0
            );


        const elementoSubtotal =
            document.getElementById(
                "vendaSubtotal"
            );


        const elementoDesconto =
            document.getElementById(
                "vendaDescontoResumo"
            );


        const elementoTotal =
            document.getElementById(
                "vendaTotal"
            );


        if (
            elementoSubtotal
        ) {

            elementoSubtotal.textContent =
                moedaVenda(
                    subtotal
                );

        }


        if (
            elementoDesconto
        ) {

            elementoDesconto.textContent =
                moedaVenda(
                    descontoAplicado
                );

        }


        if (
            elementoTotal
        ) {

            elementoTotal.textContent =
                moedaVenda(
                    total
                );

        }

    }


    /* =====================================================
       PAGAMENTO / PARCELAMENTO
       ===================================================== */

    function dataLocalISO(offsetDias = 0) {
        const d = new Date();
        d.setDate(d.getDate() + Number(offsetDias || 0));
        return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
    }

    function dataValidaISO(data) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data || ""))) {
            return false;
        }
        const [ano, mes, dia] = String(data).split("-").map(Number);
        const teste = new Date(ano, mes - 1, dia, 12, 0, 0);
        return teste.getFullYear() === ano &&
            teste.getMonth() === mes - 1 &&
            teste.getDate() === dia;
    }

    function formatarDataISO(d) {
        return d.getFullYear() + "-" +
            String(d.getMonth() + 1).padStart(2, "0") + "-" +
            String(d.getDate()).padStart(2, "0");
    }

    function adicionarMesesPreservandoDia(dataBase, meses) {
        const original = new Date(dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate(), 12, 0, 0);
        const diaOriginal = original.getDate();
        const destinoMes = original.getMonth() + Number(meses || 0);
        const ultimoDia = new Date(original.getFullYear(), destinoMes + 1, 0, 12, 0, 0).getDate();
        return new Date(original.getFullYear(), destinoMes, Math.min(diaOriginal, ultimoDia), 12, 0, 0);
    }

    function gerarParcelas(total, quantidade, primeiraData) {
        const qtd = Math.max(1, Number(quantidade) || 1);
        const valorTotal = Math.round((Number(total) || 0) * 100) / 100;
        const valorBase = Math.floor((valorTotal / qtd) * 100) / 100;
        const resto = Math.round((valorTotal - valorBase * qtd) * 100) / 100;
        const parcelas = [];
        const base = primeiraData || dataLocalISO(30);
        if (!dataValidaISO(base)) return [];
        const inicio = new Date(base + "T12:00:00");
        for (let i = 0; i < qtd; i++) {
            const data = adicionarMesesPreservandoDia(inicio, i);
            parcelas.push({
                numero: i + 1,
                valor: Number((valorBase + (i === qtd - 1 ? resto : 0)).toFixed(2)),
                vencimento: formatarDataISO(data)
            });
        }
        return parcelas;
    }

    /* =====================================================
       VENCIMENTO / PARCELAMENTO
       ===================================================== */

    function atualizarCampoVencimentoVenda() {
        const pagamento = document.getElementById("vendaPagamento");
        const campoPrazo = document.getElementById("campoVencimentoVenda");
        const vencimento = document.getElementById("vendaVencimento");
        const campoParcelas = document.getElementById("campoParcelasVenda");
        const parcelas = document.getElementById("vendaParcelas");
        const campoPrimeira = document.getElementById("campoPrimeiraParcelaVenda");
        const primeira = document.getElementById("vendaPrimeiraParcela");
        if (!pagamento) return;
        const prazo = pagamento.value === "prazo";
        const cartao = pagamento.value === "cartao";
        const parcelado = prazo || cartao;
        if (campoPrazo) campoPrazo.hidden = true;
        if (campoParcelas) campoParcelas.hidden = !parcelado;
        if (campoPrimeira) campoPrimeira.hidden = !parcelado;
        if (parcelado && primeira && !primeira.value) primeira.value = dataLocalISO(30);
        if (!parcelado && primeira) primeira.value = "";
        if (!parcelado && parcelas) parcelas.value = "1";
        if (vencimento) vencimento.value = parcelado && primeira ? primeira.value : "";
    }


    /* =====================================================
       LIMPAR
       ===================================================== */

    function limparVendaTela() {

        itensVendaTela = [];


        const cliente =
            document.getElementById(
                "vendaCliente"
            );


        const produto =
            document.getElementById(
                "vendaProduto"
            );


        const quantidade =
            document.getElementById(
                "vendaQuantidade"
            );


        const preco =
            document.getElementById(
                "vendaPreco"
            );


        const desconto =
            document.getElementById(
                "vendaDesconto"
            );


        const pagamento =
            document.getElementById(
                "vendaPagamento"
            );


        const vencimento =
            document.getElementById(
                "vendaVencimento"
            );

        const parcelas =
            document.getElementById(
                "vendaParcelas"
            );

        const primeiraParcela =
            document.getElementById(
                "vendaPrimeiraParcela"
            );


        const observacoes =
            document.getElementById(
                "vendaObservacoes"
            );

        const garantia =
            document.getElementById("vendaGarantia");
        const garantiaPersonalizada =
            document.getElementById("vendaGarantiaPersonalizada");
        const numeroNF =
            document.getElementById("vendaNumeroNF");


        if (cliente) {

            cliente.value =
                "";

        }


        if (produto) {

            produto.value =
                "";

        }


        if (quantidade) {

            quantidade.value =
                "1";

        }


        if (preco) {

            preco.value =
                "0";

        }


        if (desconto) {

            desconto.value =
                "0";

        }


        if (pagamento) {

            pagamento.value =
                "dinheiro";

        }


        if (vencimento) {

            vencimento.value =
                "";

        }


        if (observacoes) {

            observacoes.value =
                "";

        }

        if (garantia) garantia.value = "";
        if (garantiaPersonalizada) {
            garantiaPersonalizada.value = "";
            garantiaPersonalizada.hidden = false;
        }
        const campoGarantiaPersonalizada =
            document.getElementById("campoGarantiaPersonalizada");
        if (campoGarantiaPersonalizada) {
            campoGarantiaPersonalizada.hidden = true;
        }
        if (numeroNF) numeroNF.value = "";


        atualizarCampoVencimentoVenda();

        atualizarItensTelaVenda();


        const numero =
            document.getElementById(
                "vendaNumeroPreview"
            );


        if (numero) {

            numero.textContent =
                JCVendas.gerarNumero();

        }


        atualizarClientesVenda();

        atualizarProdutosVenda();

    }


    /* =====================================================
       FINALIZAR VENDA
       ===================================================== */

    function finalizarVendaTela() {

        if (
            itensVendaTela.length === 0
        ) {

            alert(
                "Adicione pelo menos um produto à venda."
            );

            return;

        }


        const cliente =
            document.getElementById(
                "vendaCliente"
            );


        const desconto =
            document.getElementById(
                "vendaDesconto"
            );


        const pagamento =
            document.getElementById(
                "vendaPagamento"
            );


        const vencimento =
            document.getElementById(
                "vendaVencimento"
            );


        const campoParcelas =
            document.getElementById(
                "vendaParcelas"
            );

        const campoPrimeiraParcela =
            document.getElementById(
                "vendaPrimeiraParcela"
            );


        const observacoes =
            document.getElementById(
                "vendaObservacoes"
            );

        const garantia =
            document.getElementById("vendaGarantia");
        const garantiaPersonalizada =
            document.getElementById("vendaGarantiaPersonalizada");
        const numeroNF =
            document.getElementById("vendaNumeroNF");

        const garantiaValor =
            garantia && garantia.value === "personalizada"
                ? (garantiaPersonalizada ? garantiaPersonalizada.value.trim() : "")
                : (garantia ? garantia.value : "");

        if (garantia && garantia.value === "personalizada" && !garantiaValor) {
            alert("Informe o período de garantia personalizado.");
            if (garantiaPersonalizada) garantiaPersonalizada.focus();
            return;
        }


        const dados = {

            clienteId:
                cliente
                    ? cliente.value
                    : "",

            itens:
                itensVendaTela.map(
                    function (item) {

                        return {

                            produtoId:
                                item.produtoId,

                            quantidade:
                                item.quantidade,

                            valorUnitario:
                                item.valorUnitario

                        };

                    }
                ),

            desconto:
                desconto
                    ? numeroVenda(
                        desconto.value
                    )
                    : 0,

            formaPagamento:
                pagamento
                    ? pagamento.value
                    : "dinheiro",

            vencimento:
                vencimento
                    ? vencimento.value
                    : null,

            parcelas:
                pagamento && (pagamento.value === "cartao" || pagamento.value === "prazo")
                    ? Math.max(1, Number(campoParcelas ? campoParcelas.value : 1))
                    : 1,

            primeiraParcela:
                pagamento && (pagamento.value === "cartao" || pagamento.value === "prazo")
                    ? (campoPrimeiraParcela ? campoPrimeiraParcela.value : null)
                    : null,

            observacoes:
                observacoes
                    ? observacoes.value
                    : "",

            garantia:
                garantiaValor,

            numeroNF:
                numeroNF
                    ? numeroNF.value.trim()
                    : ""

        };


        const total =
            JCVendas.calcularTotal(
                itensVendaTela,
                dados.desconto
            );


        if (
            total <= 0
        ) {

            alert(
                "O total da venda precisa ser maior que zero."
            );

            return;

        }


        const formaTexto =
            dados.formaPagamento === "pix"
                ? "Pix"
                : dados.formaPagamento === "cartao"
                    ? "Cartão"
                    : dados.formaPagamento === "prazo"
                        ? "Prazo"
                        : "Dinheiro";


        const confirmar =
            confirm(
                "Confirmar venda?\n\n" +
                "Total: " +
                moedaVenda(
                    total
                ) +
                "\n" +
                "Pagamento: " +
                formaTexto +
                ((dados.formaPagamento === "cartao" || dados.formaPagamento === "prazo") ? "\nParcelamento: " + dados.parcelas + "x" : "") +
                ((dados.formaPagamento === "cartao" || dados.formaPagamento === "prazo") && dados.primeiraParcela ? "\nInício: " + new Date(dados.primeiraParcela + "T12:00:00").toLocaleDateString("pt-BR") : "")
            );


        if (!confirmar) {

            return;

        }


        const resultado =
            JCVendas.registrar(
                dados
            );


        if (
            !resultado ||
            !resultado.sucesso
        ) {

            alert(
                resultado &&
                resultado.mensagem
                    ? resultado.mensagem
                    : "Não foi possível registrar a venda."
            );

            return;

        }


        /* Abre automaticamente o recibo timbrado da venda.
           O recibo é uma página pronta para imprimir ou
           usar a opção "Salvar como PDF" do navegador. */
        let reciboAberto = false;

        if (
            window.JCRecibo &&
            typeof window.JCRecibo.abrir === "function"
        ) {
            const resultadoRecibo =
                window.JCRecibo.abrir(
                    resultado.venda.id
                );

            reciboAberto = !!(
                resultadoRecibo &&
                resultadoRecibo.sucesso
            );
        }

        alert(
            resultado.mensagem +
            "\n\nTotal: " +
            moedaVenda(
                resultado.venda.total
            ) +
            (reciboAberto
                ? "\n\nO recibo foi aberto para impressão ou PDF."
                : "\n\nNão foi possível abrir o recibo automaticamente. Você poderá abri-lo pelo histórico de vendas.")
        );


        limparVendaTela();

        atualizarHistoricoVendas();
        atualizarContadorPastaVendas();


        if (
            window.JCApp &&
            typeof window.JCApp
                .atualizarDashboard ===
                "function"
        ) {

            window.JCApp.atualizarDashboard();

        }

    }


    /* =====================================================
       CONTADOR DA PASTA DE HISTÓRICO
       ===================================================== */

    function atualizarContadorPastaVendas() {

        const elemento =
            document.getElementById(
                "vendasTotalPasta"
            );

        if (!elemento) {
            return;
        }

        const total =
            JCVendas.listar().length;

        elemento.textContent =
            String(total);

    }


    /* =====================================================
       HISTÓRICO
       ===================================================== */

    function atualizarHistoricoVendas() {

        const container =
            document.getElementById(
                "historicoVendas"
            );


        if (!container) {

            return;

        }

        atualizarContadorPastaVendas();

        const vendas =
            JCVendas.listar()
                .slice()
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
                );


        if (
            vendas.length === 0
        ) {

            container.innerHTML = `

                <div class="vendas-vazia">
                    Nenhuma venda registrada ainda.
                </div>

            `;

            return;

        }


        container.innerHTML = `

            <table>

                <thead>

                    <tr>

                        <th>
                            Nº
                        </th>

                        <th>
                            Data
                        </th>

                        <th>
                            Cliente
                        </th>

                        <th>
                            Pagamento
                        </th>

                        <th>
                            Total
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Ação
                        </th>

                    </tr>

                </thead>

                <tbody>

                    ${vendas.map(
                        function (venda) {

                            const cancelada =
                                venda.status ===
                                "cancelada";


                            const pagamento =
                                venda.formaPagamento === "pix"
                                    ? "Pix"
                                    : venda.formaPagamento === "cartao"
                                        ? "Cartão"
                                        : venda.formaPagamento === "prazo"
                                            ? "Prazo"
                                            : "Dinheiro";


                            const statusClasse =
                                cancelada
                                    ? "venda-status-cancelada"
                                    : venda.status === "pendente"
                                        ? "venda-status-pendente"
                                        : "venda-status-pago";


                            const statusTexto =
                                cancelada
                                    ? "Cancelada"
                                    : venda.status === "pendente"
                                        ? "Pendente"
                                        : "Pago";


                            let dataTexto =
                                "--";


                            if (
                                venda.data
                            ) {

                                const data =
                                    new Date(
                                        venda.data
                                    );


                                if (
                                    !Number.isNaN(
                                        data.getTime()
                                    )
                                ) {

                                    dataTexto =
                                        data.toLocaleDateString(
                                            "pt-BR"
                                        );

                                }

                            }


                            return `

                                <tr>

                                    <td>
                                        <strong>
                                            ${escaparVenda(
                                                venda.numero
                                            )}
                                        </strong>
                                    </td>

                                    <td>
                                        ${dataTexto}
                                    </td>

                                    <td>
                                        ${escaparVenda(
                                            venda.clienteNome ||
                                            "Não informado"
                                        )}
                                    </td>

                                    <td>
                                        ${pagamento}
                                        ${venda.formaPagamento === "cartao" && Number(venda.parcelas) > 1 ? `<small class="historico-subinfo">${Number(venda.parcelas)}x${venda.primeiraParcela ? ` · 1ª ${new Date(venda.primeiraParcela + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}</small>` : ""}
                                        ${venda.formaPagamento === "prazo" && Number(venda.parcelas) > 0 ? `<small class="historico-subinfo">${Number(venda.parcelas)}x${venda.primeiraParcela ? ` · início ${new Date(venda.primeiraParcela + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}</small>` : ""}
                                    </td>

                                    <td>
                                        <strong>
                                            ${moedaVenda(
                                                venda.total
                                            )}
                                        </strong>
                                    </td>

                                    <td>

                                        <span
                                            class="venda-status ${statusClasse}"
                                        >
                                            ${statusTexto}
                                        </span>

                                    </td>

                                    <td>

                                        ${
                                            cancelada
                                                ? `
                                                    <span>
                                                        —
                                                    </span>
                                                  `
                                                : `
                                                    <div class="vendas-acoes-historico">

                                                        <button
                                                            type="button"
                                                            class="vendas-button vendas-button-secondary"
                                                            data-recibo-venda="${escaparVenda(
                                                                venda.id
                                                            )}"
                                                        >
                                                            Recibo
                                                        </button>

                                                        <button
                                                            type="button"
                                                            class="vendas-button vendas-button-danger"
                                                            data-cancelar-venda="${escaparVenda(
                                                                venda.id
                                                            )}"
                                                        >
                                                            Cancelar
                                                        </button>

                                                    </div>
                                                  `
                                        }

                                    </td>

                                </tr>

                            `;

                        }
                    ).join("")}

                </tbody>

            </table>

        `;

    }


    /* =====================================================
       CANCELAR PELA INTERFACE
       ===================================================== */

    function cancelarVendaTela(id) {

        const venda =
            JCVendas.buscarPorId(
                id
            );


        if (!venda) {

            alert(
                "Venda não encontrada."
            );

            return;

        }


        if (
            venda.status ===
            "cancelada"
        ) {

            alert(
                "Esta venda já foi cancelada."
            );

            return;

        }


        const confirmar =
            confirm(
                "Deseja cancelar a venda " +
                venda.numero +
                "?\n\n" +
                "Valor: " +
                moedaVenda(
                    venda.total
                ) +
                "\n\n" +
                "Os produtos voltarão para o estoque."
            );


        if (!confirmar) {

            return;

        }


        const resultado =
            JCVendas.cancelar(
                id
            );


        alert(
            resultado.mensagem
        );


        if (
            resultado.sucesso
        ) {

            atualizarHistoricoVendas();
            atualizarContadorPastaVendas();


            if (
                window.JCApp &&
                typeof window.JCApp
                    .atualizarDashboard ===
                    "function"
            ) {

                window.JCApp.atualizarDashboard();

            }

        }

    }


    /* =====================================================
       EVENTOS DA INTERFACE
       ===================================================== */

    function configurarEventosInterfaceVendas() {

        /* ---------------------------------------------
           ELEMENTOS
           --------------------------------------------- */

        const produto =
            document.getElementById(
                "vendaProduto"
            );


        const cliente =
            document.getElementById(
                "vendaCliente"
            );


        const adicionar =
            document.getElementById(
                "adicionarItemVenda"
            );


        const desconto =
            document.getElementById(
                "vendaDesconto"
            );


        const pagamento =
            document.getElementById(
                "vendaPagamento"
            );

        const garantia =
            document.getElementById("vendaGarantia");
        const garantiaPersonalizada =
            document.getElementById("vendaGarantiaPersonalizada");

        const campoGarantiaPersonalizada =
            document.getElementById("campoGarantiaPersonalizada");

        if (garantia) {
            garantia.addEventListener("change", function () {
                const personalizada = garantia.value === "personalizada";

                if (campoGarantiaPersonalizada) {
                    campoGarantiaPersonalizada.hidden = !personalizada;
                }

                if (garantiaPersonalizada) {
                    garantiaPersonalizada.hidden = false;
                    if (!personalizada) {
                        garantiaPersonalizada.value = "";
                    }
                }
            });
        }


        const finalizar =
            document.getElementById(
                "finalizarVenda"
            );


        const limpar =
            document.getElementById(
                "limparVenda"
            );


        /* ---------------------------------------------
           CLIENTE
           --------------------------------------------- */

        if (cliente) {

            cliente.addEventListener(
                "focus",
                function () {

                    atualizarClientesVenda();

                }
            );


            cliente.addEventListener(
                "click",
                function () {

                    atualizarClientesVenda();

                }
            );

        }


        /* ---------------------------------------------
           PRODUTO
           --------------------------------------------- */

        if (produto) {

            produto.addEventListener(
                "change",
                function () {

                    atualizarPrecoProdutoVenda();

                }
            );


            produto.addEventListener(
                "focus",
                function () {

                    atualizarProdutosVenda();

                }
            );

        }


        /* ---------------------------------------------
           ADICIONAR
           --------------------------------------------- */

        if (adicionar) {

            adicionar.addEventListener(
                "click",
                function () {

                    adicionarItemVendaTela();

                }
            );

        }


        /* ---------------------------------------------
           DESCONTO
           --------------------------------------------- */

        if (desconto) {

            desconto.addEventListener(
                "input",
                function () {

                    atualizarTotaisVenda();

                }
            );

        }


        /* ---------------------------------------------
           PAGAMENTO
           --------------------------------------------- */

        if (pagamento) {

            pagamento.addEventListener(
                "change",
                function () {

                    atualizarCampoVencimentoVenda();

                }
            );

        }


        /* ---------------------------------------------
           FINALIZAR
           --------------------------------------------- */

        if (finalizar) {

            finalizar.addEventListener(
                "click",
                function () {

                    finalizarVendaTela();

                }
            );

        }


        /* ---------------------------------------------
           LIMPAR
           --------------------------------------------- */

        if (limpar) {

            limpar.addEventListener(
                "click",
                function () {

                    const confirmar =
                        confirm(
                            "Limpar os dados da venda atual?"
                        );


                    if (
                        confirmar
                    ) {

                        limparVendaTela();

                    }

                }
            );

        }


        /* ---------------------------------------------
           REMOVER ITEM / CANCELAR VENDA
           --------------------------------------------- */

        document.addEventListener(
            "click",
            function (evento) {

                const remover =
                    evento.target.closest(
                        "[data-remover-item-venda]"
                    );


                if (
                    remover
                ) {

                    const indice =
                        Number(
                            remover.dataset
                                .removerItemVenda
                        );


                    removerItemVendaTela(
                        indice
                    );


                    return;

                }


                const recibo =
                    evento.target.closest(
                        "[data-recibo-venda]"
                    );

                if (recibo) {

                    const resultadoRecibo =
                        window.JCRecibo &&
                        typeof window.JCRecibo.abrir === "function"
                            ? window.JCRecibo.abrir(
                                recibo.dataset.reciboVenda
                              )
                            : null;

                    if (resultadoRecibo && !resultadoRecibo.sucesso) {
                        alert(resultadoRecibo.mensagem || "Não foi possível abrir o recibo.");
                    }

                    return;
                }


                const cancelar =
                    evento.target.closest(
                        "[data-cancelar-venda]"
                    );


                if (
                    cancelar
                ) {

                    cancelarVendaTela(
                        cancelar.dataset
                            .cancelarVenda
                    );

                }

            }
        );


        /* ---------------------------------------------
           CARGA INICIAL
           --------------------------------------------- */

        atualizarClientesVenda();

        atualizarProdutosVenda();

        atualizarCampoVencimentoVenda();

    }


    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    function inicializarInterfaceVendas() {

        renderizarInterfaceVendas();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            inicializarInterfaceVendas
        );

    } else {

        inicializarInterfaceVendas();

    }


    /* =====================================================
       DISPONIBILIZAR GLOBALMENTE
       ===================================================== */

    window.JCVendas =
        JCVendas;

    /* Permite que atalhos e outras áreas do sistema
       atualizem a interface de vendas sem duplicar lógica. */
    window.JCVendas.atualizarInterface =
        renderizarInterfaceVendas;


})();