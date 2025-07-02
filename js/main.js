window.addEventListener("DOMContentLoaded", function () {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker
            .register("sw.js")
            .then((respuesta) => console.log("sw registrado correctamente"))
            .catch((error) => console.log("sw no se pudo registrar"));
    }

    let eventInstall;
    let btnInstall = document.getElementById("btn-instalar");

    let ShowInstallButton = () => {
        if (btnInstall != undefined) {
            btnInstall.style.display = "inline-block";
            btnInstall.addEventListener("click", installApp);
        }
    };

    let installApp = () => {
        if (eventInstall) {
            eventInstall.prompt();
            eventInstall.userChoice.then((res) => {
                if (res.outcome === "accepted") {
                    console.log("El usuario acepto la instalación");
                    btnInstall.style.display = "none";
                } else {
                    console.log("El usuario no acepto la instalación");
                }
            });
        }
    };

    window.addEventListener("beforeinstallprompt", (e) => {
        eventInstall = e;
        ShowInstallButton();
    });
})