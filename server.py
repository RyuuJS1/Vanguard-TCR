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
import requests
from io import BytesIO

# Servidor robusto para evitar congelamientos en HTTPS
from cheroot.wsgi import Server as WSGIServer
from cheroot.ssl.builtin import BuiltinSSLAdapter

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "allow_headers": ["Authorization", "Content-Type"]}})

# Desactivar logs innecesarios
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

PIN_ACCESO = str(secrets.randbelow(8999) + 1000)
TOKEN_SESION = secrets.token_hex(16)

def obtener_ip_publica():
    try:
        return requests.get('https://api.ipify.org').text
    except:
        return "127.0.0.1"

def validar_acceso(req):
    token_recibido = req.headers.get('Authorization')
    if token_recibido == TOKEN_SESION:
        return True
    return False

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    if str(data.get('password')) == PIN_ACCESO:
        return jsonify({"status": "ok", "token": TOKEN_SESION})
    return jsonify({"status": "error"}), 401

last_net_io = psutil.net_io_counters()
last_time = time.time()

@app.route('/status', methods=['GET'])
def get_status():
    if not validar_acceso(request):
        return jsonify({"error": "No autorizado"}), 403
    
    global last_net_io, last_time
    cpu = psutil.cpu_percent(interval=None) 
    ram = psutil.virtual_memory().percent
    
    try:
        disco = psutil.disk_usage('C:\\').percent 
    except:
        disco = psutil.disk_usage('/').percent
    
    current_net_io = psutil.net_io_counters()
    current_time = time.time()
    dt = max(current_time - last_time, 1)
    bytes_sent = (current_net_io.bytes_sent - last_net_io.bytes_sent) / dt
    bytes_recv = (current_net_io.bytes_recv - last_net_io.bytes_recv) / dt
    last_net_io, last_time = current_net_io, current_time

    format_speed = lambda b: f"{b/(1024*1024):.1f} MB/s" if b > 1024*1024 else f"{b/1024:.1f} KB/s"

    return jsonify({
        "cpu": cpu, "ram": ram, "disk": disco,
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
    sistema = platform.system()

    try:
        if cmd == "HELP":
            return jsonify({"status": "ok", "msg": "ABRIR, CERRAR, SCREEN, LISTAR, HELP"})

        elif cmd == "LISTAR":
            procesos = []
            for p in psutil.process_iter(['pid', 'name', 'memory_percent']):
                try:
                    if p.info['memory_percent'] > 0.1: procesos.append(p.info)
                except: continue
            top = sorted(procesos, key=lambda x: x['memory_percent'], reverse=True)[:15]
            res = "PID | NOMBRE | RAM%\n" + "\n".join([f"{p['pid']} | {p['name'][:20]} | {p['memory_percent']:.1f}%" for p in top])
            return jsonify({"status": "ok", "msg": res})
        
        elif cmd == "SCREEN":
            buffered = BytesIO()
            pyautogui.screenshot().save(buffered, format="PNG")
            return jsonify({"status": "ok", "image": base64.b64encode(buffered.getvalue()).decode()})
        
        elif cmd == "ABRIR":
            comandos = {
                "Windows": {"CALC": "calc.exe", "NOTEPAD": "notepad.exe", "NAVEGADOR": "start msedge"},
                "Linux": {"CALC": "gnome-calculator", "NOTEPAD": "gnome-text-editor", "NAVEGADOR": "firefox"}
            }
            ejecutable = comandos.get(sistema, {}).get(param, param.lower())
            with open(os.devnull, 'w') as fnull:
                subprocess.Popen(ejecutable, shell=(sistema == "Windows"), stdout=fnull, stderr=fnull)
            return jsonify({"status": "ok", "msg": f"Abriendo {ejecutable}"})

        elif cmd == "CERRAR":
            traducciones = {
                "NOTEPAD": "gnome-text-editor" if sistema == "Linux" else "notepad.exe",
                "NAVEGADOR": "firefox" if sistema == "Linux" else "msedge.exe",
                "CALC": "gnome-calculator" if sistema == "Linux" else "calc.exe"
            }
            nombre = traducciones.get(param, param.lower())
            if sistema == "Linux":
                subprocess.run(["pkill", "-f", nombre])
            else:
                subprocess.run(["taskkill", "/F", "/T", "/IM", nombre], shell=True)
            return jsonify({"status": "ok", "msg": f"Cerrado: {nombre}"})

    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

if __name__ == '__main__':
    ip_pub = obtener_ip_publica()
    os.system('cls' if os.name == 'nt' else 'clear')

    print("=" * 50)
    print("      VANGUARD TCR - SERVER STATUS (CHEROOT)")
    print("=" * 50)
    print(f"[*] PIN DE ACCESO:    \033[1;32m{PIN_ACCESO}\033[0m")
    print(f"[*] IP PUBLICA:       \033[1;36m{ip_pub}\033[0m")
    print("-" * 50)

    server = WSGIServer(('0.0.0.0', 5000), app)
    if os.path.exists('cert.pem'):
        server.ssl_adapter = BuiltinSSLAdapter(certificate='cert.pem', private_key='key.pem')
        print("[+] HTTPS activado.")
    
    try:
        server.start()
    except KeyboardInterrupt:
        server.stop()