let conectado = false;
let SERVER_IP = "";
let SESION_TOKEN = "";
let statsInterval = null;
let statsChart;
const MAX_DATA_POINTS = 20;
let TEMPORARY_PIN = "";

function formatearURL(url) {
    let limpia = url.trim();
    limpia = limpia.replace(/^https?:\/\//, '');
    limpia = limpia.replace(/\/$/, '');
    return limpia;
}

function verificarPassword() {
    const passInput = document.getElementById('passwordInput').value;
    const errorMsg = document.getElementById('login-error');
    
    // Contraseña estática requerida
    if (passInput === "Vanguard-TCR") {
        document.getElementById('login-overlay').style.display = "none";
    } else {
        errorMsg.style.display = "block";
        setTimeout(() => { errorMsg.style.display = "none"; }, 3000);
    }
}

async function toggleConexion() {
    const ipInput = document.getElementById('ipInput');
    const pinInput = document.getElementById('serverPinInput');
    const connectBtn = document.getElementById('connectBtn');
    const statusBadge = document.getElementById('status-badge');
    const statusLed = document.getElementById('status-led');
    const commandInput = document.getElementById('commandInput');
    const execBtn = document.getElementById('execBtn');
    const consoleDiv = document.getElementById('console');

    if (!conectado) {
        let urlIngresada = formatearURL(ipInput.value);
        let pinIngresado = pinInput.value.trim();
        if (!urlIngresada) return alert("Ingresa la URL del servidor");
        if (pinIngresado.length < 4) return alert("Ingresa el PIN de 4 dígitos del servidor");
        statusBadge.innerText = "Autenticando...";

        try {
            let urlFinal = `https://${urlIngresada}/login`;
            const response = await fetch(urlFinal, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({ password: pinIngresado })
            });

            if (response.ok) {
                const data = await response.json();
                SESION_TOKEN = data.token;
                SERVER_IP = urlIngresada;

                // --- ESTADO CONECTADO ---
                conectado = true;
                execBtn.disabled = false;
                execBtn.classList.remove('btn-disabled');
                execBtn.classList.add('btn-exec');

                // Bloqueos y Activaciones
                pinInput.disabled = true;
                ipInput.disabled = true;
                commandInput.disabled = false;

                // Estilos de Botón e Indicadores
                connectBtn.className = "btn btn-danger";
                connectBtn.innerText = "Desconectar";
                connectBtn.classList.add('btn-danger');
                statusBadge.innerText = "Conectado";
                statusLed.className = "led led-green";
                consoleDiv.innerHTML += `\n> Enlace establecido con éxito...`;

                // Iniciar monitoreo de recursos

                getStats(); 
                statsInterval = setInterval(getStats, 2000);

            } else {
                statusBadge.innerText = "PIN Incorrecto";
                statusLed.className = "led led-red";
                alert("El PIN ingresado al inicio no es válido para este servidor.");
            }

        } catch (e) {
            statusBadge.innerText = "Error de Red";
            alert("No se pudo conectar. Verifica que Ngrok esté activo y que aceptaste el aviso de 'Visit Site'.");
        }

    } else {

        // --- ESTADO DESCONECTADO ---

        conectado = false;

        execBtn.disabled = true;
        execBtn.classList.add('btn-disabled');
        execBtn.classList.remove('btn-exec');

        // Liberar IP y Bloquear Terminal
        pinInput.disabled = false;
        ipInput.disabled = false;
        commandInput.disabled = true;
        execBtn.disabled = true;
        
        // Estilos originales
        connectBtn.innerText = "Conectar";
        connectBtn.className = "btn btn-connect";
        connectBtn.classList.remove('btn-danger');
        statusBadge.innerText = "Desconectado";
        statusLed.className = "led led-red";
        consoleDiv.innerHTML += `\n> Desconectado.`;

        clearInterval(statsInterval);
        resetBars();
    }
}

async function enviarAlServidor(accion, parametro) {
    if (!conectado || !SESION_TOKEN) return;
    const consoleDiv = document.getElementById('console');

    try {
        let urlFinal = `https://${SERVER_IP}/ejecutar`;
        const response = await fetch(urlFinal, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': SESION_TOKEN 
            },
            body: JSON.stringify({ accion, parametro })
        });

        const data = await response.json();

        if (data.status === "ok") {
            if (accion === "SCREEN" && data.image) {
                mostrarModalImagen(data.image);
            }

            if (data.msg) {
                consoleDiv.innerHTML += `<div style="color: #10b981; margin-bottom: 4px; white-space: pre-wrap;">> ${data.msg}</div>`;
            }

        } else {
            consoleDiv.innerHTML += `<div style="color: #ef4444; margin-bottom: 4px;">[!] Error: ${data.msg}</div>`;
        }

    } catch (e) {
        consoleDiv.innerHTML += `\n<span style="color: #ef4444;">[!] Error de comunicación con el nodo central.</span>`;
    }
    actualizarScrollConsola();
}

function cerrarModal() {
    const modal = document.getElementById('screen-modal');
    modal.classList.remove('modal-visible');
    modal.classList.add('modal-hidden');
    document.getElementById('screen-img').src = "";
}

function mostrarModalImagen(base64Data) {
    const modal = document.getElementById('screen-modal');
    modal.classList.remove('modal-hidden');
    modal.classList.add('modal-visible');
    modal.style.display = "flex";
    document.getElementById('screen-img').src = "data:image/png;base64," + base64Data;
}

function procesarComando() {
    const input = document.getElementById('commandInput');
    const texto = input.value.trim();
    if (!texto) return;

    document.getElementById('console').innerHTML += `<div style="color: #94a3b8; margin-top: 8px;">$ ${texto}</div>`;
    gestionarHistorialConsola();

    const [accion, ...resto] = texto.split(" ");
    enviarAlServidor(accion.toUpperCase(), resto.join(" "));
    input.value = "";
}

// Enter para comandos
document.getElementById('commandInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') procesarComando();
});

function resetBars() {
    // 1. Ya solo limpiamos el disco (eliminamos cpu y ram de aquí)
    if(document.getElementById('disk-bar')) document.getElementById('disk-bar').style.width = "0%";
    if(document.getElementById('disk-text')) document.getElementById('disk-text').innerText = "0%";

    // 2. Limpiamos la red
    if(document.getElementById('net-down')) document.getElementById('net-down').innerText = "0 KB/s";
    if(document.getElementById('net-up')) document.getElementById('net-up').innerText = "0 KB/s";

    // 3. (NUEVO) Vaciamos la gráfica al desconectar
    if (statsChart) {
        statsChart.data.datasets[0].data = Array(MAX_DATA_POINTS).fill(0);
        statsChart.data.datasets[1].data = Array(MAX_DATA_POINTS).fill(0);
        statsChart.data.datasets[2].data = Array(MAX_DATA_POINTS).fill(0);
        statsChart.update();
    }
}

async function getStats() {
    if (!conectado || !SERVER_IP || !SESION_TOKEN) return;

    try {
        let urlFinal = `https://${SERVER_IP}/status`;
        const response = await fetch(urlFinal, {
            headers: { 
                'Authorization': SESION_TOKEN,
                'ngrok-skip-browser-warning': 'true'
            }
        });

        if (!response.ok) return;

        const data = await response.json();

        if (statsChart) {

            // CPU
            statsChart.data.datasets[0].data.push(data.cpu);
            statsChart.data.datasets[0].data.shift();

            // RAM
            statsChart.data.datasets[1].data.push(data.ram);
            statsChart.data.datasets[1].data.shift();

            // DISCO
            statsChart.data.datasets[2].data.push(data.disk_activity);
            statsChart.data.datasets[2].data.shift();
            statsChart.update();
        }

        const diskBar = document.getElementById('disk-bar');

        diskBar.style.width = data.disk + "%";
        diskBar.style.backgroundColor = data.disk > 90 ? "var(--danger)" : "var(--accent)";

        document.getElementById('disk-text').innerText = Math.round(data.disk) + "%";
        document.getElementById('net-down').innerText = data.net_down;
        document.getElementById('net-up').innerText = data.net_up;

    } catch (e) {
        console.error("Error en flujo de datos:", e);
    }
}

function gestionarHistorialConsola() {

    const consoleDiv = document.getElementById('console');
    const limiteMaximo = 50; // Número máximo de líneas a mostrar
    const mensajes = consoleDiv.querySelectorAll('div');

    if (mensajes.length > limiteMaximo) {
        const cantidadABorrar = mensajes.length - limiteMaximo;

        for (let i = 0; i < cantidadABorrar; i++) {
            consoleDiv.removeChild(mensajes[i]);
        }
    }
}

function inicializarGrafica() {

    const ctx = document.getElementById('statsChart').getContext('2d');

    statsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(MAX_DATA_POINTS).fill(''),
            datasets: [
                {
                    label: 'CPU %',
                    borderColor: '#38bdf8', // Azul
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    data: Array(MAX_DATA_POINTS).fill(0),
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0
                }, 

                {
                    label: 'RAM %',
                    borderColor: '#10b981', // Verde
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    data: Array(MAX_DATA_POINTS).fill(0),
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0
                },

                {
                    label: 'USO DISCO %',
                    borderColor: '#f59e0b',
                    data: Array(MAX_DATA_POINTS).fill(0),
                    borderWidth: 2,
                    tension: 0.1, // Menos tensión = líneas más rectas y puntiagudas para los picos de actividad
                    pointRadius: 0
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 100, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                x: { display: false }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc', font: { size: 10 } } }
            },
            animation: false
        }
    });
}

function actualizarScrollConsola() {
    const consoleDiv = document.getElementById('console');
    gestionarHistorialConsola();
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function abrirHostMenu() {
    const overlay = document.getElementById('host-overlay');
    overlay.classList.remove('force-hide');
    overlay.style.display = 'flex';
}

function cerrarHostMenu() {
    const overlay = document.getElementById('host-overlay');
    overlay.classList.add('force-hide');
    overlay.style.display = 'none';
}


window.onload = inicializarGrafica;


