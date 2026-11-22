# Ubicación Desacoplada del Código Fuera de Google Drive

Decidimos que el proyecto de código de la aplicación web y motor narrativo residirá en un directorio de desarrollo local independiente fuera del árbol sincronizado de Google Drive.

La aplicación leerá y sincronizará con el Vault Maestro de Thyrenia a través de una variable de entorno configurable (`VAULT_PATH`). Esto previene que Google Drive intente sincronizar decenas de miles de archivos de `node_modules`, artefactos de compilación `.next` o archivos de base de datos bloqueados por procesos activos, manteniendo el Vault ágil y seguro.
