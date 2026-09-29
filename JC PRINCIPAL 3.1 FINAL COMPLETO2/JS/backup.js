/* =========================================================
   J.C IMPORTS
   MÓDULO: BACKUP E RESTAURAÇÃO
   ========================================================= */


/* =========================================================
   FAZER BACKUP
   ========================================================= */

function fazerBackup(){

    try{

        const dadosBackup = {

            sistema: "J.C Imports",

            versao: "1.0",

            dataBackup:
                new Date().toISOString(),

            dados: {}

        };


        /* =====================================================
           COPIAR TODOS OS DADOS DO LOCALSTORAGE
           ===================================================== */

        for(let i = 0; i < localStorage.length; i++){

            const chave =
                localStorage.key(i);

            if(!chave){
                continue;
            }

            try{

                const valor =
                    localStorage.getItem(chave);

                dadosBackup.dados[chave] =
                    JSON.parse(valor);

            }catch(erro){

                /*
                 * Se algum item não for JSON,
                 * guarda o valor original.
                 */

                dadosBackup.dados[chave] =
                    localStorage.getItem(chave);

            }

        }


        /* =====================================================
           TRANSFORMAR EM JSON
           ===================================================== */

        const conteudo =
            JSON.stringify(
                dadosBackup,
                null,
                2
            );


        /* =====================================================
           CRIAR ARQUIVO
           ===================================================== */

        const arquivo =
            new Blob(
                [conteudo],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                arquivo
            );


        const link =
            document.createElement("a");


        const data =
            new Date();


        const ano =
            data.getFullYear();


        const mes =
            String(
                data.getMonth() + 1
            ).padStart(2,"0");


        const dia =
            String(
                data.getDate()
            ).padStart(2,"0");


        const hora =
            String(
                data.getHours()
            ).padStart(2,"0");


        const minuto =
            String(
                data.getMinutes()
            ).padStart(2,"0");


        const nomeArquivo =
            "backup-jc-imports-" +
            ano + "-" +
            mes + "-" +
            dia + "-" +
            hora + "-" +
            minuto +
            ".json";


        link.href =
            url;


        link.download =
            nomeArquivo;


        document.body.appendChild(
            link
        );


        link.click();


        document.body.removeChild(
            link
        );


        URL.revokeObjectURL(
            url
        );


        /* =====================================================
           MENSAGEM
           ===================================================== */

        if(
            typeof mostrarNotificacao ===
            "function"
        ){

            mostrarNotificacao(
                "Backup realizado com sucesso"
            );

        }else{

            alert(
                "Backup realizado com sucesso!"
            );

        }


        console.log(
            "J.C Imports: backup criado com sucesso."
        );


    }catch(erro){

        console.error(
            "Erro ao fazer backup:",
            erro
        );


        alert(
            "Não foi possível realizar o backup."
        );

    }

}


/* =========================================================
   ABRIR SELEÇÃO DO BACKUP
   ========================================================= */

function selecionarBackup(){

    const input =
        document.getElementById(
            "inputBackup"
        );


    if(!input){

        alert(
            "Campo de seleção do backup não encontrado."
        );

        return;

    }


    input.click();

}


/* =========================================================
   RESTAURAR BACKUP
   ========================================================= */

function restaurarBackup(event){

    const arquivo =
        event &&
        event.target &&
        event.target.files
            ? event.target.files[0]
            : null;


    if(!arquivo){

        return;

    }


    /* =====================================================
       VALIDAR EXTENSÃO
       ===================================================== */

    if(
        !arquivo.name
            .toLowerCase()
            .endsWith(".json")
    ){

        alert(
            "Selecione um arquivo de backup válido."
        );


        event.target.value =
            "";

        return;

    }


    /* =====================================================
       LER ARQUIVO
       ===================================================== */

    const leitor =
        new FileReader();


    leitor.onload =
        function(e){

            try{

                const dados =
                    JSON.parse(
                        e.target.result
                    );


                /* =============================================
                   VALIDAR ESTRUTURA
                   ============================================= */

                if(
                    !dados ||
                    typeof dados !== "object" ||
                    !dados.dados ||
                    typeof dados.dados !== "object"
                ){

                    alert(
                        "Este arquivo não é um backup válido do J.C Imports."
                    );

                    return;

                }


                const quantidade =
                    Object.keys(
                        dados.dados
                    ).length;


                /* =============================================
                   CONFIRMAÇÃO
                   ============================================= */

                const confirmar =
                    confirm(

                        "⚠️ RESTAURAR BACKUP\n\n" +

                        "Sistema: J.C Imports\n" +

                        "Data do backup: " +
                        (
                            dados.dataBackup ||
                            "Não informada"
                        ) +

                        "\n\n" +

                        "Registros armazenados: " +
                        quantidade +

                        "\n\n" +

                        "ATENÇÃO:\n" +

                        "Os dados atuais armazenados neste navegador " +
                        "serão substituídos pelos dados deste backup.\n\n" +

                        "Deseja continuar?"

                    );


                if(!confirmar){

                    event.target.value =
                        "";

                    return;

                }


                /* =============================================
                   CRIAR CÓPIA DE SEGURANÇA DOS DADOS ATUAIS
                   ANTES DA RESTAURAÇÃO
                   ============================================= */

                const backupAnterior = {};

                for(
                    let i = 0;
                    i < localStorage.length;
                    i++
                ){

                    const chave =
                        localStorage.key(i);

                    if(!chave){
                        continue;
                    }

                    backupAnterior[chave] =
                        localStorage.getItem(chave);

                }


                /* =============================================
                   LIMPAR LOCALSTORAGE
                   ============================================= */

                localStorage.clear();


                /* =============================================
                   RESTAURAR DADOS
                   ============================================= */

                Object.keys(
                    dados.dados
                ).forEach(
                    function(chave){

                        const valor =
                            dados.dados[chave];


                        if(
                            typeof valor ===
                            "string"
                        ){

                            localStorage.setItem(
                                chave,
                                valor
                            );

                        }else{

                            localStorage.setItem(
                                chave,
                                JSON.stringify(
                                    valor
                                )
                            );

                        }

                    }
                );


                /* =============================================
                   LIMPAR INPUT
                   ============================================= */

                event.target.value =
                    "";


                /* =============================================
                   MENSAGEM
                   ============================================= */

                alert(
                    "Backup restaurado com sucesso!\n\n" +
                    "O sistema será recarregado."
                );


                /* =============================================
                   RECARREGAR SISTEMA
                   ============================================= */

                window.location.reload();


            }catch(erro){

                console.error(
                    "Erro ao restaurar backup:",
                    erro
                );


                alert(
                    "Não foi possível restaurar o backup.\n\n" +
                    "O arquivo pode estar corrompido ou " +
                    "não ser um backup válido do J.C Imports."
                );


                event.target.value =
                    "";

            }

        };


    leitor.onerror =
        function(){

            alert(
                "Não foi possível ler o arquivo de backup."
            );


            event.target.value =
                "";

        };


    leitor.readAsText(
        arquivo
    );

}




/* =========================================================
   RESETAR DADOS DO SISTEMA
   ========================================================= */

function resetarSistema(){

    const primeiraConfirmacao = confirm(
        "⚠️ RESETAR DADOS\n\n" +
        "Esta ação apagará os dados locais do J.C Imports " +
        "deste navegador, incluindo vendas, compras, clientes, " +
        "produtos, financeiro e contas a receber.\n\n" +
        "Os arquivos de backup salvos no computador não serão apagados.\n\n" +
        "Deseja continuar?"
    );

    if(!primeiraConfirmacao){
        return;
    }

    const segundaConfirmacao = confirm(
        "ÚLTIMA CONFIRMAÇÃO\n\n" +
        "Todos os dados locais do sistema serão apagados.\n\n" +
        "Clique em OK somente se realmente deseja iniciar um sistema limpo."
    );

    if(!segundaConfirmacao){
        return;
    }

    try{

        const chavesSistema = [
            "jc_imports_sistema",
            "jc_imports_produtos",
            "jc_imports_clientes",
            "jc_imports_vendas",
            "jc_imports_financeiro",
            "jc_imports_contas_receber",
            "jc_imports_configuracoes",
            "jc_imports_compras",
            "jc_imports_nuvem_updated_at"
        ];

        chavesSistema.forEach(function(chave){
            localStorage.removeItem(chave);
        });

        alert(
            "Reset concluído com sucesso.\n\n" +
            "O sistema será recarregado com os dados iniciais."
        );

        window.location.reload();

    }catch(erro){

        console.error("Erro ao resetar o sistema:", erro);

        alert(
            "Não foi possível concluir o reset dos dados."
        );

    }
}


/* =========================================================
   DISPONIBILIZAR AS FUNÇÕES NO WINDOW
   =========================================================

   Isso é importante porque o index.html verifica:

   window.fazerBackup
   window.selecionarBackup
   window.restaurarBackup
   ========================================================= */

window.fazerBackup =
    fazerBackup;


window.selecionarBackup =
    selecionarBackup;


window.restaurarBackup =
    restaurarBackup;

window.resetarSistema =
    resetarSistema;


/* =========================================================
   CONFIRMAÇÃO NO CONSOLE
   ========================================================= */

console.log(
    "J.C Imports: módulo de Backup carregado."
);