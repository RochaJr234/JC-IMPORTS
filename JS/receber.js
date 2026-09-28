/* =========================================================
   J.C IMPORTS 2.0
   MÓDULO CONTAS A RECEBER
   ========================================================= */

(function () {
    "use strict";

    if (!window.JCStorage) {
        console.error("JCStorage não foi carregado.");
        return;
    }

    /* =====================================================
       UTILITÁRIOS DA INTERFACE
       ===================================================== */

    function moedaReceber(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function escaparReceber(valor) {
        return String(valor == null ? "" : valor)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatarDataReceber(data) {

        if (!data) {
            return "-";
        }

        const texto = String(data).slice(0, 10);

        const partes = texto.split("-");

        if (partes.length === 3) {
            return partes[2] + "/" +
                partes[1] + "/" +
                partes[0];
        }

        return texto;
    }

    function dataHojeReceber() {

        const agora = new Date();

        return agora.toISOString().slice(0, 10);
    }

    function contaVencida(conta) {

        if (
            !conta ||
            conta.status !== "pendente" ||
            Number(conta.saldo) <= 0 ||
            !conta.vencimento
        ) {
            return false;
        }

        return String(conta.vencimento).slice(0, 10) <
            dataHojeReceber();
    }


    let modoListaReceber = "aberto";

    /* =====================================================
       MÓDULO PRINCIPAL
       ===================================================== */

    const JCReceber = {

        /* =================================================
           LISTAR CONTAS
           ================================================= */

        listar: function () {

            return JCStorage.obterContasReceber();
        },


        /* =================================================
           BUSCAR POR ID
           ================================================= */

        buscarPorId: function (id) {

            const contas = this.listar();

            return contas.find(function (conta) {

                return String(conta.id) === String(id);

            }) || null;
        },


        /* =================================================
           CONTAS PENDENTES
           ================================================= */

        pendentes: function () {

            return this.listar().filter(function (conta) {

                return (
                    conta.status === "pendente" &&
                    Number(conta.saldo) > 0
                );

            });
        },


        /* =================================================
           CONTAS PAGAS
           ================================================= */

        pagas: function () {

            return this.listar().filter(function (conta) {

                return conta.status === "pago";

            });
        },


        /* =================================================
           CONTAS VENCIDAS
           ================================================= */

        vencidas: function () {

            return this.pendentes().filter(function (conta) {

                return contaVencida(conta);

            });
        },


        /* =================================================
           TOTAL PENDENTE
           ================================================= */

        totalPendente: function () {

            return this.pendentes()
                .reduce(function (total, conta) {

                    return total +
                        (Number(conta.saldo) || 0);

                }, 0);
        },


        /* =================================================
           TOTAL VENCIDO
           ================================================= */

        totalVencido: function () {

            return this.vencidas()
                .reduce(function (total, conta) {

                    return total +
                        (Number(conta.saldo) || 0);

                }, 0);
        },


        /* =================================================
           TOTAL RECEBIDO
           ================================================= */

        totalRecebido: function () {

            return this.listar()
                .filter(function (conta) {
                    return (
                        conta.status !== "cancelado" &&
                        conta.status !== "cancelada"
                    );
                })
                .reduce(function (total, conta) {

                    return total +
                        (Number(conta.valorPago) || 0);

                }, 0);
        },


        /* =================================================
           TOTAL GERAL DAS CONTAS
           ================================================= */

        totalGeral: function () {

            /*
             * "Total a receber" representa somente o saldo
             * que ainda falta receber. Contas já pagas têm
             * saldo zero e, portanto, deixam de compor este total.
             */
            return this.listar()
                .filter(function (conta) {

                    return (
                        conta.status !== "cancelado" &&
                        conta.status !== "cancelada" &&
                        Number(conta.saldo) > 0
                    );

                })
                .reduce(function (total, conta) {

                    return total +
                        (Number(conta.saldo) || 0);

                }, 0);
        },


        /* =================================================
           REGISTRAR RECEBIMENTO
           ================================================= */

        receber: function (
            id,
            valor,
            formaPagamento
        ) {

            const contas = this.listar();

            const indice = contas.findIndex(function (conta) {

                return String(conta.id) === String(id);

            });


            if (indice === -1) {

                return {
                    sucesso: false,
                    mensagem:
                        "Conta a receber não encontrada."
                };
            }


            const conta = contas[indice];


            const saldoAtual =
                Number(conta.saldo) || 0;


            if (saldoAtual <= 0) {

                return {
                    sucesso: false,
                    mensagem:
                        "Esta conta já está totalmente paga."
                };
            }


            valor = Number(valor);


            if (
                !Number.isFinite(valor) ||
                valor <= 0
            ) {

                return {
                    sucesso: false,
                    mensagem:
                        "Informe um valor maior que zero."
                };
            }


            if (valor > saldoAtual) {

                return {
                    sucesso: false,
                    mensagem:
                        "O valor recebido não pode ser maior que o saldo da conta."
                };
            }


            formaPagamento =
                String(
                    formaPagamento || "dinheiro"
                ).toLowerCase();


            const formasPermitidas = [
                "dinheiro",
                "pix",
                "cartao"
            ];


            if (
                !formasPermitidas.includes(
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
               ATUALIZAR CONTA
               --------------------------------------------- */

            const valorPagoAnterior =
                Number(conta.valorPago) || 0;


            const novoValorPago =
                valorPagoAnterior + valor;


            const novoSaldo =
                Math.max(
                    saldoAtual - valor,
                    0
                );


            conta.valorPago =
                novoValorPago;


            conta.saldo =
                novoSaldo;


            conta.status =
                novoSaldo <= 0
                    ? "pago"
                    : "pendente";


            conta.ultimoPagamento =
                JCStorage.agora();

            if (novoSaldo <= 0) {
                conta.dataPagamento =
                    conta.ultimoPagamento;
            } else {
                conta.dataPagamento = null;
            }


            /* ---------------------------------------------
               SALVAR CONTA
               --------------------------------------------- */

            contas[indice] = conta;


            JCStorage.salvarContasReceber(
                contas
            );


            /* ---------------------------------------------
               SINCRONIZAR STATUS DA VENDA
               --------------------------------------------- */

            if (conta.vendaId) {

                const vendas =
                    JCStorage.obterVendas();

                const indiceVenda =
                    vendas.findIndex(function (venda) {

                        return String(venda.id) ===
                            String(conta.vendaId);

                    });

                if (indiceVenda !== -1) {

                    const contasDaVenda =
                        contas.filter(function (item) {

                            return String(item.vendaId) ===
                                String(conta.vendaId);

                        });

                    const vendaQuitada =
                        contasDaVenda.length > 0 &&
                        contasDaVenda.every(function (item) {

                            return (
                                item.status === "pago" ||
                                Number(item.saldo) <= 0
                            );

                        });

                    const venda =
                        vendas[indiceVenda];

                    venda.status =
                        vendaQuitada ? "pago" : "pendente";

                    venda.statusPagamento =
                        venda.status;

                    venda.ultimoPagamento =
                        JCStorage.agora();

                    if (vendaQuitada) {

                        venda.dataPagamento =
                            JCStorage.agora();

                    }

                    vendas[indiceVenda] = venda;

                    JCStorage.salvarVendas(vendas);

                    if (
                        window.JCVendas &&
                        typeof window.JCVendas.atualizarInterface === "function"
                    ) {

                        window.JCVendas.atualizarInterface();

                    }

                }

            }


            /* ---------------------------------------------
               REGISTRAR NO FINANCEIRO
               --------------------------------------------- */

            JCStorage.adicionarMovimentacao({

                tipo: "entrada",

                categoria: "recebimento",

                descricao:
                    "Recebimento - " +
                    (
                        conta.descricao ||
                        "Conta a receber"
                    ),

                valor: valor,

                data:
                    JCStorage.agora(),

                formaPagamento:
                    formaPagamento,

                vendaId:
                    conta.vendaId || null,

                clienteId:
                    conta.clienteId || null
            });


            /* ---------------------------------------------
               ATUALIZAR DASHBOARD
               --------------------------------------------- */

            if (
                window.JCApp &&
                typeof window.JCApp.atualizarDashboard ===
                "function"
            ) {

                window.JCApp.atualizarDashboard();

            }


            if (
                typeof atualizarInterfaceReceber === "function"
            ) {

                atualizarInterfaceReceber();

            }


            return {

                sucesso: true,

                conta: conta,

                valorRecebido:
                    valor,

                saldoRestante:
                    novoSaldo,

                mensagem:
                    novoSaldo <= 0
                        ? "Conta paga integralmente."
                        : "Recebimento registrado com sucesso."
            };
        },


        /* =================================================
           QUITAR CONTA
           ================================================= */

        quitar: function (
            id,
            formaPagamento
        ) {

            const conta =
                this.buscarPorId(id);


            if (!conta) {

                return {
                    sucesso: false,
                    mensagem:
                        "Conta não encontrada."
                };
            }


            const saldo =
                Number(conta.saldo) || 0;


            if (saldo <= 0) {

                return {
                    sucesso: false,
                    mensagem:
                        "Esta conta já está paga."
                };
            }


            return this.receber(
                id,
                saldo,
                formaPagamento || "dinheiro"
            );
        },


        /* =================================================
           QUITAR TODA A VENDA
           ================================================= */

        quitarVenda: function (vendaId, formaPagamento) {

            const contas = this.listar();

            const relacionadas = contas.filter(function (conta) {
                return String(conta.vendaId || "") === String(vendaId || "");
            });

            const pendentes = relacionadas.filter(function (conta) {
                return (
                    conta.status !== "cancelado" &&
                    conta.status !== "cancelada" &&
                    Number(conta.saldo) > 0
                );
            });

            if (!pendentes.length) {
                return {
                    sucesso: false,
                    mensagem: "Não há saldo pendente nesta venda."
                };
            }

            formaPagamento = String(formaPagamento || "dinheiro").toLowerCase();

            const formasPermitidas = ["dinheiro", "pix", "cartao"];
            if (!formasPermitidas.includes(formaPagamento)) {
                return {
                    sucesso: false,
                    mensagem: "Forma de pagamento inválida."
                };
            }

            const agora = JCStorage.agora();
            let totalQuitado = 0;

            pendentes.forEach(function (conta) {
                const saldo = Number(conta.saldo) || 0;
                const valorPagoAnterior = Number(conta.valorPago) || 0;

                conta.valorPago = valorPagoAnterior + saldo;
                conta.saldo = 0;
                conta.status = "pago";
                conta.formaPagamentoRecebimento = formaPagamento;
                conta.ultimoPagamento = agora;
                conta.dataPagamento = agora;

                totalQuitado += saldo;
            });

            JCStorage.salvarContasReceber(contas);

            /* Um único lançamento financeiro para a quitação total. */
            JCStorage.adicionarMovimentacao({
                tipo: "entrada",
                categoria: "recebimento",
                descricao: "Quitação total - " + (pendentes[0].descricao || "Venda"),
                valor: totalQuitado,
                data: agora,
                formaPagamento: formaPagamento,
                vendaId: vendaId || null,
                clienteId: pendentes[0].clienteId || null
            });

            /* Sincronizar a venda. */
            if (vendaId) {
                const vendas = JCStorage.obterVendas();
                const indiceVenda = vendas.findIndex(function (venda) {
                    return String(venda.id) === String(vendaId);
                });

                if (indiceVenda !== -1) {
                    const venda = vendas[indiceVenda];
                    venda.status = "pago";
                    venda.statusPagamento = "pago";
                    venda.ultimoPagamento = agora;
                    venda.dataPagamento = agora;
                    vendas[indiceVenda] = venda;
                    JCStorage.salvarVendas(vendas);
                }
            }

            if (window.JCVendas && typeof window.JCVendas.atualizarInterface === "function") {
                window.JCVendas.atualizarInterface();
            }

            if (window.JCApp && typeof window.JCApp.atualizarDashboard === "function") {
                window.JCApp.atualizarDashboard();
            }

            atualizarInterfaceReceber();

            return {
                sucesso: true,
                valorRecebido: totalQuitado,
                mensagem: "Venda quitada integralmente. Total recebido: " + moedaReceber(totalQuitado) + "."
            };
        },


        /* =================================================
           CONTAS DE UM CLIENTE
           ================================================= */

        porCliente: function (clienteId) {

            return this.listar()
                .filter(function (conta) {

                    return String(conta.clienteId) ===
                        String(clienteId);

                });
        },


        /* =================================================
           SALDO DE UM CLIENTE
           ================================================= */

        saldoCliente: function (clienteId) {

            return this.porCliente(clienteId)
                .filter(function (conta) {

                    return (
                        conta.status !== "cancelado" &&
                        conta.status !== "cancelada"
                    );

                })
                .reduce(function (total, conta) {

                    return total +
                        (Number(conta.saldo) || 0);

                }, 0);
        },


        /* =================================================
           CONTAS DO MÊS
           ================================================= */

        doMes: function (ano, mes) {

            const agora = new Date();


            ano =
                ano !== undefined
                    ? Number(ano)
                    : agora.getFullYear();


            mes =
                mes !== undefined
                    ? Number(mes)
                    : agora.getMonth() + 1;


            return this.listar()
                .filter(function (conta) {

                    if (!conta.vencimento) {
                        return false;
                    }


                    const data =
                        new Date(conta.vencimento);


                    return (
                        data.getFullYear() === ano &&
                        data.getMonth() + 1 === mes
                    );

                });
        },


        /* =================================================
           RESUMO
           ================================================= */

        resumo: function () {

            const pendentes =
                this.pendentes();


            const vencidas =
                this.vencidas();


            return {

                quantidadePendente:
                    pendentes.length,

                quantidadeVencida:
                    vencidas.length,

                totalPendente:
                    this.totalPendente(),

                totalVencido:
                    this.totalVencido(),

                totalRecebido:
                    this.totalRecebido(),

                totalGeral:
                    this.totalGeral()
            };
        }

    };


    /* =====================================================
       INTERFACE
       ===================================================== */

    function criarInterfaceReceber() {

        const container =
            document.getElementById("receberContent");


        if (!container) {
            return false;
        }


        /*
         * Se a interface já existe no HTML,
         * não substituímos.
         */

        const listaExistente =
            document.getElementById("listaReceber");


        if (listaExistente) {
            return true;
        }


        /*
         * Caso o receberContent esteja vazio,
         * criamos a interface.
         */

        container.innerHTML = `

            <div class="receber-painel">

                <div class="receber-resumo">

                    <div class="receber-card">
                        <span>Total a receber</span>
                        <strong id="receberTotal">
                            R$ 0,00
                        </strong>
                    </div>

                    <div class="receber-card">
                        <span>Em aberto</span>
                        <strong id="receberAberto">
                            R$ 0,00
                        </strong>
                    </div>

                    <div class="receber-card">
                        <span>Recebido</span>
                        <strong id="receberRecebido">
                            R$ 0,00
                        </strong>
                    </div>

                    <div class="receber-card">
                        <span>Vencido</span>
                        <strong id="receberVencido">
                            R$ 0,00
                        </strong>
                    </div>

                </div>


                <div class="receber-area">

                    <div class="receber-topo">

                        <div>
                            <h2>
                                Contas a receber
                            </h2>

                            <p>
                                Acompanhe as vendas realizadas a prazo.
                            </p>
                        </div>


                        <div class="receber-filtros">

                            <select id="filtroReceber">

                                <option value="aberto" selected>
                                    Em aberto
                                </option>

                                <option value="vencido">
                                    Vencidos
                                </option>

                            </select>

                            <button
                                type="button"
                                id="btnPastaRecebidos"
                                class="btn-pasta-recebidos"
                                title="Abrir valores já recebidos"
                            >
                                📁 Recebidos
                            </button>

                        </div>

                    </div>


                    <div class="receber-tabela-wrapper">

                        <table class="receber-tabela">

                            <thead>

                                <tr>

                                    <th>
                                        Cliente
                                    </th>

                                    <th>
                                        Venda
                                    </th>

                                    <th>
                                        Vencimento
                                    </th>

                                    <th>
                                        Valor
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Ação
                                    </th>

                                </tr>

                            </thead>


                            <tbody id="listaReceber">

                                <tr>

                                    <td
                                        colspan="6"
                                        class="receber-vazio"
                                    >
                                        Nenhuma conta a receber.
                                    </td>

                                </tr>

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>
        `;


        return true;
    }


    /* =====================================================
       ATUALIZAR RESUMO
       ===================================================== */

    function atualizarResumoReceber() {

        const total =
            document.getElementById("receberTotal");

        const aberto =
            document.getElementById("receberAberto");

        const recebido =
            document.getElementById("receberRecebido");

        const vencido =
            document.getElementById("receberVencido");


        if (total) {

            total.textContent =
                moedaReceber(
                    JCReceber.totalGeral()
                );
        }


        if (aberto) {

            aberto.textContent =
                moedaReceber(
                    JCReceber.totalPendente()
                );
        }


        if (recebido) {

            recebido.textContent =
                moedaReceber(
                    JCReceber.totalRecebido()
                );
        }


        if (vencido) {

            vencido.textContent =
                moedaReceber(
                    JCReceber.totalVencido()
                );
        }
    }


    /* =====================================================
       STATUS DA CONTA
       ===================================================== */

    function obterStatusConta(conta) {

        if (
            conta.status === "cancelado" ||
            conta.status === "cancelada"
        ) {

            return {
                texto: "Cancelado",
                classe: "cancelado"
            };
        }


        if (
            conta.status === "pago" ||
            Number(conta.saldo) <= 0
        ) {

            return {
                texto: "Recebido",
                classe: "pago"
            };
        }


        if (contaVencida(conta)) {

            return {
                texto: "Vencido",
                classe: "vencido"
            };
        }


        return {
            texto: "Em aberto",
            classe: "pendente"
        };
    }


    /* =====================================================
       ATUALIZAR LISTA
       ===================================================== */

    function atualizarListaReceber() {

        const lista =
            document.getElementById("listaReceber");


        if (!lista) {
            return;
        }


        const filtro =
            document.getElementById("filtroReceber");


        let tipoFiltro =
            filtro
                ? filtro.value
                : "aberto";

        if (modoListaReceber === "recebidos") {
            tipoFiltro = "recebido";
        }


        let contas =
            JCReceber.listar()
                .filter(function (conta) {

                    return (
                        conta.status !== "cancelado" &&
                        conta.status !== "cancelada"
                    );

                });


        /* -----------------------------------------------
           FILTROS
           ----------------------------------------------- */

        /* PASTA RECEBIDOS */
        if (tipoFiltro === "recebido") {

            contas = contas.filter(function (conta) {
                return (
                    conta.status === "pago" ||
                    Number(conta.saldo) <= 0
                );
            });
        }


        if (tipoFiltro === "aberto") {

            contas =
                contas.filter(function (conta) {

                    return (
                        conta.status === "pendente" &&
                        Number(conta.saldo) > 0 &&
                        !contaVencida(conta)
                    );

                });
        }


        if (tipoFiltro === "vencido") {

            contas =
                contas.filter(function (conta) {

                    return contaVencida(conta);

                });
        }


        if (tipoFiltro === "recebido") {

            contas =
                contas.filter(function (conta) {

                    return (
                        conta.status === "pago" ||
                        Number(conta.saldo) <= 0
                    );

                });
        }


        /* -----------------------------------------------
           ORDENAÇÃO
           ----------------------------------------------- */

        contas.sort(function (a, b) {

            const dataA =
                String(a.vencimento || "9999-12-31");

            const dataB =
                String(b.vencimento || "9999-12-31");


            return dataA.localeCompare(dataB);

        });


        /* -----------------------------------------------
           NENHUMA CONTA
           ----------------------------------------------- */

        if (!contas.length) {

            lista.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="receber-vazio"
                    >
                        Nenhuma conta encontrada.
                    </td>

                </tr>

            `;

            return;
        }


        /* -----------------------------------------------
           MONTAR LINHAS
           ----------------------------------------------- */

        lista.innerHTML =
            contas.map(function (conta) {

                const status =
                    obterStatusConta(conta);


                const cliente =
                    conta.clienteNome ||
                    "Cliente não informado";


                const venda =
                    conta.descricao ||
                    conta.vendaId ||
                    "Venda";


                const vencimento =
                    formatarDataReceber(
                        conta.vencimento
                    );


                const valor =
                    Number(conta.valor) || 0;


                const saldo =
                    Number(conta.saldo) || 0;


                let acao = "";

                const contasDaVenda = conta.vendaId
                    ? JCReceber.listar().filter(function (item) {
                        return String(item.vendaId || "") === String(conta.vendaId || "") &&
                            item.status !== "cancelado" &&
                            item.status !== "cancelada";
                    })
                    : [];

                const menorParcela = contasDaVenda.length
                    ? Math.min.apply(null, contasDaVenda.map(function (item) {
                        return Number(item.parcela || 1);
                    }))
                    : null;

                const primeiraContaDaVenda = conta.vendaId
                    ? contasDaVenda
                        .filter(function (item) {
                            return Number(item.saldo) > 0;
                        })
                        .sort(function (a, b) {
                            return Number(a.parcela || 1) - Number(b.parcela || 1);
                        })[0] || null
                    : null;

                const mostrarQuitarTotal = !!(
                    conta.vendaId &&
                    primeiraContaDaVenda &&
                    String(primeiraContaDaVenda.id) === String(conta.id) &&
                    contasDaVenda.some(function (item) {
                        return Number(item.saldo) > 0;
                    })
                );


                if (
                    conta.status === "pendente" &&
                    saldo > 0
                ) {

                    acao = `

                        <div
                            class="receber-acoes"
                            style="
                                display:flex;
                                gap:6px;
                                flex-wrap:wrap;
                            "
                        >

                            <button
                                type="button"
                                class="btn-receber"
                                data-receber-conta="${escaparReceber(conta.id)}"
                            >
                                Receber
                            </button>

                            <button
                                type="button"
                                class="btn-quitar"
                                data-quitar-conta="${escaparReceber(conta.id)}"
                            >
                                Quitar parcela
                            </button>

                            ${mostrarQuitarTotal ? `
                                <button
                                    type="button"
                                    class="btn-quitar-total"
                                    data-quitar-venda="${escaparReceber(conta.vendaId)}"
                                >
                                    Quitar total
                                </button>
                            ` : ""}

                        </div>

                    `;

                } else {

                    acao = `
                        <span
                            style="
                                opacity:.6;
                            "
                        >
                            —
                        </span>
                    `;
                }


                return `

                    <tr>

                        <td>
                            ${escaparReceber(cliente)}
                        </td>

                        <td>
                            ${escaparReceber(venda)}
                        </td>

                        <td>
                            ${vencimento}
                        </td>

                        <td>

                            <strong>
                                ${moedaReceber(valor)}
                            </strong>

                            ${
                                saldo < valor
                                    ? `
                                        <br>
                                        <small>
                                            Saldo:
                                            ${moedaReceber(saldo)}
                                        </small>
                                      `
                                    : ""
                            }

                        </td>

                        <td>

                            <span
                                class="receber-status receber-status-${status.classe}"
                            >
                                ${status.texto}
                            </span>

                        </td>

                        <td>
                            ${acao}
                        </td>

                    </tr>

                `;

            }).join("");
    }


    /* =====================================================
       ATUALIZAR TODA A INTERFACE
       ===================================================== */

    function atualizarInterfaceReceber() {

        criarInterfaceReceber();

        atualizarResumoReceber();

        atualizarListaReceber();
    }


    /* =====================================================
       MODAL DE RECEBIMENTO
       ===================================================== */

    function removerModalReceber() {

        const modal =
            document.getElementById("jcModalReceber");

        if (modal) {
            modal.remove();
        }
    }


    function criarModalReceber(id, quitar) {

        removerModalReceber();

        const conta =
            JCReceber.buscarPorId(id);

        if (!conta) {
            alert("Conta a receber não encontrada.");
            return;
        }

        const saldo =
            Number(conta.saldo) || 0;

        if (saldo <= 0) {
            alert("Esta conta já está paga.");
            atualizarInterfaceReceber();
            return;
        }

        const modal = document.createElement("div");
        modal.id = "jcModalReceber";
        modal.style.cssText = [
            "position:fixed",
            "inset:0",
            "background:rgba(15,23,42,.55)",
            "display:flex",
            "align-items:center",
            "justify-content:center",
            "padding:20px",
            "z-index:999999"
        ].join(";");

        const valorInicial =
            quitar ? saldo.toFixed(2) : "";

        modal.innerHTML = `
            <div style="width:min(430px,100%);background:#fff;border-radius:16px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.25);box-sizing:border-box">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px">
                    <h3 style="margin:0;font-size:20px;color:#172033">
                        ${quitar ? "Quitar conta" : "Registrar recebimento"}
                    </h3>
                    <button type="button" data-fechar-modal-receber style="border:0;background:#f1f5f9;border-radius:8px;width:34px;height:34px;cursor:pointer;font-size:18px">×</button>
                </div>

                <p style="margin:0 0 16px;color:#64748b;font-size:14px">
                    ${escaparReceber(conta.clienteNome || "Cliente não informado")}<br>
                    Saldo atual: <strong>${moedaReceber(saldo)}</strong>
                </p>

                <label style="display:block;font-size:13px;font-weight:700;color:#334155;margin-bottom:6px">
                    Valor recebido
                </label>
                <input
                    id="valorRecebimentoJC"
                    type="text"
                    inputmode="decimal"
                    value="${escaparReceber(valorInicial)}"
                    ${quitar ? "readonly" : ""}
                    style="width:100%;box-sizing:border-box;padding:12px;border:1px solid #cbd5e1;border-radius:9px;font-size:16px;margin-bottom:14px"
                >

                <label style="display:block;font-size:13px;font-weight:700;color:#334155;margin-bottom:6px">
                    Forma de pagamento
                </label>
                <select id="formaRecebimentoJC" style="width:100%;box-sizing:border-box;padding:12px;border:1px solid #cbd5e1;border-radius:9px;font-size:15px;margin-bottom:18px">
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix" selected>Pix</option>
                    <option value="cartao">Cartão</option>
                </select>

                <div style="display:flex;gap:10px;justify-content:flex-end">
                    <button type="button" data-cancelar-modal-receber style="border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:9px;padding:11px 16px;cursor:pointer">
                        Cancelar
                    </button>
                    <button type="button" data-confirmar-modal-receber style="border:0;background:#2563eb;color:#fff;border-radius:9px;padding:11px 18px;cursor:pointer;font-weight:700">
                        ${quitar ? "Confirmar quitação" : "Registrar recebimento"}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const fechar = function () {
            removerModalReceber();
        };

        modal.querySelector("[data-fechar-modal-receber]")
            .addEventListener("click", fechar);

        modal.querySelector("[data-cancelar-modal-receber]")
            .addEventListener("click", fechar);

        modal.addEventListener("click", function (evento) {
            if (evento.target === modal) {
                fechar();
            }
        });

        modal.querySelector("[data-confirmar-modal-receber]")
            .addEventListener("click", function () {

                const campoValor =
                    modal.querySelector("#valorRecebimentoJC");

                let valorTexto =
                    campoValor ? campoValor.value : "";

                valorTexto =
                    String(valorTexto)
                        .trim()
                        .replace(/R\$/gi, "")
                        .replace(/\s/g, "");

                // Aceita 460,00 | 460.00 | 1.460,00 | 1460.00
                // sem transformar 460.00 em 46000.
                if (valorTexto.includes(",")) {
                    valorTexto = valorTexto
                        .replace(/\./g, "")
                        .replace(",", ".");
                } else {
                    valorTexto = valorTexto.replace(/(\d)\.(?=\d{3}(?:\D|$))/g, "$1");
                }

                const valor = Number(valorTexto);

                const forma =
                    modal.querySelector("#formaRecebimentoJC").value;

                const resultado = quitar
                    ? JCReceber.quitar(id, forma)
                    : JCReceber.receber(id, valor, forma);

                if (!resultado.sucesso) {
                    alert(resultado.mensagem);
                    return;
                }

                fechar();

                atualizarInterfaceReceber();

                if (
                    window.JCVendas &&
                    typeof window.JCVendas.atualizarInterface === "function"
                ) {
                    window.JCVendas.atualizarInterface();
                }

                if (
                    window.JCApp &&
                    typeof window.JCApp.atualizarDashboard === "function"
                ) {
                    window.JCApp.atualizarDashboard();
                }

                alert(resultado.mensagem);
            });

        const campoValor =
            modal.querySelector("#valorRecebimentoJC");

        if (campoValor && !quitar) {
            setTimeout(function () {
                campoValor.focus();
                campoValor.select();
            }, 50);
        }
    }


    /* =====================================================
       MODAL DE QUITAÇÃO TOTAL DA VENDA
       ===================================================== */

    function criarModalQuitarVenda(vendaId) {

        removerModalReceber();

        const contas = JCReceber.listar().filter(function (conta) {
            return String(conta.vendaId || "") === String(vendaId || "") &&
                conta.status !== "cancelado" &&
                conta.status !== "cancelada" &&
                Number(conta.saldo) > 0;
        });

        if (!contas.length) {
            alert("Não há saldo pendente nesta venda.");
            atualizarInterfaceReceber();
            return;
        }

        const total = contas.reduce(function (soma, conta) {
            return soma + (Number(conta.saldo) || 0);
        }, 0);

        const cliente = contas[0].clienteNome || "Cliente não informado";

        const modal = document.createElement("div");
        modal.id = "jcModalReceber";
        modal.style.cssText = [
            "position:fixed", "inset:0", "background:rgba(15,23,42,.55)",
            "display:flex", "align-items:center", "justify-content:center",
            "padding:20px", "z-index:999999"
        ].join(";");

        modal.innerHTML = `
            <div style="width:min(450px,100%);background:#fff;border-radius:16px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.25);box-sizing:border-box">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px">
                    <h3 style="margin:0;font-size:20px;color:#172033">Quitar venda inteira</h3>
                    <button type="button" data-fechar-modal-receber style="border:0;background:#f1f5f9;border-radius:8px;width:34px;height:34px;cursor:pointer;font-size:18px">×</button>
                </div>
                <p style="margin:0 0 10px;color:#64748b;font-size:14px">
                    ${escaparReceber(cliente)}<br>
                    Serão quitadas todas as parcelas ainda em aberto desta venda.
                </p>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px;margin:12px 0 16px">
                    <span style="display:block;color:#64748b;font-size:12px">Total restante</span>
                    <strong style="display:block;color:#1557a6;font-size:25px;margin-top:3px">${moedaReceber(total)}</strong>
                </div>
                <label style="display:block;font-size:13px;font-weight:700;color:#334155;margin-bottom:6px">Forma de pagamento</label>
                <select id="formaQuitacaoTotalJC" style="width:100%;box-sizing:border-box;padding:12px;border:1px solid #cbd5e1;border-radius:9px;font-size:15px;margin-bottom:18px">
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix" selected>Pix</option>
                    <option value="cartao">Cartão</option>
                </select>
                <div style="display:flex;gap:10px;justify-content:flex-end">
                    <button type="button" data-cancelar-modal-receber style="border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:9px;padding:11px 16px;cursor:pointer">Cancelar</button>
                    <button type="button" data-confirmar-quitacao-total style="border:0;background:#2563eb;color:#fff;border-radius:9px;padding:11px 18px;cursor:pointer;font-weight:700">Confirmar quitação total</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const fechar = function () { removerModalReceber(); };
        modal.querySelector("[data-fechar-modal-receber]").addEventListener("click", fechar);
        modal.querySelector("[data-cancelar-modal-receber]").addEventListener("click", fechar);
        modal.addEventListener("click", function (evento) { if (evento.target === modal) fechar(); });

        modal.querySelector("[data-confirmar-quitacao-total]").addEventListener("click", function () {
            const forma = modal.querySelector("#formaQuitacaoTotalJC").value;
            const resultado = JCReceber.quitarVenda(vendaId, forma);
            if (!resultado.sucesso) { alert(resultado.mensagem); return; }
            fechar();
            atualizarInterfaceReceber();
            alert(resultado.mensagem);
        });
    }


    /* =====================================================
       RECEBER CONTA PELA TELA
       ===================================================== */

    function receberContaTela(id) {
        criarModalReceber(id, false);
    }


    /* =====================================================
       QUITAR CONTA PELA TELA
       ===================================================== */

    function quitarContaTela(id) {
        criarModalReceber(id, true);
    }


    /* =====================================================
       EVENTOS DA INTERFACE
       ===================================================== */

    function configurarEventosReceber() {

        const container =
            document.getElementById("receberContent");


        if (!container) {
            return;
        }


        if (
            container.dataset.receberEventos === "1"
        ) {
            return;
        }


        container.dataset.receberEventos = "1";


        /* -----------------------------------------------
           FILTRO
           ----------------------------------------------- */

        container.addEventListener(
            "change",
            function (evento) {

                if (
                    evento.target &&
                    evento.target.id ===
                    "filtroReceber"
                ) {

                    atualizarListaReceber();

                }

            }
        );


        /* -----------------------------------------------
           BOTÕES
           ----------------------------------------------- */

        container.addEventListener(
            "click",
            function (evento) {

                const pastaRecebidos =
                    evento.target.closest("#btnPastaRecebidos");

                if (pastaRecebidos) {
                    modoListaReceber =
                        modoListaReceber === "recebidos"
                            ? "aberto"
                            : "recebidos";

                    const filtroAtual = document.getElementById("filtroReceber");
                    if (filtroAtual) filtroAtual.value = "aberto";

                    pastaRecebidos.classList.toggle(
                        "ativo",
                        modoListaReceber === "recebidos"
                    );

                    pastaRecebidos.textContent =
                        modoListaReceber === "recebidos"
                            ? "← Em aberto"
                            : "📁 Recebidos";

                    atualizarListaReceber();
                    return;
                }

                const botaoReceber =
                    evento.target.closest(
                        "[data-receber-conta]"
                    );


                if (botaoReceber) {

                    receberContaTela(
                        botaoReceber
                            .getAttribute(
                                "data-receber-conta"
                            )
                    );

                    return;
                }


                const botaoQuitar =
                    evento.target.closest(
                        "[data-quitar-conta]"
                    );


                if (botaoQuitar) {

                    quitarContaTela(
                        botaoQuitar
                            .getAttribute(
                                "data-quitar-conta"
                            )
                    );

                    return;
                }

                const botaoQuitarVenda =
                    evento.target.closest(
                        "[data-quitar-venda]"
                    );

                if (botaoQuitarVenda) {
                    criarModalQuitarVenda(
                        botaoQuitarVenda.getAttribute("data-quitar-venda")
                    );
                }

            }
        );
    }


    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    function inicializarReceber() {

        const iniciar =
            function () {

                const container =
                    document.getElementById(
                        "receberContent"
                    );


                if (!container) {
                    return;
                }


                criarInterfaceReceber();

                configurarEventosReceber();

                atualizarInterfaceReceber();
            };


        iniciar();


        /*
         * Algumas partes do sistema podem montar
         * a página depois do carregamento inicial.
         * Por isso fazemos uma pequena verificação.
         */

        setTimeout(
            function () {

                const container =
                    document.getElementById(
                        "receberContent"
                    );


                if (container) {

                    criarInterfaceReceber();

                    configurarEventosReceber();

                    atualizarInterfaceReceber();

                }

            },
            300
        );
    }


    /* =====================================================
       DISPONIBILIZAR NO SISTEMA
       ===================================================== */

    window.JCReceber =
        JCReceber;


    /*
     * Permite que outros módulos atualizem
     * a tela de A Receber.
     */

    window.JCReceber.atualizarInterface =
        atualizarInterfaceReceber;


    window.JCReceber.receberContaTela =
        receberContaTela;


    window.JCReceber.quitarContaTela =
        quitarContaTela;


    /* =====================================================
       INICIAR
       ===================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            inicializarReceber
        );

    } else {

        inicializarReceber();

    }


    console.log(
        "JCReceber carregado com interface."
    );

})();