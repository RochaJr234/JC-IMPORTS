/* ============================================================
   J.C IMPORTS 2.0
   MÓDULO: CLIENTES
   ============================================================ */

const JCClientes = {

    /* ========================================================
       LISTAR CLIENTES
       ======================================================== */

    listar() {

        if (
            typeof JCStorage === "undefined" ||
            typeof JCStorage.obterClientes !== "function"
        ) {
            console.error(
                "JCStorage.obterClientes() não está disponível."
            );

            return [];
        }

        const clientes = JCStorage.obterClientes();

        return Array.isArray(clientes)
            ? clientes
            : [];
    },


    /* ========================================================
       BUSCAR CLIENTE POR ID
       ======================================================== */

    buscarPorId(id) {

        const clientes = this.listar();

        return clientes.find(
            cliente =>
                String(cliente.id) === String(id)
        ) || null;
    },


    /* ========================================================
       PESQUISAR CLIENTES
       ======================================================== */

    pesquisar(termo = "") {

        const texto = String(termo)
            .trim()
            .toLowerCase();

        if (!texto) {
            return this.listar();
        }

        return this.listar().filter(cliente => {

            return (
                String(cliente.nome || "")
                    .toLowerCase()
                    .includes(texto)

                ||

                String(cliente.telefone || "")
                    .toLowerCase()
                    .includes(texto)

                ||

                String(cliente.email || "")
                    .toLowerCase()
                    .includes(texto)

                ||

                String(cliente.cpf || "")
                    .toLowerCase()
                    .includes(texto)
            );

        });
    },


    /* ========================================================
       GERAR ID
       ======================================================== */

    gerarId() {

        return (
            Date.now().toString() +
            Math.random()
                .toString(36)
                .substring(2, 8)
        );
    },


    /* ========================================================
       NORMALIZAR DADOS
       ======================================================== */

    normalizar(dados = {}) {

        return {

            id:
                dados.id ||
                this.gerarId(),

            nome:
                String(dados.nome || "")
                    .trim(),

            telefone:
                String(dados.telefone || "")
                    .trim(),

            email:
                String(dados.email || "")
                    .trim(),

            cpf:
                String(dados.cpf || "")
                    .trim(),

            endereco:
                String(dados.endereco || "")
                    .trim(),

            numero:
                String(dados.numero || "")
                    .trim(),

            bairro:
                String(dados.bairro || "")
                    .trim(),

            cidade:
                String(dados.cidade || "")
                    .trim(),

            observacoes:
                String(dados.observacoes || "")
                    .trim(),

            criadoEm:
                dados.criadoEm ||
                new Date().toISOString(),

            atualizadoEm:
                new Date().toISOString()
        };
    },


    /* ========================================================
       VALIDAR CLIENTE
       ======================================================== */

    validar(dados) {

        if (!dados.nome) {

            return {
                valido: false,
                mensagem:
                    "Informe o nome do cliente."
            };
        }

        return {
            valido: true,
            mensagem: ""
        };
    },


    /* ========================================================
       VERIFICAR NOME DUPLICADO
       ======================================================== */

    existeNome(nome, ignorarId = null) {

        const texto = String(nome || "")
            .trim()
            .toLowerCase();

        if (!texto) {
            return false;
        }

        return this.listar().some(cliente => {

            if (
                ignorarId !== null &&
                String(cliente.id) === String(ignorarId)
            ) {
                return false;
            }

            return String(cliente.nome || "")
                .trim()
                .toLowerCase() === texto;
        });
    },


    /* ========================================================
       CADASTRAR
       ======================================================== */

    cadastrar(dados) {

        const cliente =
            this.normalizar(dados);

        const validacao =
            this.validar(cliente);

        if (!validacao.valido) {

            this.mensagem(
                validacao.mensagem,
                "erro"
            );

            return null;
        }

        if (
            this.existeNome(cliente.nome)
        ) {

            this.mensagem(
                "Já existe um cliente cadastrado com esse nome.",
                "erro"
            );

            return null;
        }

        const clientes =
            this.listar();

        clientes.push(cliente);

        JCStorage.salvarClientes(clientes);

        this.atualizarTela();

        this.mensagem(
            "Cliente cadastrado com sucesso.",
            "sucesso"
        );

        return cliente;
    },


    /* ========================================================
       EDITAR
       ======================================================== */

    editar(id, dados) {

        const clientes =
            this.listar();

        const indice =
            clientes.findIndex(
                cliente =>
                    String(cliente.id) ===
                    String(id)
            );

        if (indice === -1) {

            this.mensagem(
                "Cliente não encontrado.",
                "erro"
            );

            return null;
        }

        const clienteAtual =
            clientes[indice];

        const cliente =
            this.normalizar({
                ...clienteAtual,
                ...dados,
                id: clienteAtual.id,
                criadoEm:
                    clienteAtual.criadoEm
            });

        const validacao =
            this.validar(cliente);

        if (!validacao.valido) {

            this.mensagem(
                validacao.mensagem,
                "erro"
            );

            return null;
        }

        if (
            this.existeNome(
                cliente.nome,
                cliente.id
            )
        ) {

            this.mensagem(
                "Já existe outro cliente com esse nome.",
                "erro"
            );

            return null;
        }

        clientes[indice] =
            cliente;

        JCStorage.salvarClientes(clientes);

        this.atualizarTela();

        this.mensagem(
            "Cliente atualizado com sucesso.",
            "sucesso"
        );

        return cliente;
    },


    /* ========================================================
       EXCLUIR
       ======================================================== */

    excluir(id) {

        const cliente =
            this.buscarPorId(id);

        if (!cliente) {

            this.mensagem(
                "Cliente não encontrado.",
                "erro"
            );

            return false;
        }

        const confirmar =
            confirm(
                `Deseja excluir o cliente "${cliente.nome}"?`
            );

        if (!confirmar) {
            return false;
        }

        const clientes =
            this.listar().filter(
                item =>
                    String(item.id) !==
                    String(id)
            );

        JCStorage.salvarClientes(clientes);

        this.atualizarTela();

        this.mensagem(
            "Cliente excluído com sucesso.",
            "sucesso"
        );

        return true;
    },


    /* ========================================================
       ATUALIZAR TELA
       ======================================================== */

    atualizarTela() {

        this.renderizarLista();

        this.atualizarResumo();
    },


    /* ========================================================
       RENDERIZAR LISTA
       ======================================================== */

    renderizarLista() {

        const tabela =
            document.getElementById(
                "listaClientes"
            );

        if (!tabela) {
            return;
        }

        const clientes =
            this.pesquisar(
                this.termoPesquisa || ""
            );

        tabela.innerHTML = "";

        if (clientes.length === 0) {

            tabela.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="sem-registros"
                    >
                        Nenhum cliente cadastrado.
                    </td>
                </tr>
            `;

            return;
        }

        clientes.forEach(cliente => {

            const linha =
                document.createElement("tr");

            linha.innerHTML = `

                <td>
                    <strong>
                        ${this.escapeHTML(
                            cliente.nome
                        )}
                    </strong>
                </td>

                <td>
                    ${this.escapeHTML(
                        cliente.telefone || "-"
                    )}
                </td>

                <td>
                    ${this.escapeHTML(
                        cliente.email || "-"
                    )}
                </td>

                <td>
                    ${this.escapeHTML(
                        cliente.cpf || "-"
                    )}
                </td>

                <td>
                    ${this.escapeHTML(
                        cliente.cidade || "-"
                    )}
                </td>

                <td class="acoes">

                    <button
                        type="button"
                        class="btn-editar-cliente"
                        data-id="${cliente.id}"
                        title="Editar"
                    >
                        ✏️ Editar
                    </button>

                    <button
                        type="button"
                        class="btn-excluir-cliente"
                        data-id="${cliente.id}"
                        title="Excluir"
                    >
                        🗑️ Excluir
                    </button>

                </td>
            `;

            tabela.appendChild(linha);
        });
    },


    /* ========================================================
       RESUMO
       ======================================================== */

    atualizarResumo() {

        const total =
            this.listar().length;

        const elemento =
            document.getElementById(
                "clientesTotal"
            );

        if (elemento) {
            elemento.textContent =
                total;
        }

        const elementoPasta =
            document.getElementById(
                "clientesTotalPasta"
            );

        if (elementoPasta) {
            elementoPasta.textContent =
                total;
        }
    },


    /* ========================================================
       MODAL
       ======================================================== */

    abrirModal(cliente = null) {

        const modal =
            document.getElementById(
                "modalCliente"
            );

        if (!modal) {
            return;
        }

        const titulo =
            document.getElementById(
                "tituloModalCliente"
            );

        const form =
            document.getElementById(
                "formCliente"
            );

        if (form) {
            form.reset();
        }

        const campoId =
            document.getElementById(
                "clienteId"
            );

        if (cliente) {

            if (titulo) {
                titulo.textContent =
                    "Editar cliente";
            }

            if (campoId) {
                campoId.value =
                    cliente.id;
            }

            this.preencherCampo(
                "clienteNome",
                cliente.nome
            );

            this.preencherCampo(
                "clienteTelefone",
                cliente.telefone
            );

            this.preencherCampo(
                "clienteEmail",
                cliente.email
            );

            this.preencherCampo(
                "clienteCpf",
                cliente.cpf
            );

            this.preencherCampo(
                "clienteEndereco",
                cliente.endereco
            );

            this.preencherCampo(
                "clienteNumero",
                cliente.numero
            );

            this.preencherCampo(
                "clienteBairro",
                cliente.bairro
            );

            this.preencherCampo(
                "clienteCidade",
                cliente.cidade
            );

            this.preencherCampo(
                "clienteObservacoes",
                cliente.observacoes
            );

        } else {

            if (titulo) {
                titulo.textContent =
                    "Novo cliente";
            }

            if (campoId) {
                campoId.value = "";
            }
        }

        modal.hidden = false;

        document.body.classList.add(
            "modal-aberto"
        );

        setTimeout(() => {

            const nome =
                document.getElementById(
                    "clienteNome"
                );

            if (nome) {
                nome.focus();
            }

        }, 100);
    },


    /* ========================================================
       FECHAR MODAL
       ======================================================== */

    fecharModal() {

        const modal =
            document.getElementById(
                "modalCliente"
            );

        if (!modal) {
            return;
        }

        modal.hidden = true;

        document.body.classList.remove(
            "modal-aberto"
        );
    },


    /* ========================================================
       PREENCHER CAMPO
       ======================================================== */

    preencherCampo(id, valor) {

        const campo =
            document.getElementById(id);

        if (campo) {
            campo.value =
                valor || "";
        }
    },


    /* ========================================================
       SALVAR FORMULÁRIO
       ======================================================== */

    salvarFormulario() {

        const campoId =
            document.getElementById(
                "clienteId"
            );

        const dados = {

            nome:
                this.valorCampo(
                    "clienteNome"
                ),

            telefone:
                this.valorCampo(
                    "clienteTelefone"
                ),

            email:
                this.valorCampo(
                    "clienteEmail"
                ),

            cpf:
                this.valorCampo(
                    "clienteCpf"
                ),

            endereco:
                this.valorCampo(
                    "clienteEndereco"
                ),

            numero:
                this.valorCampo(
                    "clienteNumero"
                ),

            bairro:
                this.valorCampo(
                    "clienteBairro"
                ),

            cidade:
                this.valorCampo(
                    "clienteCidade"
                ),

            observacoes:
                this.valorCampo(
                    "clienteObservacoes"
                )
        };

        let resultado;

        if (
            campoId &&
            campoId.value
        ) {

            resultado =
                this.editar(
                    campoId.value,
                    dados
                );

        } else {

            resultado =
                this.cadastrar(
                    dados
                );
        }

        if (resultado) {
            this.fecharModal();
        }
    },


    /* ========================================================
       VALOR DO CAMPO
       ======================================================== */

    valorCampo(id) {

        const campo =
            document.getElementById(id);

        return campo
            ? campo.value.trim()
            : "";
    },


    /* ========================================================
       PESQUISA NA TELA
       ======================================================== */

    pesquisarTela(valor) {

        this.termoPesquisa =
            String(valor || "");

        this.renderizarLista();
    },


    /* ========================================================
       MENSAGEM
       ======================================================== */

    mensagem(texto, tipo = "sucesso") {

        let elemento =
            document.getElementById(
                "mensagemClientes"
            );

        if (!elemento) {

            elemento =
                document.createElement(
                    "div"
                );

            elemento.id =
                "mensagemClientes";

            elemento.className =
                "mensagem-clientes";

            document.body.appendChild(
                elemento
            );
        }

        elemento.textContent =
            texto;

        elemento.className =
            `mensagem-clientes ${tipo}`;

        clearTimeout(
            this._timerMensagem
        );

        this._timerMensagem =
            setTimeout(() => {

                elemento.classList.add(
                    "oculta"
                );

            }, 3000);
    },


    /* ========================================================
       ESCAPAR HTML
       ======================================================== */

    escapeHTML(valor) {

        return String(valor || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },


    /* ========================================================
       EVENTOS
       ======================================================== */

    configurarEventos() {

        const botaoNovo =
            document.getElementById(
                "novoCliente"
            );

        if (botaoNovo) {

            botaoNovo.addEventListener(
                "click",
                () => {

                    this.abrirModal();
                }
            );
        }


        const botaoFechar =
            document.getElementById(
                "fecharModalCliente"
            );

        if (botaoFechar) {

            botaoFechar.addEventListener(
                "click",
                () => {

                    this.fecharModal();
                }
            );
        }


        const botaoCancelar =
            document.getElementById(
                "cancelarCliente"
            );

        if (botaoCancelar) {

            botaoCancelar.addEventListener(
                "click",
                () => {

                    this.fecharModal();
                }
            );
        }


        const form =
            document.getElementById(
                "formCliente"
            );

        if (form) {

            form.addEventListener(
                "submit",
                evento => {

                    evento.preventDefault();

                    this.salvarFormulario();
                }
            );
        }


        const pesquisa =
            document.getElementById(
                "pesquisaClientes"
            );

        if (pesquisa) {

            pesquisa.addEventListener(
                "input",
                evento => {

                    this.pesquisarTela(
                        evento.target.value
                    );
                }
            );
        }


        const tabela =
            document.getElementById(
                "listaClientes"
            );

        if (tabela) {

            tabela.addEventListener(
                "click",
                evento => {

                    const editar =
                        evento.target.closest(
                            ".btn-editar-cliente"
                        );

                    const excluir =
                        evento.target.closest(
                            ".btn-excluir-cliente"
                        );

                    if (editar) {

                        const cliente =
                            this.buscarPorId(
                                editar.dataset.id
                            );

                        if (cliente) {
                            this.abrirModal(
                                cliente
                            );
                        }

                        return;
                    }

                    if (excluir) {

                        this.excluir(
                            excluir.dataset.id
                        );
                    }
                }
            );
        }


        const modal =
            document.getElementById(
                "modalCliente"
            );

        if (modal) {

            modal.addEventListener(
                "click",
                evento => {

                    if (
                        evento.target ===
                        modal
                    ) {
                        this.fecharModal();
                    }
                }
            );
        }
    },


    /* ========================================================
       INICIALIZAÇÃO
       ======================================================== */

    iniciar() {

        this.termoPesquisa = "";

        this.configurarEventos();

        this.atualizarTela();
    }
};


/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        JCClientes.iniciar();
    }
);