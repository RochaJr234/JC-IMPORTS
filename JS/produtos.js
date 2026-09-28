/* =========================================================
   J.C IMPORTS 2.0
   MÓDULO DE PRODUTOS E ESTOQUE
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


    /* =====================================================
       OBJETO PRINCIPAL
       ===================================================== */

    const JCProdutos = {


        /* =================================================
           LISTAR PRODUTOS
           ================================================= */

        listar: function () {

            return JCStorage.obterProdutos();

        },


        /* =================================================
           BUSCAR POR ID
           ================================================= */

        buscarPorId: function (id) {

            const produtos =
                this.listar();

            return produtos.find(function (produto) {

                return produto.id === id;

            }) || null;

        },


        /* =================================================
           BUSCAR POR CÓDIGO
           ================================================= */

        buscarPorCodigo: function (codigo) {

            const produtos =
                this.listar();

            codigo =
                String(codigo || "")
                    .trim()
                    .toLowerCase();


            return produtos.find(function (produto) {

                return String(
                    produto.codigo || ""
                )
                    .trim()
                    .toLowerCase() === codigo;

            }) || null;

        },


        /* =================================================
           PESQUISAR
           ================================================= */

        pesquisar: function (termo) {

            const produtos =
                this.listar();


            termo =
                String(termo || "")
                    .trim()
                    .toLowerCase();


            if (!termo) {

                return produtos;

            }


            return produtos.filter(function (produto) {

                const nome =
                    String(
                        produto.nome || ""
                    ).toLowerCase();


                const codigo =
                    String(
                        produto.codigo || ""
                    ).toLowerCase();


                const categoria =
                    String(
                        produto.categoria || ""
                    ).toLowerCase();


                return (
                    nome.includes(termo) ||
                    codigo.includes(termo) ||
                    categoria.includes(termo)
                );

            });

        },


        /* =================================================
           GERAR CÓDIGO
           ================================================= */

        gerarCodigo: function () {

            const produtos =
                this.listar();


            let maiorNumero = 0;


            produtos.forEach(function (produto) {

                const codigo =
                    String(
                        produto.codigo || ""
                    );


                const numero =
                    parseInt(
                        codigo.replace(/\D/g, ""),
                        10
                    );


                if (
                    !isNaN(numero) &&
                    numero > maiorNumero
                ) {

                    maiorNumero =
                        numero;

                }

            });


            return (
                "PROD-" +
                String(
                    maiorNumero + 1
                ).padStart(5, "0")
            );

        },


        /* =================================================
           NORMALIZAR
           ================================================= */

        normalizar: function (dados) {

            return {

                id:
                    dados.id ||
                    JCStorage.gerarId("PROD"),


                codigo:
                    dados.codigo ||
                    this.gerarCodigo(),


                nome:
                    String(
                        dados.nome || ""
                    ).trim(),


                categoria:
                    String(
                        dados.categoria || ""
                    ).trim(),


                descricao:
                    String(
                        dados.descricao || ""
                    ).trim(),


                precoCusto:
                    Number(
                        dados.precoCusto
                    ) || 0,


                precoVenda:
                    Number(
                        dados.precoVenda
                    ) || 0,


                estoque:
                    Number(
                        dados.estoque
                    ) || 0,


                estoqueMinimo:
                    Number(
                        dados.estoqueMinimo
                    ) || 1,


                ativo:
                    dados.ativo !== false,


                criadoEm:
                    dados.criadoEm ||
                    JCStorage.agora(),


                atualizadoEm:
                    JCStorage.agora()

            };

        },

/* =================================================
   VALIDAR
   ================================================= */

validar: function (dados) {

    if (!dados.nome) {

        return {

            valido: false,

            mensagem:
                "Informe o nome do produto."

        };

    }


    const estoqueMinimo =
        Number(
            dados.estoqueMinimo
        );


    if (
        !Number.isFinite(estoqueMinimo) ||
        estoqueMinimo < 0
    ) {

        return {

            valido: false,

            mensagem:
                "Informe um estoque mínimo válido."

        };

    }


    return {

        valido: true,

        mensagem: ""

    };

},
   
        /* =================================================
           VERIFICAR NOME DUPLICADO
           ================================================= */

        existeNome: function (
            nome,
            ignorarId
        ) {

            const produtos =
                this.listar();


            nome =
                String(nome || "")
                    .trim()
                    .toLowerCase();


            if (!nome) {

                return false;

            }


            return produtos.some(function (produto) {

                return (

                    String(
                        produto.nome || ""
                    )
                        .trim()
                        .toLowerCase() === nome

                    &&

                    produto.id !== ignorarId

                );

            });

        },


        /* =================================================
           CADASTRAR
           ================================================= */

        cadastrar: function (dados) {

            dados =
                dados || {};


            const validacao =
                this.validar(dados);


            if (!validacao.valido) {

                return {

                    sucesso: false,

                    mensagem:
                        validacao.mensagem

                };

            }


            if (
                this.existeNome(
                    dados.nome
                )
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "Já existe um produto com este nome."

                };

            }


            /*
             * O cadastro começa com estoque zero.
             *
             * A mercadoria comprada deve entrar
             * através da operação de entrada.
             */

            const produto =
                this.normalizar({

                    ...dados,

                    estoque: 0,

                    precoCusto: 0,

                    precoVenda: 0

                });


            const produtos =
                this.listar();


            produtos.push(
                produto
            );


            JCStorage.salvarProdutos(
                produtos
            );


            this.atualizarTela();


            return {

                sucesso: true,

                produto:
                    produto,

                mensagem:
                    "Produto cadastrado com sucesso."

            };

        },


        /* =================================================
           EDITAR
           ================================================= */

        editar: function (
            id,
            dados
        ) {

            const produtos =
                this.listar();


            const indice =
                produtos.findIndex(function (produto) {

                    return produto.id === id;

                });


            if (indice === -1) {

                return {

                    sucesso: false,

                    mensagem:
                        "Produto não encontrado."

                };

            }


            const produtoAtual =
                produtos[indice];


            dados =
                dados || {};


            if (
                this.existeNome(
                    dados.nome,
                    id
                )
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "Já existe outro produto com este nome."

                };

            }


            const dadosAtualizados = {

                ...produtoAtual,

                ...dados,

                id:
                    produtoAtual.id,

                codigo:
                    produtoAtual.codigo,

                estoque:
                    produtoAtual.estoque,

                criadoEm:
                    produtoAtual.criadoEm

            };


            const validacao =
                this.validar(
                    dadosAtualizados
                );


            if (!validacao.valido) {

                return {

                    sucesso: false,

                    mensagem:
                        validacao.mensagem

                };

            }


            produtos[indice] =
                this.normalizar(
                    dadosAtualizados
                );


            JCStorage.salvarProdutos(
                produtos
            );


            this.atualizarTela();


            return {

                sucesso: true,

                produto:
                    produtos[indice],

                mensagem:
                    "Produto atualizado com sucesso."

            };

        },


        /* =================================================
           EXCLUIR
           ================================================= */

        excluir: function (id) {

            const produtos =
                this.listar();


            const produto =
                this.buscarPorId(id);


            if (!produto) {

                return {

                    sucesso: false,

                    mensagem:
                        "Produto não encontrado."

                };

            }


            if (
                Number(
                    produto.estoque
                ) > 0
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "Não é possível excluir um produto que possui estoque."

                };

            }


            const vendas =
                JCStorage.obterVendas();


            const possuiVenda =
                vendas.some(function (venda) {

                    return Array.isArray(
                        venda.itens
                    ) &&
                    venda.itens.some(function (item) {

                        return item.produtoId === id;

                    });

                });


            if (possuiVenda) {

                return {

                    sucesso: false,

                    mensagem:
                        "Este produto possui vendas registradas e não pode ser excluído."

                };

            }


            const novaLista =
                produtos.filter(function (item) {

                    return item.id !== id;

                });


            JCStorage.salvarProdutos(
                novaLista
            );


            this.atualizarTela();


            return {

                sucesso: true,

                mensagem:
                    "Produto excluído com sucesso."

            };

        },


        /* =================================================
           ENTRADA DE MERCADORIA
           ================================================= */

        entrada: function (
            produtoId,
            quantidade,
            observacao,
            valorCusto
        ) {

            const produtos =
                this.listar();


            const indice =
                produtos.findIndex(function (produto) {

                    return produto.id === produtoId;

                });


            if (indice === -1) {

                return {

                    sucesso: false,

                    mensagem:
                        "Produto não encontrado."

                };

            }


            quantidade =
                Number(quantidade);


            if (
                !Number.isFinite(
                    quantidade
                ) ||
                quantidade <= 0
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "Informe uma quantidade válida."

                };

            }


            const produto =
                produtos[indice];


            const custoEntrada =
                Number(
                    valorCusto
                );


            /*
             * Se um novo custo for informado,
             * atualizamos o custo do produto.
             */

            if (
                Number.isFinite(
                    custoEntrada
                ) &&
                custoEntrada >= 0
            ) {

                produto.precoCusto =
                    custoEntrada;

            }


            produto.estoque =
                (
                    Number(
                        produto.estoque
                    ) || 0
                ) + quantidade;


            produto.atualizadoEm =
                JCStorage.agora();


            produtos[indice] =
                produto;


            JCStorage.salvarProdutos(
                produtos
            );


            /*
             * Registrar a entrada como movimentação
             * de estoque.
             */

            const custoUnitario =
                Number(
                    produto.precoCusto
                ) || 0;


            const valorTotal =
                quantidade *
                custoUnitario;


            /*
             * A compra da mercadoria é uma saída
             * financeira, pois representa dinheiro
             * investido na aquisição do estoque.
             */

            if (
                valorTotal > 0
            ) {

                JCStorage.adicionarMovimentacao({

                    tipo:
                        "saida",

                    categoria:
                        "compra",

                    descricao:
                        "Compra de estoque - " +
                        produto.nome,

                    valor:
                        valorTotal,

                    data:
                        JCStorage.agora(),

                    formaPagamento:
                        "dinheiro",

                    produtoId:
                        produto.id,

                    quantidade:
                        quantidade,

                    observacoes:
                        observacao || ""

                });

            }


            this.atualizarTela();


            return {

                sucesso: true,

                produto:
                    produto,

                quantidade:
                    quantidade,

                valorTotal:
                    valorTotal,

                mensagem:
                    "Entrada registrada com sucesso."

            };

        },


        /* =================================================
           REGISTRAR ENTRADA DE COMPRA
           ================================================= */

        registrarEntradaCompra: function (
            produtoId,
            quantidade,
            custoUnitario
        ) {

            const produtos =
                this.listar();

            const indice =
                produtos.findIndex(function (produto) {
                    return produto.id === produtoId;
                });

            if (indice === -1) {
                return {
                    sucesso: false,
                    mensagem: "Produto não encontrado."
                };
            }

            quantidade = Number(quantidade);
            custoUnitario = Number(custoUnitario);

            if (!Number.isFinite(quantidade) || quantidade <= 0) {
                return {
                    sucesso: false,
                    mensagem: "Informe uma quantidade válida."
                };
            }

            if (!Number.isFinite(custoUnitario) || custoUnitario < 0) {
                return {
                    sucesso: false,
                    mensagem: "Informe um valor de compra válido."
                };
            }

            const produto = produtos[indice];
            const estoqueAnterior = Number(produto.estoque) || 0;
            const custoAnterior = Number(produto.precoCusto) || 0;
            const estoqueNovo = estoqueAnterior + quantidade;

            /*
             * Mantém o custo médio do estoque quando o mesmo
             * produto é comprado novamente por outro valor.
             */
            if (estoqueAnterior > 0) {
                produto.precoCusto =
                    ((estoqueAnterior * custoAnterior) +
                     (quantidade * custoUnitario)) /
                    estoqueNovo;
            } else {
                produto.precoCusto = custoUnitario;
            }

            produto.estoque = estoqueNovo;
            produto.atualizadoEm = JCStorage.agora();

            produtos[indice] = produto;
            JCStorage.salvarProdutos(produtos);
            this.atualizarTela();

            return {
                sucesso: true,
                produto: produto,
                quantidade: quantidade,
                custoUnitario: custoUnitario,
                valorTotal: quantidade * custoUnitario,
                mensagem: "Entrada de compra registrada com sucesso."
            };
        },


        /* =================================================
           SAÍDA DE ESTOQUE
           ================================================= */

        saida: function (
            produtoId,
            quantidade,
            observacao
        ) {

            const produtos =
                this.listar();


            const indice =
                produtos.findIndex(function (produto) {

                    return produto.id === produtoId;

                });


            if (indice === -1) {

                return {

                    sucesso: false,

                    mensagem:
                        "Produto não encontrado."

                };

            }


            quantidade =
                Number(quantidade);


            if (
                !Number.isFinite(
                    quantidade
                ) ||
                quantidade <= 0
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "Informe uma quantidade válida."

                };

            }


            const produto =
                produtos[indice];


            const estoqueAtual =
                Number(
                    produto.estoque
                ) || 0;


            if (
                quantidade > estoqueAtual
            ) {

                return {

                    sucesso: false,

                    mensagem:
                        "Estoque insuficiente. Disponível: " +
                        estoqueAtual

                };

            }


            produto.estoque =
                estoqueAtual -
                quantidade;


            produto.atualizadoEm =
                JCStorage.agora();


            produtos[indice] =
                produto;


            JCStorage.salvarProdutos(
                produtos
            );


            this.atualizarTela();


            return {

                sucesso: true,

                produto:
                    produto,

                quantidade:
                    quantidade,

                mensagem:
                    "Saída de estoque registrada."

            };

        },


        /* =================================================
           ESTOQUE BAIXO
           ================================================= */

        estoqueBaixo: function () {

            return this.listar()
                .filter(function (produto) {

                    return (
                        Number(
                            produto.estoque
                        ) <=
                        Number(
                            produto.estoqueMinimo
                        )
                    );

                });

        },


        /* =================================================
           SEM ESTOQUE
           ================================================= */

        semEstoque: function () {

            return this.listar()
                .filter(function (produto) {

                    return (
                        Number(
                            produto.estoque
                        ) <= 0
                    );

                });

        },


        /* =================================================
           VALOR DO ESTOQUE PELO CUSTO
           ================================================= */

        valorEstoqueCusto: function () {

            return this.listar()
                .reduce(function (
                    total,
                    produto
                ) {

                    return total +

                        (
                            Number(
                                produto.estoque
                            ) || 0
                        )

                        *

                        (
                            Number(
                                produto.precoCusto
                            ) || 0
                        );

                }, 0);

        },


        /* =================================================
           VALOR DO ESTOQUE PELO PREÇO DE VENDA
           ================================================= */

        valorEstoqueVenda: function () {

            return this.listar()
                .reduce(function (
                    total,
                    produto
                ) {

                    return total +

                        (
                            Number(
                                produto.estoque
                            ) || 0
                        )

                        *

                        (
                            Number(
                                produto.precoVenda
                            ) || 0
                        );

                }, 0);

        },


        /* =================================================
           LUCRO ESTIMADO DO ESTOQUE
           ================================================= */

        lucroEstimadoEstoque: function () {

            return (
                this.valorEstoqueVenda() -
                this.valorEstoqueCusto()
            );

        },


        /* =================================================
           MARGEM DO PRODUTO
           ================================================= */

        margemProduto: function (id) {

            const produto =
                this.buscarPorId(id);


            if (!produto) {

                return 0;

            }


            const custo =
                Number(
                    produto.precoCusto
                ) || 0;


            const venda =
                Number(
                    produto.precoVenda
                ) || 0;


            if (venda <= 0) {

                return 0;

            }


            return (
                (
                    venda - custo
                ) / venda
            ) * 100;

        },


        /* =================================================
           ATUALIZAR TELA
           ================================================= */

        atualizarTela: function () {

            if (
                typeof renderizarProdutos ===
                "function"
            ) {

                renderizarProdutos();

            }


            if (
                typeof atualizarResumoProdutos ===
                "function"
            ) {

                atualizarResumoProdutos();

            }


            if (
                window.JCApp &&
                typeof window.JCApp.atualizarDashboard ===
                "function"
            ) {

                window.JCApp.atualizarDashboard();

            }

        }

    };


    /* =====================================================
       DISPONIBILIZAR
       ===================================================== */

    window.JCProdutos =
        JCProdutos;


    /* =====================================================
       FORMATAÇÃO DE MOEDA
       ===================================================== */

    function formatarMoedaProduto(valor) {

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


    /* =====================================================
       ESCAPAR HTML
       ===================================================== */

    function escaparHTML(valor) {

        return String(
            valor || ""
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


    /* =====================================================
       STATUS DO ESTOQUE
       ===================================================== */

    function statusEstoque(produto) {

        const estoque =
            Number(
                produto.estoque
            ) || 0;


        const minimo =
            Number(
                produto.estoqueMinimo
            ) || 0;


        if (
            estoque <= 0
        ) {

            return `
                <span class="status-badge status-danger">
                    Sem estoque
                </span>
            `;

        }


        if (
            estoque <= minimo
        ) {

            return `
                <span class="status-badge status-warning">
                    Estoque baixo
                </span>
            `;

        }


        return `
            <span class="status-badge status-success">
                Disponível
            </span>
        `;

    }


    /* =====================================================
       RENDERIZAR RESUMO
       ===================================================== */

    window.atualizarResumoProdutos =
        function () {

            const produtos =
                JCProdutos.listar();


            const quantidade =
                produtos.reduce(function (
                    total,
                    produto
                ) {

                    return total +
                        (
                            Number(
                                produto.estoque
                            ) || 0
                        );

                }, 0);


            const valorCusto =
                JCProdutos
                    .valorEstoqueCusto();


            const valorVenda =
                JCProdutos
                    .valorEstoqueVenda();


            const total =
                produtos.length;


            const elementoTotal =
                document.getElementById(
                    "produtosTotal"
                );


            const elementoTotalPasta =
                document.getElementById(
                    "produtosTotalPasta"
                );


            const elementoQuantidade =
                document.getElementById(
                    "produtosQuantidadeEstoque"
                );


            const elementoCusto =
                document.getElementById(
                    "produtosValorCusto"
                );


            const elementoVenda =
                document.getElementById(
                    "produtosValorVenda"
                );


            if (elementoTotal) {

                elementoTotal.textContent =
                    total;

            }


            /*
             * Mantém o contador da pasta
             * sincronizado com o total real.
             */

            if (elementoTotalPasta) {

                elementoTotalPasta.textContent =
                    total;

            }


            if (elementoQuantidade) {

                elementoQuantidade.textContent =
                    quantidade;

            }


            if (elementoCusto) {

                elementoCusto.textContent =
                    formatarMoedaProduto(
                        valorCusto
                    );

            }


            if (elementoVenda) {

                elementoVenda.textContent =
                    formatarMoedaProduto(
                        valorVenda
                    );

            }

        };


    /* =====================================================
       RENDERIZAR LISTA
       ===================================================== */

    window.renderizarProdutos =
        function (listaPersonalizada) {

            const tabela =
                document.getElementById(
                    "listaProdutos"
                );


            if (!tabela) {

                return;

            }


            const produtos =
                Array.isArray(
                    listaPersonalizada
                )
                    ? listaPersonalizada
                    : JCProdutos.listar();


            if (
                produtos.length === 0
            ) {

                tabela.innerHTML = `

                    <tr>

                        <td
                            colspan="7"
                            class="empty-table"
                        >
                            Nenhum produto cadastrado.
                        </td>

                    </tr>

                `;

                atualizarResumoProdutos();

                return;

            }


            tabela.innerHTML =
                produtos.map(function (
                    produto
                ) {

                    return `

                        <tr>

                            <td>
                                <strong>
                                    ${escaparHTML(
                                        produto.codigo
                                    )}
                                </strong>
                            </td>


                            <td>

                                <strong>
                                    ${escaparHTML(
                                        produto.nome
                                    )}
                                </strong>

                                ${
                                    produto.categoria
                                        ? `
                                            <small>
                                                ${escaparHTML(
                                                    produto.categoria
                                                )}
                                            </small>
                                          `
                                        : ""
                                }

                            </td>


                            <td>

                                <strong>
                                    ${
                                        Number(
                                            produto.estoque
                                        ) || 0
                                    }
                                </strong>

                            </td>


                            <td>
                                ${formatarMoedaProduto(
                                    produto.precoCusto
                                )}
                            </td>


                            <td>
                                ${formatarMoedaProduto(
                                    produto.precoVenda
                                )}
                            </td>


                            <td>
                                ${statusEstoque(
                                    produto
                                )}
                            </td>


                            <td>

                                <div
                                    class="table-actions"
                                >


                                    <button
                                        type="button"
                                        class="btn-small"
                                        data-produto-editar="${escaparHTML(
                                            produto.id
                                        )}"
                                    >
                                        ✏️ Editar
                                    </button>


                                    <button
                                        type="button"
                                        class="btn-small btn-danger"
                                        data-produto-excluir="${escaparHTML(
                                            produto.id
                                        )}"
                                    >
                                        🗑️ Excluir
                                    </button>

                                </div>

                            </td>

                        </tr>

                    `;

                }).join("");


            atualizarResumoProdutos();

        };


    /* =====================================================
       ABRIR MODAL
       ===================================================== */

    function abrirModalProduto(
        produto
    ) {

        const modal =
            document.getElementById(
                "modalProduto"
            );


        const titulo =
            document.getElementById(
                "tituloModalProduto"
            );


        const id =
            document.getElementById(
                "produtoId"
            );


        const codigo =
            document.getElementById(
                "produtoCodigo"
            );


        const nome =
            document.getElementById(
                "produtoNome"
            );


        const categoria =
            document.getElementById(
                "produtoCategoria"
            );


        const descricao =
            document.getElementById(
                "produtoDescricao"
            );


        const minimo =
            document.getElementById(
                "produtoEstoqueMinimo"
            );


        if (!modal) {

            return;

        }


        if (produto) {

            titulo.textContent =
                "Editar produto";


            id.value =
                produto.id;


            codigo.value =
                produto.codigo || "";


            nome.value =
                produto.nome || "";


            categoria.value =
                produto.categoria || "";


            descricao.value =
                produto.descricao || "";


            minimo.value =
                produto.estoqueMinimo ?? 1;

        } else {

            titulo.textContent =
                "Novo produto";


            id.value =
                "";


            codigo.value =
                JCProdutos.gerarCodigo();


            nome.value =
                "";


            categoria.value =
                "";


            descricao.value =
                "";


            minimo.value =
                1;

        }


        modal.hidden =
            false;


        setTimeout(function () {

            nome.focus();

        }, 50);

    }


    /* =====================================================
       FECHAR MODAL
       ===================================================== */

    function fecharModalProduto() {

        const modal =
            document.getElementById(
                "modalProduto"
            );


        if (modal) {

            modal.hidden =
                true;

        }

    }


    /* =====================================================
       EXCLUIR PRODUTO
       ===================================================== */

    function excluirProduto(
        id
    ) {

        const produto =
            JCProdutos.buscarPorId(
                id
            );


        if (!produto) {

            return;

        }


        const confirmar =
            confirm(
                "Deseja excluir o produto:\n\n" +
                produto.nome +
                "?"
            );


        if (!confirmar) {

            return;

        }


        const resultado =
            JCProdutos.excluir(
                id
            );


        alert(
            resultado.mensagem
        );


        renderizarProdutos();

        atualizarResumoProdutos();

    }


    /* =====================================================
       CONFIGURAR EVENTOS
       ===================================================== */

    function configurarEventosProdutos() {

        const botaoNovo =
            document.getElementById(
                "btnNovoProduto"
            );


        const fechar =
            document.getElementById(
                "fecharModalProduto"
            );


        const cancelar =
            document.getElementById(
                "cancelarProduto"
            );


        const formulario =
            document.getElementById(
                "formProduto"
            );


        const pesquisa =
            document.getElementById(
                "pesquisaProdutos"
            );


        const modal =
            document.getElementById(
                "modalProduto"
            );


        if (botaoNovo) {

            botaoNovo.addEventListener(
                "click",
                function () {

                    abrirModalProduto(
                        null
                    );

                }
            );

        }


        if (fechar) {

            fechar.addEventListener(
                "click",
                fecharModalProduto
            );

        }


        if (cancelar) {

            cancelar.addEventListener(
                "click",
                fecharModalProduto
            );

        }


        if (modal) {

            modal.addEventListener(
                "click",
                function (evento) {

                    if (
                        evento.target === modal
                    ) {

                        fecharModalProduto();

                    }

                }
            );

        }


        if (formulario) {

            formulario.addEventListener(
                "submit",
                function (evento) {

                    evento.preventDefault();


                    const id =
                        document.getElementById(
                            "produtoId"
                        ).value;


                    const dados = {

                        codigo:
                            document.getElementById(
                                "produtoCodigo"
                            ).value,

                        nome:
                            document.getElementById(
                                "produtoNome"
                            ).value,

                        categoria:
                            document.getElementById(
                                "produtoCategoria"
                            ).value,

                        descricao:
                            document.getElementById(
                                "produtoDescricao"
                            ).value,

                        estoqueMinimo:
                            document.getElementById(
                                "produtoEstoqueMinimo"
                            ).value

                    };


                    let resultado;


                    if (id) {

                        resultado =
                            JCProdutos.editar(
                                id,
                                dados
                            );

                    } else {

                        resultado =
                            JCProdutos.cadastrar(
                                dados
                            );

                    }


                    if (
                        resultado.sucesso
                    ) {

                        alert(
                            resultado.mensagem
                        );


                        fecharModalProduto();


                        renderizarProdutos();

                        atualizarResumoProdutos();

                    } else {

                        alert(
                            resultado.mensagem
                        );

                    }

                }
            );

        }


        if (pesquisa) {

            pesquisa.addEventListener(
                "input",
                function () {

                    const resultados =
                        JCProdutos.pesquisar(
                            pesquisa.value
                        );


                    renderizarProdutos(
                        resultados
                    );

                }
            );

        }


        document.addEventListener(
            "click",
            function (evento) {

                const botaoEditar =
                    evento.target.closest(
                        "[data-produto-editar]"
                    );


                if (botaoEditar) {

                    abrirModalProduto(

                        JCProdutos.buscarPorId(
                            botaoEditar.dataset
                                .produtoEditar
                        )

                    );

                    return;

                }


                const botaoExcluir =
                    evento.target.closest(
                        "[data-produto-excluir]"
                    );


                if (botaoExcluir) {

                    excluirProduto(
                        botaoExcluir.dataset
                            .produtoExcluir
                    );

                }

            }
        );


        document.addEventListener(
            "keydown",
            function (evento) {

                if (
                    evento.key === "Escape"
                ) {

                    fecharModalProduto();

                }

            }
        );

    }


    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    function inicializarProdutos() {

        configurarEventosProdutos();

        renderizarProdutos();

        atualizarResumoProdutos();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            inicializarProdutos
        );

    } else {

        inicializarProdutos();

    }


})();