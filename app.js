// ==========================================================
// app.js - Dia 6: abas, pedido, busca, vibração e câmera
// ==========================================================

// ---------- Utilidades ----------

function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

let temporizadorAviso;
function mostrarAviso(texto) {
  const aviso = document.querySelector("#aviso");
  aviso.textContent = texto;
  aviso.classList.add("visivel");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(function () {
    aviso.classList.remove("visivel");
  }, 2000);
}

function vibrar(padrao) {
  if ("vibrate" in navigator) {
    navigator.vibrate(padrao);
  }
}

// ---------- Navegação por abas ----------

const abas = document.querySelectorAll(".aba");
const telas = document.querySelectorAll(".tela");

function abrirTela(idTela) {
  for (const tela of telas) {
    tela.hidden = tela.id !== idTela;
  }
  for (const aba of abas) {
    aba.classList.toggle("ativa", aba.dataset.tela === idTela);
  }
  window.scrollTo(0, 0);

  if (idTela !== "tela-camera" && typeof desligarCamera === "function") {
    desligarCamera();
  }
}

for (const aba of abas) {
  aba.addEventListener("click", function () {
    abrirTela(aba.dataset.tela);
  });
}

// ---------- Cardápio ----------

const listaProdutos = document.querySelector("#lista-produtos");
const botoesFiltro = document.querySelectorAll(".filtro");
const campoBusca = document.querySelector("#busca-produto");

let categoriaAtual = "Todos";

function criarCard(produto) {
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <div class="card-emoji">${produto.emoji}</div>
    <div class="card-info">
      <h3>${produto.nome}</h3>
      <p>${produto.descricao}</p>
      <strong>${formatarPreco(produto.preco)}</strong>
    </div>
    <button class="btn-adicionar" aria-label="Adicionar ${produto.nome}">+</button>
  `;
  card.querySelector(".btn-adicionar").addEventListener("click", function () {
    adicionarAoPedido(produto);
  });
  return card;
}

function mostrarCardapio(categoria) {
  categoriaAtual = categoria;
  listaProdutos.innerHTML = "";

  const texto = campoBusca.value.toLowerCase().trim();
  let encontrados = 0;

  for (const produto of produtos) {
    const combinaCategoria =
      categoriaAtual === "Todos" || produto.categoria === categoriaAtual;
    const combinaBusca = produto.nome.toLowerCase().includes(texto);

    if (combinaCategoria && combinaBusca) {
      listaProdutos.appendChild(criarCard(produto));
      encontrados++;
    }
  }

  if (encontrados === 0) {
    listaProdutos.innerHTML = '<p class="vazio">Nenhum produto encontrado.</p>';
  }
}

campoBusca.addEventListener("input", function () {
  mostrarCardapio(categoriaAtual);
});

for (const botao of botoesFiltro) {
  botao.addEventListener("click", function () {
    for (const outro of botoesFiltro) {
      outro.classList.remove("ativo");
    }
    botao.classList.add("ativo");
    mostrarCardapio(botao.dataset.categoria);
  });
}

// ---------- Pedido ----------

function carregarPedido() {
  const salvo = localStorage.getItem("pedido");
  if (salvo) {
    return JSON.parse(salvo);
  }
  return [];
}

function salvarPedido() {
  localStorage.setItem("pedido", JSON.stringify(pedido));
}

let pedido = carregarPedido();

function adicionarAoPedido(produto) {
  const item = pedido.find(function (i) {
    return i.id === produto.id;
  });

  if (item) {
    item.quantidade = item.quantidade + 1;
  } else {
    pedido.push({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      quantidade: 1
    });
  }

  salvarPedido();
  mostrarPedido();
  vibrar(50);
  mostrarAviso(produto.emoji + " " + produto.nome + " adicionado");
}

function alterarQuantidade(id, mudanca) {
  const item = pedido.find(function (i) {
    return i.id === id;
  });
  item.quantidade = item.quantidade + mudanca;

  if (item.quantidade <= 0) {
    pedido = pedido.filter(function (i) {
      return i.id !== id;
    });
  }
  salvarPedido();
  mostrarPedido();
}

function calcularTotal() {
  let total = 0;
  for (const item of pedido) {
    total = total + item.preco * item.quantidade;
  }
  return total;
}

function mostrarPedido() {
  const lista = document.querySelector("#lista-pedido");
  lista.innerHTML = "";

  if (pedido.length === 0) {
    lista.innerHTML = '<li class="vazio">Seu pedido está vazio. Escolha algo no cardápio!</li>';
  }

  let quantidadeTotal = 0;
  for (const item of pedido) {
    quantidadeTotal = quantidadeTotal + item.quantidade;

    const li = document.createElement("li");
    li.className = "item-pedido";
    li.innerHTML = `
      <div class="nome">
        ${item.nome}
        <small>${formatarPreco(item.preco * item.quantidade)}</small>
      </div>
      <button class="btn-qtd menos" aria-label="Diminuir">−</button>
      <span>${item.quantidade}</span>
      <button class="btn-qtd mais" aria-label="Aumentar">+</button>
    `;
    li.querySelector(".menos").addEventListener("click", function () {
      alterarQuantidade(item.id, -1);
    });
    li.querySelector(".mais").addEventListener("click", function () {
      alterarQuantidade(item.id, 1);
    });
    lista.appendChild(li);
  }

  document.querySelector("#total-pedido").textContent = formatarPreco(calcularTotal());

  const contador = document.querySelector("#contador-pedido");
  contador.textContent = quantidadeTotal;
  contador.hidden = quantidadeTotal === 0;

  document.querySelector("#btn-finalizar").disabled = pedido.length === 0;
  document.querySelector("#btn-compartilhar-pedido").disabled = pedido.length === 0;
}

function finalizarPedido() {
  if (pedido.length === 0) {
    return;
  }
  vibrar([100, 50, 100, 50, 200]);
  mostrarAviso("Pedido enviado! Total: " + formatarPreco(calcularTotal()));
  pedido = [];
  salvarPedido();
  mostrarPedido();
}

document.querySelector("#btn-finalizar").addEventListener("click", finalizarPedido);

// ---------- Controle da Câmera e Galeria ----------

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const areaCamera = document.getElementById("area-camera");
const btnLigarCamera = document.getElementById("btn-ligar-camera");
const btnFoto = document.getElementById("btn-foto");
const btnTrocarCamera = document.getElementById("btn-trocar-camera");
const inputFoto = document.getElementById("input-foto");
const galeria = document.getElementById("galeria");

let streamAtual = null;
let usandoCameraTraseira = true;

async function ligarCamera() {
  try {
    if (streamAtual) {
      desligarCamera();
    }

    const restricoes = {
      video: {
        facingMode: usandoCameraTraseira ? "environment" : "user"
      },
      audio: false
    };

    streamAtual = await navigator.mediaDevices.getUserMedia(restricoes);
    video.srcObject = streamAtual;

    areaCamera.classList.add("ligada");
    btnLigarCamera.textContent = "Desligar câmera";
    btnFoto.disabled = false;
    btnTrocarCamera.disabled = false;
  } catch (erro) {
    console.error("Erro ao acessar a câmera:", erro);
    mostrarAviso("Não foi possível acessar a câmera.");
  }
}

function desligarCamera() {
  if (streamAtual) {
    streamAtual.getTracks().forEach(function (track) {
      track.stop();
    });
    streamAtual = null;
  }
  if (video) {
    video.srcObject = null;
  }
  if (areaCamera) {
    areaCamera.classList.remove("ligada");
  }
  if (btnLigarCamera) {
    btnLigarCamera.textContent = "Ligar câmera";
  }
  if (btnFoto) {
    btnFoto.disabled = true;
  }
  if (btnTrocarCamera) {
    btnTrocarCamera.disabled = true;
  }
}

function tirarFoto() {
  if (!streamAtual || !video.videoWidth) {
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const contexto = canvas.getContext("2d");
  contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  adicionarFotoNaGaleria(dataUrl);
  vibrar(50);
  mostrarAviso("Foto adicionada à galeria!");
}

function trocarCamera() {
  usandoCameraTraseira = !usandoCameraTraseira;
  ligarCamera();
}

function adicionarFotoNaGaleria(src, salvar = true) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = "Foto do meu café";
  galeria.prepend(img);

  if (salvar) {
    const fotosSalvas = JSON.parse(localStorage.getItem("cafe_galeria") || "[]");
    fotosSalvas.unshift(src);
    localStorage.setItem("cafe_galeria", JSON.stringify(fotosSalvas.slice(0, 12)));
  }
}

function carregarGaleria() {
  if (!galeria) {
    return;
  }
  const fotosSalvas = JSON.parse(localStorage.getItem("cafe_galeria") || "[]");
  fotosSalvas.forEach(function (src) {
    adicionarFotoNaGaleria(src, false);
  });
}

if (btnLigarCamera) {
  btnLigarCamera.addEventListener("click", function () {
    if (streamAtual) {
      desligarCamera();
    } else {
      ligarCamera();
    }
  });
}

if (btnFoto) {
  btnFoto.addEventListener("click", tirarFoto);
}

if (btnTrocarCamera) {
  btnTrocarCamera.addEventListener("click", trocarCamera);
}

if (inputFoto) {
  inputFoto.addEventListener("change", function (evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo) {
      return;
    }

    const leitor = new FileReader();
    leitor.onload = function (e) {
      adicionarFotoNaGaleria(e.target.result);
      mostrarAviso("Foto carregada na galeria!");
    };
    leitor.readAsDataURL(arquivo);
  });
}

// ---------- Início ----------
mostrarCardapio("Todos");
mostrarPedido();
carregarGaleria();
