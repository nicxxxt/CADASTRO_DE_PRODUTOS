
const CHAVE_ESTOQUE = "sistema_estoque_produtos";

const formulario = document.getElementById("produto-form");
const campoNome = document.getElementById("nome");
const campoPreco = document.getElementById("preco");
const campoQuantidade = document.getElementById("quantidade");

const tabela = document.getElementById("tabela-produtos");
const campoBusca = document.getElementById("campo-busca");
const ordenacao = document.getElementById("ordenacao");

const mensagemVazia = document.getElementById("mensagem-vazia");
const feedback = document.getElementById("feedback");

const totalProdutos = document.getElementById("quantidade-produtos");
const totalEstoque = document.getElementById("total-estoque");
const produtosBaixos = document.getElementById("produtos-baixos");

const tituloFormulario = document.getElementById("titulo-formulario");
const botaoSalvar = document.getElementById("btn-salvar");
const botaoCancelar = document.getElementById("btn-cancelar-edicao");

let produtos = carregarEstoque();
let indiceEdicao = null;

function carregarEstoque() {
    try {
        const dados = JSON.parse(localStorage.getItem(CHAVE_ESTOQUE)) || [];
        return Array.isArray(dados) ? dados : [];
    } catch {
        return [];
    }
}

function salvarEstoque() {
    localStorage.setItem(CHAVE_ESTOQUE, JSON.stringify(produtos));
}

function mostrarFeedback(mensagem) {
    feedback.textContent = mensagem;

    setTimeout(() => {
        feedback.textContent = "";
    }, 3000);
}

function limparFormulario() {
    formulario.reset();
    indiceEdicao = null;

    tituloFormulario.textContent = "Cadastrar produto";
    botaoSalvar.textContent = "Cadastrar produto";
    botaoCancelar.hidden = true;
}

formulario.addEventListener("submit", function(evento) {
    evento.preventDefault();

    const nome = campoNome.value.trim();
    const preco = Number(campoPreco.value);
    const quantidade = Number(campoQuantidade.value);

    if (!nome || !Number.isFinite(preco) || preco <= 0 ||
        !Number.isInteger(quantidade) || quantidade < 0) {
        mostrarFeedback("Preencha os campos com valores válidos.");
        return;
    }

    const produto = {
        id: indiceEdicao !== null
            ? produtos[indiceEdicao].id
            : Date.now().toString() + Math.random().toString(16).slice(2),
        nome,
        preco,
        quantidade
    };

    if (indiceEdicao !== null) {
        produtos[indiceEdicao] = produto;
        mostrarFeedback("Produto atualizado com sucesso!");
    } else {
        produtos.push(produto);
        mostrarFeedback("Produto cadastrado com sucesso!");
    }

    salvarEstoque();
    limparFormulario();
    atualizarInterface();
});

botaoCancelar.addEventListener("click", limparFormulario);

function editarProduto(id) {
    const indice = produtos.findIndex(p => p.id === id);

    if (indice === -1) return;

    const produto = produtos[indice];

    indiceEdicao = indice;

    campoNome.value = produto.nome;
    campoPreco.value = produto.preco;
    campoQuantidade.value = produto.quantidade;

    tituloFormulario.textContent = "Editar produto";
    botaoSalvar.textContent = "Salvar alterações";
    botaoCancelar.hidden = false;

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function excluirProduto(id) {
    const produto = produtos.find(p => p.id === id);

    if (!produto) return;

    if (confirm(`Deseja excluir o produto "${produto.nome}"?`)) {
        produtos = produtos.filter(p => p.id !== id);

        if (indiceEdicao !== null) {
            limparFormulario();
        }

        salvarEstoque();
        atualizarInterface();
        mostrarFeedback("Produto excluído.");
    }
}

function atualizarInterface() {
    tabela.innerHTML = "";

    const pesquisa = campoBusca.value.toLowerCase().trim();

    let lista = produtos
        .map(produto => produto)
        .filter(produto => produto.nome.toLowerCase().includes(pesquisa));

    switch (ordenacao.value) {
        case "menor-quantidade":
            lista.sort((a, b) => a.quantidade - b.quantidade);
            break;

        case "maior-preco":
            lista.sort((a, b) => b.preco - a.preco);
            break;

        case "menor-preco":
            lista.sort((a, b) => a.preco - b.preco);
            break;

        case "alfabetica":
            lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
            break;
    }

    lista.forEach(produto => {
        const linha = document.createElement("tr");

        if (produto.quantidade <= 3) {
            linha.classList.add("linha-baixa");
        }

        const status = produto.quantidade <= 3
            ? '<span class="status status-baixo">Estoque baixo</span>'
            : '<span class="status status-ok">Normal</span>';

        linha.innerHTML = `
            <td>${escaparHTML(produto.nome)}</td>
            <td>${produto.preco.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            })}</td>
            <td>${produto.quantidade}</td>
            <td>${status}</td>
            <td>
                <button class="btn-editar" data-acao="editar">Editar</button>
                <button class="btn-excluir" data-acao="excluir">Excluir</button>
            </td>
        `;

        linha.querySelector('[data-acao="editar"]')
            .addEventListener("click", () => editarProduto(produto.id));

        linha.querySelector('[data-acao="excluir"]')
            .addEventListener("click", () => excluirProduto(produto.id));

        tabela.appendChild(linha);
    });

    mensagemVazia.hidden = lista.length > 0;

    totalProdutos.textContent = produtos.length;

    totalEstoque.textContent = produtos.reduce(
        (total, produto) => total + produto.quantidade, 0
    );

    produtosBaixos.textContent = produtos.filter(
        produto => produto.quantidade <= 3
    ).length;
}

function escaparHTML(texto) {
    return String(texto).replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}

campoBusca.addEventListener("input", atualizarInterface);
ordenacao.addEventListener("change", atualizarInterface);

document.getElementById("limpar-tabela").addEventListener("click", () => {
    if (produtos.length === 0) return;

    if (confirm("Deseja realmente apagar todos os produtos?")) {
        produtos = [];
        limparFormulario();
        salvarEstoque();
        atualizarInterface();
        mostrarFeedback("Estoque limpo com sucesso!");
    }
});

function baixarArquivo(nome, conteudo, tipo) {
    const arquivo = new Blob([conteudo], { type: tipo });
    const endereco = URL.createObjectURL(arquivo);

    const link = document.createElement("a");
    link.href = endereco;
    link.download = nome;
    link.click();

    URL.revokeObjectURL(endereco);
}

// EXPORTAR CSV
document.getElementById("exportar-csv").addEventListener("click", () => {
    const cabecalho = ["Nome", "Preço", "Quantidade", "Status"];

    const linhas = produtos.map(produto => [
        produto.nome,
        produto.preco.toFixed(2),
        produto.quantidade,
        produto.quantidade <= 3 ? "Estoque baixo" : "Normal"
    ]);

    const csv = [cabecalho, ...linhas]
        .map(linha => linha.map(valor =>
            `"${String(valor).replace(/"/g, '""')}"`
        ).join(";"))
        .join("\n");

    baixarArquivo(
        "estoque.csv",
        "\uFEFF" + csv,
        "text/csv;charset=utf-8;"
    );
});

// EXPORTAR BACKUP JSON
document.getElementById("exportar-json").addEventListener("click", () => {
    const backup = JSON.stringify(produtos, null, 2);

    baixarArquivo(
        "backup_estoque.json",
        backup,
        "application/json"
    );
});

// IMPORTAR BACKUP JSON
const arquivoJson = document.getElementById("arquivo-json");

document.getElementById("importar-json").addEventListener("click", () => {
    arquivoJson.click();
});

arquivoJson.addEventListener("change", function() {
    const arquivo = this.files[0];

    if (!arquivo) return;

    const leitor = new FileReader();

    leitor.onload = function(evento) {
        try {
            const dados = JSON.parse(evento.target.result);

            if (!Array.isArray(dados)) {
                throw new Error("Formato inválido");
            }

            const dadosValidos = dados.every(produto =>
                produto &&
                typeof produto.nome === "string" &&
                Number.isFinite(Number(produto.preco)) &&
                Number(produto.preco) > 0 &&
                Number.isInteger(Number(produto.quantidade)) &&
                Number(produto.quantidade) >= 0
            );

            if (!dadosValidos) {
                throw new Error("Produtos inválidos");
            }

            produtos = dados.map(produto => ({
                id: produto.id || (
                    Date.now().toString() +
                    Math.random().toString(16).slice(2)
                ),
                nome: produto.nome,
                preco: Number(produto.preco),
                quantidade: Number(produto.quantidade)
            }));

            salvarEstoque();
            limparFormulario();
            atualizarInterface();

            mostrarFeedback("Backup restaurado com sucesso!");

        } catch {
            alert("Não foi possível restaurar. Verifique o arquivo JSON.");
        }

        arquivoJson.value = "";
    };

    leitor.readAsText(arquivo);
});

// INICIALIZAÇÃO
atualizarInterface();
