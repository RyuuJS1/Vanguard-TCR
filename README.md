# Vanguard-TCR
### Sistema Distribuido de Monitoreo y Control Remoto Seguro

![Python](https://img.shields.io/badge/Python-3.x-blue?style=for-the-badge&logo=python)
![Sockets](https://img.shields.io/badge/TCP/IP-Sockets-green?style=for-the-badge)
![TLS](https://img.shields.io/badge/Seguridad-TLS%2FSSL-red?style=for-the-badge)
![Platform](https://img.shields.io/badge/Plataforma-Windows%20%7C%20Linux-lightgrey?style=for-the-badge)

<img width="1081" height="545" alt="image" src="https://github.com/user-attachments/assets/d0373fff-8744-4d93-9893-e778f35224d9" />

## Descripción General

**Vanguard-TCR** es un sistema distribuido de monitoreo y comunicación diseñado para administrar y supervisar procesos de forma remota en múltiples máquinas mediante comunicación segura TCP/IP.

El proyecto fue desarrollado con el propósito de proporcionar una infraestructura segura y eficiente para:
- Administración remota de procesos
- Comunicación en sistemas distribuidos
- Monitoreo en tiempo real de recursos
- Autenticación segura entre máquinas
- Gestión remota multiplataforma
- Operaciones listas para entornos de red y nube

El sistema permite que una computadora cliente se conecte de forma segura a una máquina servidor utilizando un PIN único generado dinámicamente por el servidor.

Una vez autenticado, el usuario puede:
- Monitorear procesos del sistema
- Iniciar y finalizar aplicaciones remotamente
- Visualizar el uso de CPU y memoria en tiempo real
- Capturar pantallas remotamente
- Interactuar con el servidor mediante una terminal integrada
- Monitorear sistemas Windows y Linux

---

# Arquitectura del Sistema

```text
 ┌────────────────────┐
 │ Computadora Cliente│
 │ GUI + Terminal     │
 └─────────┬──────────┘
           │
     TCP/IP Seguro
        TLS/SSL
           │
 ┌─────────▼──────────┐
 │ Servidor Vanguard  │
 │ Control de Procesos│
 │ Monitor de Recursos│
 └─────────┬──────────┘
           │
 ┌─────────▼──────────┐
 │ Sistema Operativo  │
 │ Windows / Linux    │
 └────────────────────┘
```

---

# Características
## Gestión de Procesos
- Listar procesos activos
- Iniciar aplicaciones remotamente
- Detener procesos en ejecución
- Monitorear el estado de los procesos dinámicamente

## Monitoreo en Tiempo Real
- Visualización del uso de CPU
- Seguimiento del consumo de RAM
- Estadísticas de rendimiento en vivo
- Interfaz gráfica de monitoreo

## Comunicación Segura
- Comunicación mediante sockets TCP/IP
- Transmisión de datos cifrada con TLS/SSL
- Sistema dinámico de autenticación mediante PIN
- Verificación de identidad cliente-servidor

## Soporte para Sistemas Distribuidos
- Múltiples servidores remotos
- Comunicación basada en middleware
- Administración de procesos entre máquinas
- Mecanismos de descubrimiento de servicios

## Supervisión Remota
- Capturas de pantalla en tiempo real
- Monitoreo remoto de actividades
- Terminal interactiva de comandos
- Compatibilidad multiplataforma

## Interfaz Gráfica
- Panel de monitoreo intuitivo
- Gráficas en tiempo real
- Indicadores porcentuales de recursos
- Registro de actividades y alertas

---

# ⚙️ Tecnologías Utilizadas
- Python
- Render
- Ngrok
- Programación con Sockets TCP/IP
- Cifrado TLS/SSL
- Threading / Multiprocessing
- Gestión de Procesos del Sistema
- Conceptos de Sistemas Distribuidos
- Arquitectura Cliente-Servidor
- Desarrollo de Interfaces Gráficas
- Compatibilidad con Windows y Linux

---

# 🔐 Modelo de Seguridad

Vanguard-TCR implementa un sistema de autenticación ligero pero eficiente:
1. El servidor genera un PIN de seguridad aleatorio al iniciar.
2. Los clientes deben ingresar ese PIN antes de establecer conexión.
3. Toda la comunicación está cifrada mediante TLS/SSL.
4. Los usuarios no autorizados no pueden interactuar con los recursos del servidor.

Esta arquitectura ayuda a garantizar:

- Administración remota segura
- Comunicación cifrada en la red
- Control de acceso entre máquinas distribuidas

---

## 📖 Propósito Educativo

Este proyecto fue desarrollado como una implementación académica y técnica de conceptos relacionados con:

- Sistemas Operativos Distribuidos
- Comunicación Middleware
- Programación Segura en Redes
- Administración Remota de Procesos
- Arquitecturas Cliente-Servidor
- Sistemas de Monitoreo de Recursos
- Administración Multiplataforma

---

## 📈 Mejoras Futuras
- Integración con dashboard web
- Sistema de registros con base de datos
- Autenticación multiusuario
- Permisos basados en roles
- Despliegue con Docker
- Arquitectura cloud-native
- Sistema de transferencia de archivos
- Analíticas avanzadas y alertas inteligentes

---

## 📸 Capturas del programa

<img width="502" height="295" alt="image" src="https://github.com/user-attachments/assets/5cd060d8-3cb2-45d3-98c9-3dd3d5630463" />

## Inicio de Sesion por Pin
<img width="310" height="236" alt="image" src="https://github.com/user-attachments/assets/236fa6d9-d92f-47d6-ac85-9c9dfa69141d" />
<img width="504" height="236" alt="image" src="https://github.com/user-attachments/assets/5cb1ce93-a09d-469f-87cd-d9b9ea881cdd" />

## Pagina principal
<img width="818" height="413" alt="image" src="https://github.com/user-attachments/assets/c0d2e765-a636-4d9d-8987-48c7c1b55b69" />

## Pruebas y resultados
Se realizaron diversas pruebas para comprobar que el sistema funciona a la perfección sin fallos.
Ejecución de comandos como OPEN CALC, HELP, LIST, ETC
Resultado: La calculadora se abrió y cerro en el host remoto exitosamente.
<img width="694" height="472" alt="image" src="https://github.com/user-attachments/assets/e4b4ba21-a3c6-4b81-a3f6-9e41bf98e12f" />

### Se muestran todos los comandos disponibles.
<img width="824" height="89" alt="image" src="https://github.com/user-attachments/assets/7182e926-be31-4235-94de-e11b8cb7ada5" />

### Se muestran listados los procesos del sistema.
<img width="414" height="354" alt="image" src="https://github.com/user-attachments/assets/48ff6c81-d7b8-4d73-8eee-7de07cfc28cc" />

### Se muestran correctamente los archivos y documentos de la ruta seleccionada.
<img width="443" height="461" alt="image" src="https://github.com/user-attachments/assets/e370b0cf-5382-4c16-920e-1a756c82f46d" />
<img width="472" height="460" alt="image" src="https://github.com/user-attachments/assets/26bcb25d-1b57-45e9-a763-3b7fddf75d55" />

### Se toma una captura de pantalla correctamente.
<img width="921" height="465" alt="image" src="https://github.com/user-attachments/assets/bc777bb0-1cde-4db2-87ef-7acfd36e3eed" />

### Se crearon los documentos correctamente 
<img width="605" height="141" alt="image" src="https://github.com/user-attachments/assets/873d33c8-5a87-4f36-8ba6-3b38d7199260" />
<img width="921" height="91" alt="image" src="https://github.com/user-attachments/assets/4fc19811-3eb0-4775-9a0c-926baf4d7242" />

## 🔐 Pruebas de seguridad
Intento de acceso sin Token
Éxito: El servidor retornó Error 401 (No autorizado).
<img width="875" height="278" alt="image" src="https://github.com/user-attachments/assets/e5b90984-1fb8-45ba-ad22-4baf8325f2b9" />

---

## Autores
- Kevin Ramos Alarcon
- Calixto Isaac Galeana Medrano
Estudiantes de Ingeniería en Desarrollo de Software

---
## 🟢 Estado del proyecto
En desarrollo / Proyecto académico con potencial de mejora

## ⭐ Agradecimientos
Un agradecimiento especial a todos los miembros del equipo que contribuyeron al desarrollo, la implementación y la mejora de este proyecto.

Si este proyecto te ha parecido interesante, no dudes en marcar el repositorio con una estrella y explorar el código fuente.
