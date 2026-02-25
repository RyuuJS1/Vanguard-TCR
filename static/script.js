let conectado = false;
let SERVER_IP = "";
let SESION_TOKEN = "";
let statsInterval = null;
let statsChart;
const MAX_DATA_POINTS = 20;

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

        execBtn.disabled = false;
        execBtn.classList.remove('btn-disabled');
        execBtn.classList.add('btn-exec');
        
        // Bloqueos y Activaciones
        ipInput.disabled = true;
        commandInput.disabled = false;
        
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

        execBtn.disabled = true;
        execBtn.classList.add('btn-disabled');
        execBtn.classList.remove('btn-exec');
        
        // Liberar IP y Bloquear Terminal
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
    if (!conectado) return;
    const consoleDiv = document.getElementById('console');

    try {
        const response = await fetch(`https://${SERVER_IP}:5000/ejecutar`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': SESION_TOKEN 
            },
            body: JSON.stringify({ accion, parametro }),
            signal: AbortSignal.timeout(10000)
        });

        const data = await response.json();

        if (data.status === "ok") {
            if (accion === "SCREEN" && data.image) {
                const modal = document.getElementById('screen-modal');
                modal.classList.remove('modal-hidden');
                modal.classList.add('modal-visible');
                modal.style.display = "flex";
                const img = document.getElementById('screen-img');
                img.src = "data:image/png;base64," + data.image;
            }

            consoleDiv.innerHTML += `<div style="color: #10b981; margin-bottom: 4px; white-space: pre-wrap;">> ${data.msg}</div>`;
        } else {
            consoleDiv.innerHTML += `<div style="color: #ef4444; margin-bottom: 4px;">[!] Error: ${data.msg}</div>`;
        }

    } catch (e) {
        consoleDiv.innerHTML += `\n<span style="color: #ef4444;">[!] Error de respuesta del servidor en ${SERVER_IP}</span>`;
    }
    gestionarHistorialConsola();
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function cerrarModal() {
    const modal = document.getElementById('screen-modal');
    modal.classList.remove('modal-visible');
    modal.classList.add('modal-hidden');
    
    document.getElementById('screen-img').src = "";
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

async function verificarPassword() {
    const pinInput = document.getElementById('passwordInput');
    const pin = pinInput.value.trim();
    const errorMsg = document.getElementById('login-error');
    
    // AQUÍ ESTÁ EL TRUCO: Leemos la IP del cuadro que ya tienes en el HTML
    const ipParaConectar = document.getElementById('ipInput').value.trim(); 

    if (!pin) return;

    try {
        // Usamos la IP del cuadro de texto para el fetch
        const response = await fetch(`https://${ipParaConectar}:5000/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pin })
        });

        if (response.ok) {
            const data = await response.json();
            SESION_TOKEN = data.token;
            SERVER_IP = ipParaConectar; // Guardamos la IP para el resto de comandos

            document.getElementById('login-overlay').style.display = "none";
            document.getElementById('console').innerHTML = `> Acceso concedido a ${SERVER_IP}`;
            
        } else {
            errorMsg.style.display = "block";
            pinInput.value = "";
        }
    } catch (e) {
        // Si sale este error, es por el certificado HTTPS (el aviso rojo)
        alert("ERROR: No hay respuesta del servidor.\n\nPara arreglarlo rápido:\n1. Abre otra pestaña en: https://" + ipParaConectar + ":5000/status\n2. Dale a 'Aceptar riesgo/Continuar'.\n3. Regresa aquí y pon el PIN.");
    }
}

async function getStats() {
    if (!conectado || !SERVER_IP || !SESION_TOKEN) return;

    try {
        const response = await fetch(`https://${SERVER_IP}:5000/status`, {
            headers: { 'Authorization': SESION_TOKEN }
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

        // --- MANTENER DISCO Y RED COMO ESTABAN ---
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
    
    // Obtenemos todos los elementos hijos (los <div> de mensajes)
    const mensajes = consoleDiv.querySelectorAll('div');
    
    // Si superamos el límite, borramos los más antiguos
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

window.onload = inicializarGrafica;