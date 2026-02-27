let conectado = false;
let SERVER_IP = "";
let SESION_TOKEN = "";
let statsInterval = null;
let statsChart;
const MAX_DATA_POINTS = 20;
let TEMPORARY_PIN = "";

// 1. ARREGLO DEL PIN: Esta función AHORA SÍ quita la pantalla
function verificarPassword() {
    const pinInput = document.getElementById('passwordInput');
    if (!pinInput) return console.error("No se encontró el input de password");
    
    const pin = pinInput.value.trim();
    if (pin.length < 4) {
        alert("PIN demasiado corto.");
        return;
    }

    TEMPORARY_PIN = pin;
    document.getElementById('login-overlay').style.display = "none";
    console.log("PIN guardado, entrando al dashboard...");
}

// 2. CONSTRUCTOR DE URL: Evita el "Failed to Fetch" corrigiendo errores de escritura
function construirURLBase(urlRaw) {
    let url = urlRaw.trim().replace(/\/$/, ''); // Quitar espacios y barras finales
    
    // Si usas Ngrok, forzamos HTTPS para que Render no lo bloquee
    if (url.includes('ngrok-free.app')) {
        if (!url.startsWith('http')) url = 'https://' + url;
    } else {
        // Si es IP local (127.0.0.1 o 192.168...), usamos HTTP y puerto 5000
        if (!url.startsWith('http')) url = 'http://' + url;
        if (!url.includes(':')) url = url + ':5000';
    }
    return url;
}

async function toggleConexion() {
    const ipInput = document.getElementById('ipInput');
    const statusBadge = document.getElementById('status-badge');

    if (!conectado) {
        if (!ipInput.value) return alert("Ingresa la URL de Ngrok");
        
        const urlBase = construirURLBase(ipInput.value);
        statusBadge.innerText = "Conectando...";
        console.log("Intentando conectar a:", `${urlBase}/login`);

        try {
            const response = await fetch(`${urlBase}/login`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true' // Salta el aviso de Ngrok
                },
                body: JSON.stringify({ password: TEMPORARY_PIN })
            });

            if (response.ok) {
                const data = await response.json();
                SESION_TOKEN = data.token;
                SERVER_IP = ipInput.value;
                conectado = true;

                // UI Update
                document.getElementById('connectBtn').innerText = "Desconectar";
                document.getElementById('connectBtn').className = "btn btn-danger";
                document.getElementById('status-led').className = "led led-green";
                statusBadge.innerText = "Conectado";
                ipInput.disabled = true;
                document.getElementById('commandInput').disabled = false;
                document.getElementById('execBtn').disabled = false;

                getStats();
                statsInterval = setInterval(getStats, 2000);
            } else {
                alert("PIN incorrecto en el servidor.");
                statusBadge.innerText = "Error PIN";
            }
        } catch (e) {
            console.error("ERROR DE CONEXIÓN:", e);
            alert("No se pudo conectar. ¿Ya hiciste clic en 'Visit Site' en la pestaña de Ngrok?");
            statusBadge.innerText = "Desconectado";
        }
    } else {
        location.reload(); // Forma más limpia de resetear todo al desconectar
    }
}

// 3. MONITOR DE RECURSOS (Arreglado para no mandar errores infinitos)
async function getStats() {
    if (!conectado) return;
    const urlBase = construirURLBase(SERVER_IP);

    try {
        const response = await fetch(`${urlBase}/status`, {
            headers: { 
                'Authorization': SESION_TOKEN,
                'ngrok-skip-browser-warning': 'true'
            }
        });
        const data = await response.json();

        if (statsChart) {
            statsChart.data.datasets[0].data.push(data.cpu);
            statsChart.data.datasets[0].data.shift();
            statsChart.data.datasets[1].data.push(data.ram);
            statsChart.data.datasets[1].data.shift();
            statsChart.update();
        }
        document.getElementById('disk-bar').style.width = data.disk + "%";
        document.getElementById('net-down').innerText = data.net_down;
        document.getElementById('net-up').innerText = data.net_up;
    } catch (e) {
        console.warn("Fallo un ciclo de monitoreo");
    }
}

// --- RESTO DE FUNCIONES (ABRIR, CERRAR, ETC) ---
async function enviarAlServidor(accion, parametro) {
    if (!conectado) return;
    const urlBase = construirURLBase(SERVER_IP);
    try {
        const response = await fetch(`${urlBase}/ejecutar`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': SESION_TOKEN,
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ accion, parametro })
        });
        const data = await response.json();
        document.getElementById('console').innerHTML += `<div>> ${data.msg || data.status}</div>`;
    } catch (e) { console.error(e); }
}

function procesarComando() {
    const input = document.getElementById('commandInput');
    const [cmd, ...res] = input.value.split(" ");
    enviarAlServidor(cmd.toUpperCase(), res.join(" "));
    input.value = "";
}

function inicializarGrafica() {
    const ctx = document.getElementById('statsChart').getContext('2d');
    statsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(MAX_DATA_POINTS).fill(''),
            datasets: [
                { label: 'CPU', borderColor: '#38bdf8', data: Array(MAX_DATA_POINTS).fill(0), tension: 0.4 },
                { label: 'RAM', borderColor: '#10b981', data: Array(MAX_DATA_POINTS).fill(0), tension: 0.4 }
            ]
        },
        options: { animation: false, scales: { y: { min: 0, max: 100 } } }
    });
}

window.onload = inicializarGrafica;
