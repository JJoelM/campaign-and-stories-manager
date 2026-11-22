# Despliegue Local-First con Túnel Seguro

Decidimos adoptar un modelo de despliegue local-first. La aplicación corre en la máquina del DM junto al Vault Maestro de Obsidian. Los jugadores acceden de forma remota y segura a través de un túnel cifrado (Cloudflare Tunnel o similar) que expone un endpoint HTTPS temporal o personalizado sin necesidad de abrir puertos de router ni pagar por hosting o bases de datos en la nube. Esto garantiza privacidad total, costo cero y sincronización instantánea sin latencia con los archivos locales.
