/*Notificacion*/
if ("Notification" in window) {
    if (Notification.permission === "default") {
        Notification.requestPermission().then((permiso) => {
            console.log("Permiso de notificación:", permiso);
        });
    }
}

const cantidadPares = 6;

// Referencias al DOM
const gridCartas = document.getElementById("grid-cartas");
const mensaje = document.getElementById("mensaje");
const btnReiniciar = document.getElementById("btn-reiniciar");
const timeProgress = document.getElementById("time-progress");
const progressWrapper = timeProgress.parentElement;
const audioTap = document.getElementById("audio-tap");
const audioVictory = document.getElementById("audio-victory");
const audioFail = new Audio("../audio/fail.mp3");

/*DOM*/
function actualizarMensaje(extra = "") {
    if (paresEncontrados === cantidadPares) {
        mensaje.textContent = `🎉 ¡Felicidades! Encontraste todos los pares.`;
    } else if (errores >= maxErrores) {
        mensaje.textContent = `❌ ¡Perdiste! Cometiste ${errores} errores.`;
    } else if (extra) {
        mensaje.textContent = extra;
    } else {
        mensaje.textContent = `Intentos fallidos: ${errores}/${maxErrores}`;
    }
}

// Variables
let cartaVolteada = null;
let bloqueado = false;
let paresEncontrados = 0;
let errores = 0;
const maxErrores = 4;
let tiempo = 60;
const totalTiempo = tiempo;
let timer;

/*Id aleatorios de la API*/
function generarIdsAleatorios(cantidad) {
    const ids = new Set();
    while (ids.size < cantidad) {
        const idRandom = Math.floor(Math.random() * 731) + 1;
        ids.add(idRandom);
    }
    return Array.from(ids);
}

/*Carga la carta del reverso*/
function crearPlaceholders() {
    gridCartas.innerHTML = "";
    const totalCartas = cantidadPares * 2;

    for (let i = 0; i < totalCartas; i++) {
        const col = document.createElement("div");
        col.className = "col-4 col-sm-4 col-md-3 col-lg-2 d-flex justify-content-center";

        const card = document.createElement("div");
        card.className = "memory-card border rounded bg-light position-relative";
        card.style.width = "100%";
        card.style.aspectRatio = "1 / 1";
        card.style.cursor = "not-allowed";

        const back = document.createElement("div");
        back.className = "position-absolute top-0 start-0 w-100 h-100 bg-warning rounded d-flex align-items-center justify-content-center";
        back.innerHTML = `<img src="../img/bg-card.jpg" alt="deadpool" />`;

        const front = document.createElement("div");
        front.className = "position-absolute top-0 start-0 w-100 h-100 rounded";
        front.style.display = "none";

        card.appendChild(back);
        card.appendChild(front);
        col.appendChild(card);
        gridCartas.appendChild(col);
    }
}

/*Carga las imagenes de la API*/
function cargarCartas(idsHerosNivel3) {
    const promesas = idsHerosNivel3.map((id) =>
        fetch(`https://superheroapi.com/api.php/4650292cfd00716b8cdfc62bb34fe7b4/${id}`).then((res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
    );

    Promise.all(promesas)
        .then((data) => {
            const personajes = data.map((d) => ({
                nombre: d.name,
                imagen: d.image.url,
            }));
            const todas = [...personajes, ...personajes];
            todas.sort(() => 0.5 - Math.random());

            const cards = gridCartas.querySelectorAll(".memory-card");
            todas.forEach((personaje, i) => {
                const card = cards[i];
                card.dataset.nombre = personaje.nombre;
                card.style.cursor = "pointer";

                const front = card.children[1];
                front.innerHTML = `<img src="${personaje.imagen}" alt="${personaje.nombre}" class="img-fluid rounded">`;

                card.addEventListener("click", () => voltearCarta(card));
            });

            gridCartas.style.display = "flex";
            progressWrapper.classList.remove("oculto");
            actualizarMensaje();
        })
        .catch((err) => {
            console.error("Error al cargar personajes:", err);
            gridCartas.innerHTML = "";
            gridCartas.style.display = "none";
            progressWrapper.classList.add("oculto");
            mensaje.textContent = "Error cargando cartas. Intenta recargar.";
            mensaje.style.display = "block";
        });
}

function mostrarTodasCartas() {
    const cards = gridCartas.querySelectorAll(".memory-card");
    cards.forEach((card) => {
        const back = card.children[0];
        const front = card.children[1];
        back.style.display = "none";
        front.style.display = "block";
    });
}

/*Voltear carta*/
function voltearCarta(carta) {
    if (bloqueado) return;

    const back = carta.children[0];
    const front = carta.children[1];

    if (front.style.display === "block") return;

    audioTap.currentTime = 0;
    audioTap.play();

    back.style.display = "none";
    front.style.display = "block";

    if (!cartaVolteada) {
        cartaVolteada = carta;
    } else {
        bloqueado = true;

        setTimeout(() => {
            if (carta.dataset.nombre === cartaVolteada.dataset.nombre) {
                paresEncontrados++;
                cartaVolteada = null;
                bloqueado = false;

                if (paresEncontrados === cantidadPares) {
                    clearInterval(timer);
                    audioVictory.play();
                    progressWrapper.classList.add("oculto");
                    actualizarMensaje();
                    if (Notification.permission === "granted") {
                        new Notification("🎉 ¡Ganaste!", {
                            body: "Nivel difícil completado.",
                            icon: "/img/favicon.png",
                            badge: "/img/favicon.png",
                            vibrate: [200, 100, 200],
                        });
                    }
                } else {
                    actualizarMensaje();
                }
            } else {
                errores++;
                if (errores > maxErrores) errores = maxErrores;

                if (errores >= maxErrores) {
                    clearInterval(timer);
                    audioFail.play();
                    mostrarTodasCartas();
                    progressWrapper.classList.add("oculto");
                    bloqueado = true;
                    actualizarMensaje();
                    if (Notification.permission === "granted") {
                        new Notification("❌ Has perdido", {
                            body: `Cometiste ${errores} errores.`,
                            icon: "/img/favicon.png",
                            badge: "/img/favicon.png",
                            vibrate: [300, 100, 300],
                        });
                    }
                    return;
                } else {
                    const quedan = maxErrores - errores;
                    actualizarMensaje(`⚠️ Par incorrecto. Te quedan ${quedan} oportunidad${quedan > 1 ? "es" : ""}.`);

                    back.style.display = "flex";
                    front.style.display = "none";
                    cartaVolteada.children[0].style.display = "flex";
                    cartaVolteada.children[1].style.display = "none";
                    cartaVolteada = null;
                    bloqueado = false;
                }
            }
        }, 1000);
    }
}

/*Tiempo*/
function iniciarTemporizador() {
    timer = setInterval(() => {
        tiempo--;
        const porcentaje = (tiempo / totalTiempo) * 100;
        timeProgress.style.width = `${porcentaje}%`;
        actualizarMensaje();

        if (tiempo <= 0) {
            clearInterval(timer);
            mensaje.textContent = "⏰ ¡Tiempo agotado!";
            bloqueado = true;
            progressWrapper.classList.add("oculto");
            mostrarTodasCartas();
            if (Notification.permission === "granted") {
                new Notification("⏰ Tiempo agotado", {
                    body: "No lograste completar el nivel difícil.",
                    icon: "/img/favicon.png",
                    badge: "/img/favicon.png",
                    vibrate: [300, 100, 300],
                });
            }
        }
    }, 1000);
}

/*Reiniciar juego*/
btnReiniciar.addEventListener("click", () => {
    if (!navigator.onLine) {
        mensaje.textContent = "Estás sin conexión. Las cartas no se podrán cargar.";
        gridCartas.innerHTML = "";
        gridCartas.style.display = "none";
        progressWrapper.classList.add("oculto");
        mensaje.style.display = "block";
        return;
    }

    const nuevosIds = generarIdsAleatorios(cantidadPares);
    cartaVolteada = null;
    bloqueado = false;
    paresEncontrados = 0;
    errores = 0;
    tiempo = 60;
    timeProgress.style.width = "100%";
    clearInterval(timer);

    progressWrapper.classList.remove("oculto");
    crearPlaceholders();
    gridCartas.style.display = "flex";
    cargarCartas(nuevosIds);
    iniciarTemporizador();
    actualizarMensaje();
});

/*Inicia el juego*/
if (!navigator.onLine) {
    mensaje.textContent = "Estás sin conexión. Las cartas no se podrán cargar.";
    gridCartas.innerHTML = "";
    gridCartas.style.display = "none";
    progressWrapper.classList.add("oculto");
    mensaje.style.display = "block";
} else {
    const idsHerosNivel3 = generarIdsAleatorios(cantidadPares);
    crearPlaceholders();
    gridCartas.style.display = "flex";
    progressWrapper.classList.remove("oculto");
    cargarCartas(idsHerosNivel3);
    iniciarTemporizador();
    actualizarMensaje();
}
