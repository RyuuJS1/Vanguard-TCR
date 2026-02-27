let conectado = false;
let SERVER_IP = "";
let SESION_TOKEN = "";
let statsInterval = null;
let TEMPORARY_PIN = "";

// 1. Quitar el bloqueo del PIN
function verificarPassword() {
    const pin = document.getElementById('passwordInput').value.trim();
    if (pin.length < 4) return alert("PIN inválido");
    
    TEMPORARY_PIN = pin;
    document.getElementById('login-overlay').style.display = "none";
}

// 2. Construir la URL (Forzar HTTPS para Ngrok)
function obtenerURL(path) {
    let url = SERVER_IP.trim();
    if (!url.startsWith('http')) {
        url = url.includes('ngrok-free.app') ? `https://${url}` : `http://${url}:5000`;
    }
    return `${url.replace(/\/$/, '')}${path}`;
}

// 3. Conexión Principal
async function toggleConexion() {
    const ipInput = document.getElementById('ipInput');
    if (!conectado) {
        SERVER_IP = ipInput.value;
        const statusBadge = document.getElementById('status-badge');
        statusBadge.innerText = "Conectando...";

        try {
            const resp = await fetch(obtenerURL('/login'), {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true' 
                },
                body: JSON.stringify({ password: TEMPORARY_PIN })
            });

            if (resp.ok) {
                const data = await resp.json();
                SESION_TOKEN = data.token;
                conectado = true;
                
                // UI
                document.getElementById('connectBtn').innerText = "Desconectar";
                document.getElementById('status-led').className = "led led-green";
                document.getElementById('commandInput').disabled = false;
                document.getElementById('execBtn').disabled = false;
                
                statsInterval = setInterval(getStats, 2000);
            } else {
                alert("PIN incorrecto");
            }
        } catch (e) {
            alert("Error de conexión. Revisa que Ngrok esté activo y hayas hecho clic en 'Visit Site'.");
        }
    } else {
        location.reload();
    }
}

// 4. Obtener Estadísticas (Sin errores infinitos)
async function getStats() {
    if (!conectado) return;
    try {
        const resp = await fetch(obtenerURL('/status'), {
            headers: { 
                'Authorization': SESION_TOKEN,
                'ngrok-skip-browser-warning': 'true' 
            }
        });
        const data = await resp.json();
        document.getElementById('disk-bar').style.width = data.disk + "%";
        document.getElementById('net-down').innerText = data.net_down;
        document.getElementById('net-up').innerText = data.net_up;
    } catch (e) {
        console.log("Fallo de red momentáneo");
    }
}
