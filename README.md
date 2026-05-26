# Vanguard-TCR
### Sistema Distribuido de Monitoreo y Control Remoto Seguro

![Python](https://img.shields.io/badge/Python-3.x-blue?style=for-the-badge&logo=python)
![Sockets](https://img.shields.io/badge/TCP/IP-Sockets-green?style=for-the-badge)
![TLS](https://img.shields.io/badge/Seguridad-TLS%2FSSL-red?style=for-the-badge)
![Platform](https://img.shields.io/badge/Plataforma-Windows%20%7C%20Linux-lightgrey?style=for-the-badge)

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
