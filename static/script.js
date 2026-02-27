let conectado = false;
let SERVER_IP = "";
let SESION_TOKEN = "";
let statsInterval = null;
let statsChart;
const MAX_DATA_POINTS = 20;
let TEMPORARY_PIN = "";

// --- UTILIDADES ---

function formatearURL(url) {
    let limpia = url.trim();
    limpia = limpia.replace(/^https?:\/\//, '');
    limpia = limpia.replace(/\/$/, '');
    return limpia;
}

// Determina si usar HTTPS (Ngrok) o HTTP (Local) y maneja los puertos
function construirURLBase(urlRaw) {
    const url = formatearURL(urlRaw);
    if (url.includes('ngrok-free.app')) {
        return `https://${url}`; // Ngrok ya maneja el puerto internamente
    } else {
        // Si no tiene puerto especificado (como 127.0.0.1), le pone el :5000
        return url.includes(':') ? `http://${url}` : `http://${url}:5000`;
    }
}

function verificarPassword() {
    const pin = document.getElementById('passwordInput').value.trim();
    if (pin.length < 4) {
        alert("Por favor ingrese un PIN válido.");
        return;
    }
    TEMPORARY_PIN = pin;
    document.getElementById('login-overlay').style.display = "none";
}

// --- CORE DE COMUNICACIÓN ---

async function toggleConexion() {
    const ipInput = document.getElementById('ipInput');
    const connectBtn = document.getElementById('connectBtn');
    const statusBadge = document.getElementById('status-badge');
    const statusLed = document.getElementById('status-led');
    
    if (!conectado) {
        let urlIngresada = ipInput.value.trim();
        if (!urlIngresada) return alert("Ingresa la URL de Ngrok");

        statusBadge.innerText = "Conectando...";

        // FORZAMOS HTTPS PARA NGROK SIEMPRE
        let urlFinal = urlIngresada.includes('ngrok-free.app') 
            ? `https://${formatearURL(urlIngresada)}/login` 
            : `http://${formatearURL(urlIngresada)}:5000/login`;

        console.log("Intentando conectar a:", urlFinal); // Para que veas en F12 a dónde llamas

        try {
            const response = await fetch(urlFinal, {
                method: 'POST',
                mode: 'cors', // Crucial para Render
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'ngrok-skip-browser-warning': 'true' // Saltarse el aviso de ngrok
                },
                body: JSON.stringify({ password: TEMPORARY_PIN })
            });

            if (response.ok) {
                const data = await response.json();
                SESION_TOKEN = data.token;
                SERVER_IP = urlIngresada;
                conectado = true;
                
                // Actualizar UI
                document.getElementById('execBtn').disabled = false;
                document.getElementById('execBtn').classList.remove('btn-disabled');
                ipInput.disabled = true;
                document.getElementById('commandInput').disabled = false;
                connectBtn.className = "btn btn-danger";
                connectBtn.innerText = "Desconectar";
                statusBadge.innerText = "Conectado";
                statusLed.className = "led led-green";
                
                getStats(); 
                statsInterval = setInterval(getStats, 2000);
            } else {
                throw new Error("Respuesta no válida del servidor");
            }
        } catch (e) {
            console.error("ERROR DETALLADO:", e);
            statusBadge.innerText = "Error de Conexión";
            alert("ERROR: No se pudo alcanzar el servidor.\n\n1. ¿Hiciste clic en 'Visit Site' en la URL de Ngrok?\n2. ¿Tu server.py está corriendo?\n3. ¿Escribiste bien la URL?");
        }
    } else {
        desconectar();
    }
}

function desconectar() {
    conectado = false;
    const execBtn = document.getElementById('execBtn');
    execBtn.disabled = true;
    execBtn.classList.add('btn-disabled');
    
    document.getElementById('ipInput').disabled = false;
    document.getElementById('commandInput').disabled = true;
    
    const connectBtn = document.getElementById('connectBtn');
    connectBtn.innerText = "Conectar";
    connectBtn.className = "btn btn-connect";
    
    document.getElementById('status-badge').innerText = "Desconectado";
    document.getElementById('status-led').className = "led led-red";
    document.getElementById('console').innerHTML += `\n> Sesión finalizada.`;

    clearInterval(statsInterval);
    resetBars();
}

async function enviarAlServidor(accion, parametro) {
    if (!conectado || !SESION_TOKEN) return;
    const urlBase = construirURLBase(SERVER_IP);

    try {
        const response = await fetch(`${urlBase}/ejecutar`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': SESION_TOKEN,
                'ngrok-skip-browser-warning': '69420'
            },
            body: JSON.stringify({ accion, parametro })
        });

        const data = await response.json();
        const consoleDiv = document.getElementById('console');

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
        document.getElementById('console').innerHTML += `\n<span style="color: #ef4444;">[!] Error de comunicación.</span>`;
    }
    actualizarScrollConsola();
}

async function getStats() {
    if (!conectado || !SERVER_IP) return;
    const urlBase = construirURLBase(SERVER_IP);

    try {
        const response = await fetch(`${urlBase}/status`, {
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': SESION_TOKEN, // Si aplica
                'ngrok-skip-browser-warning': '69420' // <--- ESTO ES VITAL
            },
        });
        if (!response.ok) return;
        const data = await response.json();

        if (statsChart) {
            statsChart.data.datasets[0].data.push(data.cpu);
            statsChart.data.datasets[0].data.shift();
            statsChart.data.datasets[1].data.push(data.ram);
            statsChart.data.datasets[1].data.shift();
            statsChart.data.datasets[2].data.push(data.disk_activity);
            statsChart.data.datasets[2].data.shift();
            statsChart.update();
        }

        document.getElementById('disk-bar').style.width = data.disk + "%";
        document.getElementById('disk-text').innerText = Math.round(data.disk) + "%";
        document.getElementById('net-down').innerText = data.net_down;
        document.getElementById('net-up').innerText = data.net_up;
    } catch (e) { /* Error silencioso en stats */ }
}

// --- INTERFAZ Y GRÁFICAS ---

function procesarComando() {
    const input = document.getElementById('commandInput');
    const texto = input.value.trim();
    if (!texto) return;

    document.getElementById('console').innerHTML += `<div style="color: #94a3b8; margin-top: 8px;">$ ${texto}</div>`;
    const [accion, ...resto] = texto.split(" ");
    enviarAlServidor(accion.toUpperCase(), resto.join(" "));
    input.value = "";
}

function mostrarModalImagen(base64Data) {
    const modal = document.getElementById('screen-modal');
    modal.style.display = "flex";
    document.getElementById('screen-img').src = "data:image/png;base64," + base64Data;
}

function cerrarModal() {
    document.getElementById('screen-modal').style.display = "none";
}

function actualizarScrollConsola() {
    const consoleDiv = document.getElementById('console');
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function resetBars() {
    if(document.getElementById('disk-bar')) document.getElementById('disk-bar').style.width = "0%";
    if(statsChart) {
        statsChart.data.datasets.forEach(ds => ds.data = Array(MAX_DATA_POINTS).fill(0));
        statsChart.update();
    }
}

function inicializarGrafica() {
    const ctx = document.getElementById('statsChart').getContext('2d');
    statsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(MAX_DATA_POINTS).fill(''),
            datasets: [
                { label: 'CPU %', borderColor: '#38bdf8', data: Array(MAX_DATA_POINTS).fill(0), borderWidth: 2, tension: 0.4, pointRadius: 0 },
                { label: 'RAM %', borderColor: '#10b981', data: Array(MAX_DATA_POINTS).fill(0), borderWidth: 2, tension: 0.4, pointRadius: 0 },
                { label: 'DISCO %', borderColor: '#f59e0b', data: Array(MAX_DATA_POINTS).fill(0), borderWidth: 2, tension: 0.1, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 100, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                x: { display: false }
            },
            plugins: { legend: { labels: { color: '#f8fafc' } } },
            animation: false
        }
    });
}

document.getElementById('commandInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') procesarComando();
});

window.onload = inicializarGrafica;

