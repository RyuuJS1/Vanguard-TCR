let conectado = false;
let SERVER_IP = "";
let SESION_TOKEN = "";
let statsInterval = null;


async function verificarPassword() {
    const pinInput = document.getElementById('passwordInput');
    const pin = pinInput.value.trim();
    const errorMsg = document.getElementById('login-error');

    // Usamos localhost o la IP actual solo para validar el PIN
    const hostActual = window.location.hostname; 

    if (!pin) return;

    try {
        const response = await fetch(`https://${ipAuto}:5000/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pin })
        });

        if (response.ok) {
            const data = await response.json();
            SESION_TOKEN = data.token;
            SERVER_IP = hostActual;

            document.getElementById('login-overlay').style.display = "none";
        } else {
            errorMsg.style.display = "block";
        }
    } catch (e) {
        alert("Error de conexión con el servidor.");
    }
}

function toggleConexion() {
    const ipInput = document.getElementById('ipInput');
    const connectBtn = document.getElementById('connectBtn');
    const statusBadge = document.getElementById('status-badge');
    const statusLed = document.getElementById('status-led');
    const commandInput = document.getElementById('commandInput');
    const execBtn = document.getElementById('execBtn');
    const consoleDiv = document.getElementById('console');

    if (!conectado) {
        SERVER_IP = ipInput.value.trim();
        if (!SERVER_IP) {
            alert("Por favor ingresa una IP.");
            return;
        }

        // --- ESTADO CONECTADO ---
        conectado = true;
        
        // Bloqueos y Activaciones
        ipInput.disabled = true;
        commandInput.disabled = false;
        execBtn.disabled = false;
        execBtn.classList.remove('btn-disabled');
        
        // Estilos de Botón e Indicadores
        connectBtn.className = "btn btn-danger";
        connectBtn.innerText = "Desconectar";
        connectBtn.classList.add('btn-danger');
        statusBadge.innerText = "Conectado";
        statusLed.className = "led led-green";
        
        consoleDiv.innerHTML += `\n> Estableciendo enlace con ${SERVER_IP}...`;
        
        // Iniciar monitoreo de recursos
        getStats(); 
        statsInterval = setInterval(getStats, 2000);

    } else {
        // --- ESTADO DESCONECTADO ---
        conectado = false;
        
        // Liberar IP y Bloquear Terminal
        ipInput.disabled = false;
        commandInput.disabled = true;
        execBtn.disabled = true;
        execBtn.classList.add('btn-disabled');
        
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
    if (!conectado) return;
    const consoleDiv = document.getElementById('console');

    try {
        const response = await fetch(`https://${ipAuto}:5000/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': SESION_TOKEN 
            },
            body: JSON.stringify({ accion, parametro }),
            signal: AbortSignal.timeout(10000)
        });
        const data = await response.json();
        consoleDiv.innerHTML += `\n<pre style="color: #10b981;">[${accion}] ${data.msg}</pre>`;
    } catch (e) {
        consoleDiv.innerHTML += `\n<span style="color: #ef4444;">[!] Error de respuesta del servidor en ${SERVER_IP}</span>`;
    }
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function procesarComando() {
    const input = document.getElementById('commandInput');
    const texto = input.value.trim();
    if (!texto) return;

    const [accion, ...resto] = texto.split(" ");
    enviarAlServidor(accion.toUpperCase(), resto.join(" "));
    input.value = "";
}

// Enter para comandos
document.getElementById('commandInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') procesarComando();
});

async function getStats() {
    if (!conectado || !SERVER_IP) return;

    try {
        const response = await fetch(`https://${SERVER_IP}:5000/login`, {
            headers: { 'Authorization': SESION_TOKEN }
        });

        const data = await response.json();
        
       document.getElementById('cpu-bar').style.width = data.cpu + "%";
        document.getElementById('cpu-text').innerText = Math.round(data.cpu) + "%";
        document.getElementById('ram-bar').style.width = data.ram + "%";
        document.getElementById('ram-text').innerText = Math.round(data.ram) + "%";
        document.getElementById('disk-bar').style.width = data.disk + "%";
        document.getElementById('disk-text').innerText = Math.round(data.disk) + "%";
        document.getElementById('net-down').innerText = data.net_down;
        document.getElementById('net-up').innerText = data.net_up;
        
    } catch (e) {
        console.error("Error en monitoreo:", e);
    }
}

function resetBars() {
    const bars = ['cpu-bar', 'ram-bar', 'disk-bar'];
    const texts = ['cpu-text', 'ram-text', 'disk-text'];
    
    bars.forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).style.width = "0%";
    });
    texts.forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).innerText = "0%";
    });
    
    if(document.getElementById('net-down')) document.getElementById('net-down').innerText = "0 KB/s";
    if(document.getElementById('net-up')) document.getElementById('net-up').innerText = "0 KB/s";
}