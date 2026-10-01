/* =========================================================
   J.C IMPORTS — NUVEM / SINCRONIZAÇÃO MULTIDISPOSITIVO
   Backend: Supabase (PostgreSQL + Auth)
   O sistema continua funcionando localmente quando offline.
   ========================================================= */

(function () {
    "use strict";

    const CFG_KEY = "jc_imports_nuvem_config";
    const LOCAL_UPDATED_KEY = "jc_imports_nuvem_updated_at";
    const SUPABASE_CDN =
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    let client = null;
    let autoSyncTimer = null;
    let booted = false;


    /* =====================================================
       UTILITÁRIOS
       ===================================================== */

    function now() {
        return new Date().toISOString();
    }


    const DEFAULT_SUPABASE_URL =
        "https://rxztexpthdytfixgpkmk.supabase.co";


    const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_xPO2QJWmLnT7ExE1D3lEnw_Xk7_l_Gq";


    function getCfg() {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        CFG_KEY
                    ) || "{}"
                );


            let url =
                String(
                    saved.url || ""
                )
                .trim()
                .replace(
                    /\/+$/,
                    ""
                );


            /*
               Migração de URLs antigas/incorretas.
            */

            if (
                !url ||
                (
                    url.includes("supabase.co") &&
                    url !== DEFAULT_SUPABASE_URL
                )
            ) {

                url =
                    DEFAULT_SUPABASE_URL;


                localStorage.setItem(
                    CFG_KEY,
                    JSON.stringify({
                        url: url,
                        anonKey:
                            saved.anonKey ||
                            DEFAULT_SUPABASE_PUBLISHABLE_KEY
                    })
                );

            }


            return {

                url: url,

                anonKey:
                    saved.anonKey ||
                    DEFAULT_SUPABASE_PUBLISHABLE_KEY

            };


        } catch (_) {

            return {

                url:
                    DEFAULT_SUPABASE_URL,

                anonKey:
                    DEFAULT_SUPABASE_PUBLISHABLE_KEY

            };

        }

    }


    function saveCfg(cfg) {

        localStorage.setItem(
            CFG_KEY,
            JSON.stringify(cfg)
        );

    }


    function localUpdatedAt() {

        return (
            localStorage.getItem(
                LOCAL_UPDATED_KEY
            ) ||
            "1970-01-01T00:00:00.000Z"
        );

    }


    function markLocalUpdated() {

        localStorage.setItem(
            LOCAL_UPDATED_KEY,
            now()
        );

    }


    /* =====================================================
       CARREGAR SUPABASE
       ===================================================== */

    function loadSupabase() {

        if (window.supabase) {

            return Promise.resolve(
                window.supabase
            );

        }


        return new Promise(
            function (resolve, reject) {

                const old =
                    document.querySelector(
                        'script[data-jc-supabase="1"]'
                    );


                if (old) {

                    old.addEventListener(
                        "load",
                        function () {

                            resolve(
                                window.supabase
                            );

                        }
                    );


                    old.addEventListener(
                        "error",
                        reject
                    );


                    return;

                }


                const s =
                    document.createElement(
                        "script"
                    );


                s.src =
                    SUPABASE_CDN;

                s.async = true;

                s.dataset.jcSupabase =
                    "1";


                s.onload =
                    function () {

                        resolve(
                            window.supabase
                        );

                    };


                s.onerror =
                    function () {

                        reject(
                            new Error(
                                "Não foi possível carregar o serviço de nuvem."
                            )
                        );

                    };


                document.head.appendChild(
                    s
                );

            }
        );

    }


    /* =====================================================
       CONECTAR
       ===================================================== */

    async function conectar() {

        const cfg =
            getCfg();


        if (
            !cfg.url ||
            !cfg.anonKey
        ) {

            throw new Error(
                "Informe a URL e a chave pública (anon key) do Supabase."
            );

        }


        const sb =
            await loadSupabase();


        client =
            sb.createClient(
                cfg.url.replace(
                    /\/$/,
                    ""
                ),
                cfg.anonKey,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                }
            );


        return client;

    }


    /* =====================================================
       MENSAGEM
       ===================================================== */

    function toast(
        msg,
        tipo
    ) {

        if (
            window.JCApp &&
            typeof JCApp.mostrarToast ===
                "function"
        ) {

            JCApp.mostrarToast(
                msg,
                tipo || "info"
            );

        } else {

            console.log(
                "[Nuvem]",
                msg
            );

        }

    }


    /* =====================================================
       DADOS LOCAIS
       ===================================================== */

    function dadosLocais() {

        if (
            !window.JCStorage ||
            typeof JCStorage.obterTodosDados !==
                "function"
        ) {

            throw new Error(
                "Armazenamento local indisponível."
            );

        }


        const dados = JCStorage.obterTodosDados();

        /*
           Além do objeto estruturado do sistema, guardamos uma cópia
           das chaves jc_imports_* do localStorage. Isso evita que um
           módulo criado posteriormente (por exemplo Despesas) fique
           fora da nuvem por não estar listado no storage.js.
           Credenciais/configuração da nuvem nunca entram no payload.
        */
        const localStorageData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith("jc_imports_")) continue;
            if (key === CFG_KEY || key === LOCAL_UPDATED_KEY) continue;
            try {
                localStorageData[key] = JSON.parse(localStorage.getItem(key));
            } catch (_) {
                localStorageData[key] = localStorage.getItem(key);
            }
        }

        dados.__localStorage = localStorageData;
        return dados;

    }


    /* =====================================================
       SESSÃO
       ===================================================== */

    async function session() {

        if (!client) {

            await conectar();

        }


        const {
            data,
            error
        } =
            await client.auth.getSession();


        if (error) {

            throw error;

        }


        return data.session;

    }


    /* =====================================================
       CRIAR CONTA
       ===================================================== */

    async function criarConta(
        email,
        senha
    ) {

        if (!client) {

            await conectar();

        }


        const {
            data,
            error
        } =
            await client.auth.signUp({
                email: email,
                password: senha
            });


        if (error) {

            throw error;

        }


        return data;

    }


    /* =====================================================
       ENTRAR
       ===================================================== */

    async function entrar(
        email,
        senha
    ) {

        if (!client) {

            await conectar();

        }


        const {
            data,
            error
        } =
            await client.auth.signInWithPassword({
                email: email,
                password: senha
            });


        if (error) {

            throw error;

        }


        return data;

    }


    /* =====================================================
       SAIR
       ===================================================== */

    async function sair() {

        if (client) {

            await client.auth.signOut();

        }


        render();

    }


    /* =====================================================
       ENVIAR PARA A NUVEM
       ===================================================== */

    async function enviarNuvem(
        silencioso
    ) {

        try {

            const s =
                await session();


            if (
                !s ||
                !s.user
            ) {

                throw new Error(
                    "Faça login para sincronizar."
                );

            }


            const payload =
                dadosLocais();


            const updatedAt =
                localUpdatedAt();


            const row = {

                user_id:
                    s.user.id,

                payload:
                    payload,

                updated_at:
                    updatedAt

            };


            const {
                error
            } =
                await client
                    .from(
                        "jc_imports_nuvem"
                    )
                    .upsert(
                        row,
                        {
                            onConflict:
                                "user_id"
                        }
                    );


            if (error) {

                throw error;

            }


            if (!silencioso) {

                toast(
                    "Dados enviados para a nuvem.",
                    "success"
                );

            }


            return true;


        } catch (e) {

            console.error(e);


            if (!silencioso) {

                toast(
                    e.message ||
                        "Não foi possível sincronizar.",
                    "error"
                );

            }


            return false;

        }

    }


    /* =====================================================
       BAIXAR DA NUVEM
       ===================================================== */

    async function baixarNuvem(
        silencioso,
        forcar
    ) {

        try {

            const s =
                await session();


            if (
                !s ||
                !s.user
            ) {

                throw new Error(
                    "Faça login para sincronizar."
                );

            }


            const {
                data,
                error
            } =
                await client
                    .from(
                        "jc_imports_nuvem"
                    )
                    .select(
                        "payload,updated_at"
                    )
                    .eq(
                        "user_id",
                        s.user.id
                    )
                    .maybeSingle();


            if (error) {

                throw error;

            }


            if (!data) {

                if (!silencioso) {

                    toast(
                        "Ainda não existe uma cópia na nuvem. Envie os dados deste aparelho primeiro.",
                        "info"
                    );

                }


                return false;

            }


            const remoteTime =
                new Date(
                    data.updated_at || 0
                ).getTime();


            const localTime =
                new Date(
                    localUpdatedAt()
                ).getTime();


            if (
                localTime > remoteTime &&
                !silencioso &&
                !forcar
            ) {

                const ok =
                    confirm(
                        "Os dados deste aparelho são mais recentes que os da nuvem. Substituir os dados locais pelos dados da nuvem?"
                    );


                if (!ok) {

                    return false;

                }

            }


            if (
                !window.JCStorage ||
                typeof JCStorage.restaurarTodosDados !==
                    "function"
            ) {

                throw new Error(
                    "Restauração local indisponível."
                );

            }


            window.__jcCloudRestoring = true;
            let result;
            try {
                const payload = data.payload || {};

                /* Restaura também as chaves jc_imports_* que pertencem aos
                   módulos, sem tocar nas credenciais da nuvem. */
                if (payload.__localStorage && typeof payload.__localStorage === "object") {
                    Object.entries(payload.__localStorage).forEach(([key, value]) => {
                        if (!key.startsWith("jc_imports_")) return;
                        if (key === CFG_KEY || key === LOCAL_UPDATED_KEY) return;
                        try {
                            localStorage.setItem(key, JSON.stringify(value));
                        } catch (_) {}
                    });
                }

                result = JCStorage.restaurarTodosDados(payload);
            } finally {
                window.__jcCloudRestoring = false;
            }


            if (
                !result ||
                result.sucesso === false
            ) {

                throw new Error(
                    result &&
                    result.mensagem
                        ? result.mensagem
                        : "Falha ao restaurar dados."
                );

            }


            localStorage.setItem(
                LOCAL_UPDATED_KEY,
                data.updated_at ||
                    now()
            );


            if (!silencioso) {

                toast(
                    "Dados da nuvem carregados. Recarregue a página para atualizar todas as telas.",
                    "success"
                );


                setTimeout(
                    function () {

                        location.reload();

                    },
                    1200
                );

            }


            return true;


        } catch (e) {

            console.error(e);


            if (!silencioso) {

                toast(
                    e.message ||
                        "Não foi possível baixar os dados.",
                    "error"
                );

            }


            return false;

        }

    }


    /* =====================================================
       SINCRONIZAR
       ===================================================== */

    async function sincronizar() {

        const s =
            await session();


        if (!s) {

            throw new Error(
                "Faça login para sincronizar."
            );

        }


        const {
            data,
            error
        } =
            await client
                .from(
                    "jc_imports_nuvem"
                )
                .select(
                    "updated_at"
                )
                .eq(
                    "user_id",
                    s.user.id
                )
                .maybeSingle();


        if (error) {

            throw error;

        }


        if (!data) {

            return enviarNuvem(
                false
            );

        }


        const remote =
            new Date(
                data.updated_at || 0
            ).getTime();


        const local =
            new Date(
                localUpdatedAt()
            ).getTime();


        if (
            remote > local
        ) {

            return baixarNuvem(
                false
            );

        }


        return enviarNuvem(
            false
        );

    }


    /* =====================================================
       SINCRONIZAÇÃO AUTOMÁTICA
       ===================================================== */

    function iniciarAutoSync() {

        clearInterval(
            autoSyncTimer
        );


        autoSyncTimer =
            setInterval(
                function () {

                    if (
                        navigator.onLine &&
                        client
                    ) {

                        enviarNuvem(
                            true
                        );

                    }

                },
                120000
            );

    }


    /* =====================================================
       ALTERAÇÃO LOCAL
       ===================================================== */

    async function onLocalChange() {

        markLocalUpdated();


        if (
            !navigator.onLine ||
            !client
        ) {

            return;

        }


        clearTimeout(
            window.__jcCloudDebounce
        );


        window.__jcCloudDebounce =
            setTimeout(
                function () {

                    enviarNuvem(
                        true
                    );

                },
                1500
            );

    }


    /* =====================================================
       RENDERIZAR
       ===================================================== */

    function render() {

        const host =
            document.getElementById(
                "nuvemContent"
            );


        if (!host) {

            return;

        }


        const cfg =
            getCfg();


        const url =
            document.getElementById(
                "jcCloudUrl"
            );


        const key =
            document.getElementById(
                "jcCloudKey"
            );


        if (url) {

            url.value =
                cfg.url || "";

        }


        if (key) {

            key.value =
                cfg.anonKey || "";

        }


        bindCloudUI();

        updateStatus();

    }


    /* =====================================================
       FUNÇÕES DE INTERFACE
       ===================================================== */

    function escapeHtml(v) {

        return String(v).replace(
            /[&<>'"]/g,
            function (c) {

                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    "'": "&#39;",
                    '"': "&quot;"
                }[c];

            }
        );

    }


    function val(id) {

        const e =
            document.getElementById(
                id
            );


        return e
            ? e.value.trim()
            : "";

    }


    function info(
        msg,
        error
    ) {

        const e =
            document.getElementById(
                "jcCloudInfo"
            );


        if (e) {

            e.textContent =
                msg;

        }


        if (error) {

            console.error(
                msg
            );

        }

    }


    /* =====================================================
       STATUS
       ===================================================== */

    async function updateStatus() {

        const el =
            document.getElementById(
                "jcCloudStatus"
            );


        if (!el) {

            return;

        }


        try {

            const s =
                await session();


            el.textContent =
                s
                    ? `Conectado: ${s.user.email}`
                    : "Não conectado";


            el.dataset.status =
                s
                    ? "ok"
                    : "off";


        } catch (_) {

            el.textContent =
                "Configure a conexão";


            el.dataset.status =
                "off";

        }

    }


    /* =====================================================
       LIGAÇÃO DOS BOTÕES
       ===================================================== */

    function bindCloudUI() {

        const save =
            document.getElementById(
                "jcCloudSave"
            );


        const create =
            document.getElementById(
                "jcCloudCreate"
            );


        const login =
            document.getElementById(
                "jcCloudLogin"
            );


        const sync =
            document.getElementById(
                "jcCloudSync"
            );


        const down =
            document.getElementById(
                "jcCloudDownload"
            );


        const logout =
            document.getElementById(
                "jcCloudLogout"
            );


        /* =================================================
           SALVAR CONEXÃO
           ================================================= */

        if (save) {

            save.onclick =
                async function () {

                    save.disabled =
                        true;


                    try {

                        const url =
                            val(
                                "jcCloudUrl"
                            );


                        const anonKey =
                            val(
                                "jcCloudKey"
                            );


                        if (
                            !url ||
                            !anonKey
                        ) {

                            info(
                                "Informe a URL e a chave pública do Supabase.",
                                true
                            );


                            return;

                        }


                        saveCfg({
                            url:
                                url,

                            anonKey:
                                anonKey
                        });


                        await conectar();


                        info(
                            "Conexão salva com sucesso.",
                            false
                        );


                        await updateStatus();


                    } catch (e) {

                        console.error(
                            "Erro ao salvar conexão:",
                            e
                        );


                        info(
                            "Erro: " +
                            (
                                e &&
                                e.message
                                    ? e.message
                                    : String(e)
                            ),
                            true
                        );


                    } finally {

                        save.disabled =
                            false;

                    }

                };

        }


        /* =================================================
           CRIAR CONTA
           ================================================= */

        if (create) {

            create.onclick =
                async function () {

                    create.disabled =
                        true;


                    try {

                        const email =
                            val(
                                "jcCloudEmail"
                            );


                        const senha =
                            val(
                                "jcCloudPass"
                            );


                        if (
                            !email ||
                            !senha
                        ) {

                            info(
                                "Informe o e-mail e a senha.",
                                true
                            );


                            return;

                        }


                        await conectar();


                        await criarConta(
                            email,
                            senha
                        );


                        info(
                            "Conta criada. Verifique o e-mail caso o Supabase solicite confirmação.",
                            false
                        );


                        await updateStatus();


                    } catch (e) {

                        console.error(
                            "Erro ao criar conta:",
                            e
                        );


                        info(
                            "Erro: " +
                            (
                                e &&
                                e.message
                                    ? e.message
                                    : String(e)
                            ),
                            true
                        );


                    } finally {

                        create.disabled =
                            false;

                    }

                };

        }


        /* =================================================
           ENTRAR
           ================================================= */

        if (login) {

            login.onclick =
                async function () {

                    login.disabled =
                        true;


                    try {

                        const email =
                            val(
                                "jcCloudEmail"
                            );


                        const senha =
                            val(
                                "jcCloudPass"
                            );


                        if (
                            !email ||
                            !senha
                        ) {

                            info(
                                "Informe o e-mail e a senha.",
                                true
                            );


                            return;

                        }


                        await conectar();


                        await entrar(
                            email,
                            senha
                        );


                        info(
                            "Login realizado com sucesso.",
                            false
                        );


                        iniciarAutoSync();


                        await updateStatus();


                    } catch (e) {

                        console.error(
                            "Erro ao entrar:",
                            e
                        );


                        info(
                            "Erro: " +
                            (
                                e &&
                                e.message
                                    ? e.message
                                    : String(e)
                            ),
                            true
                        );


                    } finally {

                        login.disabled =
                            false;

                    }

                };

        }


        /* =================================================
           SINCRONIZAR AGORA
           ================================================= */

        if (sync) {

            sync.onclick =
                async function () {

                    sync.disabled =
                        true;


                    const textoOriginal =
                        sync.textContent;


                    sync.textContent =
                        "⏳ Sincronizando...";


                    info(
                        "Conectando à nuvem...",
                        false
                    );


                    try {

                        const ok =
                            await sincronizar();


                        await updateStatus();


                        if (
                            ok === true
                        ) {

                            info(
                                "✅ Sincronização concluída.",
                                false
                            );

                        } else {

                            info(
                                "Sincronização finalizada sem alterações.",
                                false
                            );

                        }


                    } catch (e) {

                        console.error(
                            "Erro na sincronização:",
                            e
                        );


                        info(
                            "❌ Erro: " +
                            (
                                e &&
                                e.message
                                    ? e.message
                                    : String(e)
                            ),
                            true
                        );


                    } finally {

                        sync.disabled =
                            false;


                        sync.textContent =
                            textoOriginal;

                    }

                };

        }


        /* =================================================
           BAIXAR DA NUVEM
           ================================================= */

        if (down) {

            down.onclick =
                async function () {

                    down.disabled =
                        true;


                    try {

                        info(
                            "Baixando dados da nuvem...",
                            false
                        );


                        await baixarNuvem(
                            false,
                            true
                        );


                        await updateStatus();


                    } catch (e) {

                        console.error(
                            "Erro ao baixar da nuvem:",
                            e
                        );


                        info(
                            "Erro: " +
                            (
                                e &&
                                e.message
                                    ? e.message
                                    : String(e)
                            ),
                            true
                        );


                    } finally {

                        down.disabled =
                            false;

                    }

                };

        }


        /* =================================================
           SAIR
           ================================================= */

        if (logout) {

            logout.onclick =
                async function () {

                    logout.disabled =
                        true;


                    try {

                        await sair();


                        info(
                            "Sessão encerrada neste aparelho.",
                            false
                        );


                        await updateStatus();


                    } catch (e) {

                        console.error(
                            "Erro ao sair:",
                            e
                        );


                        info(
                            "Erro: " +
                            (
                                e &&
                                e.message
                                    ? e.message
                                    : String(e)
                            ),
                            true
                        );


                    } finally {

                        logout.disabled =
                            false;

                    }

                };

        }

    }


    /* =====================================================
       ESTILOS
       ===================================================== */

    function injectStyles() {

        if (
            document.getElementById(
                "jc-cloud-style"
            )
        ) {

            return;

        }


        const s =
            document.createElement(
                "style"
            );


        s.id =
            "jc-cloud-style";


        s.textContent = `
            .jc-cloud-card{
                margin-top:18px;
                padding:20px;
                border:1px solid #d9e2ef;
                border-radius:16px;
                background:#fff;
                box-shadow:0 8px 24px rgba(16,40,70,.06)
            }

            .jc-cloud-head{
                display:flex;
                justify-content:space-between;
                gap:20px;
                align-items:flex-start;
                width:100%;
                min-width:0
            }

            .jc-cloud-head>div{
                flex:1 1 auto;
                min-width:0
            }

            .jc-cloud-head h3,
            .jc-cloud-head p{
                max-width:100%;
                overflow-wrap:anywhere
            }

            .jc-cloud-head h3{
                margin:0 0 6px
            }

            .jc-cloud-head p{
                margin:0;
                color:#667085;
                line-height:1.5
            }

            .jc-cloud-status{
                flex:0 0 auto;
                padding:7px 10px;
                border-radius:999px;
                background:#eef2f6;
                font-size:12px;
                white-space:nowrap;
                max-width:100%
            }

            .jc-cloud-status[data-status=ok]{
                background:#e7f7ed;
                color:#137333
            }

            .jc-cloud-grid{
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:14px;
                margin-top:18px
            }

            .jc-cloud-grid label{
                font-size:13px;
                font-weight:600;
                color:#344054
            }

            .jc-cloud-grid input{
                width:100%;
                box-sizing:border-box;
                margin-top:6px;
                padding:11px 12px;
                border:1px solid #d0d5dd;
                border-radius:10px
            }

            .jc-cloud-actions{
                display:flex;
                flex-wrap:wrap;
                gap:8px;
                margin-top:16px
            }

            .jc-cloud-actions button{
                border:0;
                border-radius:10px;
                padding:10px 13px;
                cursor:pointer;
                background:#1557a6;
                color:#fff
            }

            .jc-cloud-actions button:disabled{
                opacity:.65;
                cursor:wait
            }

            .jc-cloud-actions .secondary{
                background:#eef2f6;
                color:#344054
            }

            .jc-cloud-info{
                margin-top:14px;
                padding:11px;
                border-radius:10px;
                background:#f8fafc;
                color:#667085;
                font-size:13px
            }

            @media(max-width:700px){
                .jc-cloud-head{
                    display:block
                }

                .jc-cloud-status{
                    display:inline-block;
                    margin-top:10px
                }

                .jc-cloud-grid{
                    grid-template-columns:1fr
                }
            }
        `;


        document.head.appendChild(
            s
        );

    }


    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    async function boot() {

        if (booted) {

            return;

        }


        booted = true;


        injectStyles();


        document.addEventListener(
            "jcstoragechange",
            onLocalChange
        );


        render();


        try {

            await conectar();


            const s =
                await session();


            if (s) {

                iniciarAutoSync();

                await updateStatus();

            }


        } catch (_) {

            /*
               Configuração ainda não feita.
            */

        }

    }


    /* =====================================================
       API PÚBLICA
       ===================================================== */

    window.JCCloud = {

        conectar,

        criarConta,

        entrar,

        sair,

        enviarNuvem,

        baixarNuvem,

        sincronizar,

        render,

        boot

    };


    /* =====================================================
       INICIAR
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            boot,
            {
                once: true
            }
        );

    } else {

        boot();

    }

})();