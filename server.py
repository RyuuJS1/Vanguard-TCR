from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import psutil
import subprocess
import time
import secrets
import logging
import pyautogui
import base64
import platform
import os
from io import BytesIO

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "allow_headers": ["Authorization", "Content-Type"]}})

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

@app.route('/')
def home():
    print(f"[*] Nueva visita desde: {request.remote_addr}")
    return render_template('index.html')

PIN_ACCESO = str(secrets.randbelow(8999) + 1000)
TOKEN_SESION = secrets.token_hex(16)

print("\033[H\033[J", end="") 
print("=" * 38)
print("\t      SISTEMA TCR")
print(f"\tTU PIN DE ACCESO: \033[1;32m{PIN_ACCESO}\033[0m")
print("=" * 38)

def validar_acceso(req):
    token_recibido = req.headers.get('Authorization')
    if token_recibido == TOKEN_SESION:
        return True
    print(f"[!] Acceso denegado. Recibido: {token_recibido} | Esperado: {TOKEN_SESION}")
    return False

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    if str(data.get('password')) == PIN_ACCESO:
        print(f"[+] LOGIN EXITOSO: {request.remote_addr}")
        return jsonify({"status": "ok", "token": TOKEN_SESION})
    print(f"[!] PIN INCORRECTO desde {request.remote_addr}")
    return jsonify({"status": "error"}), 401

# Variables globales para calcular la velocidad de red
last_net_io = psutil.net_io_counters()
last_time = time.time()

@app.route('/status', methods=['GET'])
def get_status():
    if not validar_acceso(request):
        return jsonify({"error": "No autorizado"}), 403
     
    global last_net_io, last_time
    
    # 1. CPU y RAM
    cpu = psutil.cpu_percent(interval=None) 
    ram = psutil.virtual_memory().percent
    
    # 2. DISCO (Uso del disco principal C: o /)
    try:
        disco = psutil.disk_usage('C:\\').percent 
    except:
        disco = psutil.disk_usage('/').percent
    
    actividad_disco = psutil.disk_io_counters()
    uso_real_disco = psutil.disk_io_counters().read_time & 100
    actividad_pct = psutil.cpu_percent(interval=None) * 0.2
    
    # 3. RED (Cálculo de velocidad)
    current_net_io = psutil.net_io_counters()
    current_time = time.time()
    
    dt = current_time - last_time
    bytes_sent = (current_net_io.bytes_sent - last_net_io.bytes_sent) / dt
    bytes_recv = (current_net_io.bytes_recv - last_net_io.bytes_recv) / dt
    
    last_net_io = current_net_io
    last_time = current_time

    def format_speed(bytes_sec):
        if bytes_sec > 1024 * 1024:
            return f"{bytes_sec / (1024*1024):.1f} MB/s"
        return f"{bytes_sec / 1024:.1f} KB/s"

    return jsonify({
        "cpu": cpu,
        "ram": ram,
        "disk": disco,
        "disk_activity": psutil.cpu_percent() * 0.5,
        "net_up": format_speed(bytes_sent),
        "net_down": format_speed(bytes_recv)
    })

@app.route('/ejecutar', methods=['POST'])
def ejecutar():
    if not validar_acceso(request):
        return jsonify({"error": "No autorizado"}), 403
    
    data = request.json
    cmd = str(data.get('accion', '')).upper()
    param = str(data.get('parametro', '')).upper()

    try:
        if cmd == "HELP":
            guia = (
                "COMANDOS DISPONIBLES:\n"
                "- ABRIR [programa]: Inicia una app\n"
                "- CERRAR [programa]: Finaliza una app\n"
                "- SCREEN: Muestra una captura de pantalla\n"
                "- LISTAR: Muestra los 15 procesos que más RAM consumen\n"
                "- HELP: Muestra este menú de ayuda"
            )
            return jsonify({"status": "ok", "msg": guia})

        elif cmd == "LISTAR":
            procesos = []
            for p in psutil.process_iter(['pid', 'name', 'memory_percent']):
                try:
                    if p.info['memory_percent'] > 0.1: 
                        procesos.append(p.info)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            top_procesos = sorted(procesos, key=lambda x: x['memory_percent'], reverse=True)[:15]
            
            respuesta = f"{'PID':<5} | {'NOMBRE':<25} | {'RAM %':<5}\n"
            respuesta += "-" * 50 + "\n"
            for p in top_procesos:
                nombre = p['name'] if p['name'] else "Desconocido"
                respuesta += f"{str(p['pid']):<5} | {nombre[:25]:<25} | {p['memory_percent']:.1f}%\n"
            
            return jsonify({"status": "ok", "msg": respuesta})
        
        elif cmd == "SCREEN":
            # 1. Tomar captura
            screenshot = pyautogui.screenshot()
            
            # 2. Guardarla en memoria (no en el disco, para que sea rápido)
            buffered = BytesIO()
            screenshot.save(buffered, format="PNG")
            
            # 3. Convertir a Base64
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            return jsonify({
                "status": "ok", 
                "msg": "Captura realizada", 
                "image": img_str  # Enviamos la imagen aquí
            })
        
        elif cmd == "ABRIR":
            sistema = platform.system()
            
            comandos = {
                "Windows": {
                    "CALC": "calc.exe",
                    "NOTEPAD": "notepad.exe",
                    "NAVEGADOR": "start msedge"
                },
                "Linux": {
                    "CALC": "gnome-calculator",
                    "NOTEPAD": "gnome-text-editor",
                    "NAVEGADOR": "firefox"
                }
            }

            ejecutable = comandos.get(sistema, {}).get(param, param.lower())
            
            try:

                with open(os.devnull, 'w') as fnull:
                    subprocess.Popen(
                        ejecutable, 
                        shell=(sistema == "Windows"),
                        stdout=fnull, 
                        stderr=fnull
                    )
                return jsonify({"status": "ok", "msg": f"Ejecutando {ejecutable} en {sistema}"})
            except Exception as e:
                return jsonify({"status": "error", "msg": f"No se pudo abrir {ejecutable}: {str(e)}"})

        elif cmd == "CERRAR":
            encontrados = 0
            sistema = platform.system()

            traducciones = {
                "NOTEPAD": "gnome-text-editor" if sistema == "Linux" else "notepad.exe",
                "NAVEGADOR": "firefox" if sistema == "Linux" else "msedge.exe",
                "CALC": "gnome-calculator" if sistema == "Linux" else "calc.exe"
            }
            nombre_proceso = traducciones.get(param, param.lower())

            if sistema == "Linux":
                # Usamos pkill para cerrar todo lo relacionado (funciona mejor con Snaps)
                try:
                    subprocess.run(["pkill", "-f", nombre_proceso], stderr=subprocess.DEVNULL)
                    return jsonify({"status": "ok", "msg": f"Procesos cerrados correctamente."})
                except: pass

            else:

                try:

                    subprocess.run(["taskkill", "/F", "/T", "/IM", nombre_proceso], 
                                   capture_output=True, shell=True)
                    return jsonify({"status": "ok", "msg": f"Cerrado: {nombre_proceso}"})
                except: pass

            for p in psutil.process_iter(['name']):
                try:
                    if p.info['name'] and param.lower() in p.info['name'].lower():
                        p.terminate()
                        encontrados += 1
                except: continue
            return jsonify({"status": "ok", "msg": f"Procesos cerrados correctamente."})

        return jsonify({"status": "error", "msg": "Comando no reconocido."})

    except Exception as e:
        import traceback
        print("\033[1;31m[!] ERROR CRÍTICO EN EJECUTAR:\033[0m")
        traceback.print_exc()
        return jsonify({"status": "error", "msg": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False, ssl_context='adhoc')