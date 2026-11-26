const areaCamera = document.querySelector("#area-camera");
const video = document.querySelector("#video");
const canvas = document.querySelector("#canvas");
const btnLigarCamera = document.querySelector("#btn-ligar-camera");
const btnFoto = document.querySelector("#btn-foto");
const btnTrocarCamera = document.querySelector("#btn-trocar-camera");
const inputFoto = document.querySelector("#input-foto");
const galeria = document.querySelector("#galeria");

let stream = null;                 
let cameraAtual = "environment";   

async function ligarCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (typeof mostrarAviso === "function") mostrarAviso("Câmera indisponível. Abra o app pelo link https://");
    return;
  }

  desligarCamera(); 

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: cameraAtual },
      audio: false
    });
    video.srcObject = stream;               
    video.classList.toggle("espelhado", cameraAtual === "user");
    areaCamera.classList.add("ligada");
    btnFoto.disabled = false;
    btnTrocarCamera.disabled = false;
    btnLigarCamera.textContent = "Desligar";
  } catch (erro) {
    console.log(erro);
    if (typeof mostrarAviso === "function") {
      if (erro.name === "NotAllowedError") {
        mostrarAviso("Você precisa permitir o uso da câmera");
      } else {
        mostrarAviso("Não foi possível abrir a câmera (" + erro.name + ")");
      }
    }
  }
}

function desligarCamera() {
  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
    stream = null;
  }
  video.srcObject = null;
  areaCamera.classList.remove("ligada");
  btnFoto.disabled = true;
  btnTrocarCamera.disabled = true;
  btnLigarCamera.textContent = "Ligar câmera";
}

function trocarCamera() {
  if (cameraAtual === "environment") {
    cameraAtual = "user";
  } else {
    cameraAtual = "environment";
  }
  ligarCamera();
}

btnLigarCamera.addEventListener("click", function () {
  if (stream) {
    desligarCamera();
  } else {
    ligarCamera();
  }
});
btnTrocarCamera.addEventListener("click", trocarCamera);

function carregarFotos() {
  const salvas = localStorage.getItem("fotos");
  if (salvas) {
    return JSON.parse(salvas);
  }
  return [];
}

let fotos = carregarFotos(); 

function salvarFotos() {
  try {
    localStorage.setItem("fotos", JSON.stringify(fotos));
  } catch (erro) {
    fotos.pop();
    if (typeof mostrarAviso === "function") mostrarAviso("Galeria cheia: a foto mais antiga foi removida");
    salvarFotos();
  }
}

function perguntarLegenda() {
  // Abre o alerta na tela para você escrever
  const legendaUsuario = prompt("Legenda da foto:") || "Sem legenda";
  
  // Coloca o texto que você escreveu na foto mais recente
  if (fotos.length > 0) {
    fotos[0].legenda = legendaUsuario;
  }
  
  salvarFotos();
  mostrarGaleria();
}

function guardarImagem(fonte, larguraOriginal, alturaOriginal) {
  const largura = 1080; 
  const altura = Math.round((alturaOriginal / larguraOriginal) * largura);
  canvas.width = largura;
  canvas.height = altura;

  const contexto = canvas.getContext("2d");
  contexto.drawImage(fonte, 0, 0, largura, altura);

  const imagem = canvas.toDataURL("image/jpeg", 0.95);

  fotos.unshift({ imagem: imagem, legenda: "" }); 
  if (fotos.length > 12) {
    fotos.pop(); 
  }
}

function tirarFoto() {
  if (!stream) {
    return;
  }
  
  guardarImagem(video, video.videoWidth, video.videoHeight);
  
  areaCamera.classList.remove("flash");
  void areaCamera.offsetWidth; 
  areaCamera.classList.add("flash");
  
  try {
    if (typeof vibrar === "function") vibrar(30);
  } catch (e) {}
  
  // Roda a caixinha do alerta
  perguntarLegenda();
  
  if (typeof mostrarAviso === "function") {
    mostrarAviso("📸 Foto salva na galeria");
  }
}

btnFoto.addEventListener("click", tirarFoto);

inputFoto.addEventListener("change", function () {
  const arquivo = inputFoto.files[0];
  if (!arquivo) {
    return;
  }
  const img = new Image();
  img.onload = function () {
    guardarImagem(img, img.naturalWidth, img.naturalHeight);
    URL.revokeObjectURL(img.src);
    perguntarLegenda();
    if (typeof mostrarAviso === "function") mostrarAviso("📸 Foto salva na galeria");
  };
  img.src = URL.createObjectURL(arquivo);
  inputFoto.value = ""; 
});

function mostrarGaleria() {
  galeria.innerHTML = "";
  if (fotos.length === 0) {
    galeria.innerHTML = '<p class="vazio">Nenhuma foto ainda.</p>';
    return;
  }
  for (const foto of fotos) {
    const div = document.createElement("div");
    div.className = "foto";
    div.innerHTML = `
      <img src="${foto.imagem}" alt="Foto da galeria">
      <small>${foto.legenda || "Sem legenda"}</small>
    `;
    galeria.appendChild(div);
  }
}

mostrarGaleria();