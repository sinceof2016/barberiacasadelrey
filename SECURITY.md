# Política de Seguridad y Resguardo de Credenciales - Barbería La Casa del Rey

Este documento describe las medidas de ciberseguridad implementadas para proteger las credenciales, accesos administrativos y los datos del sistema.

## 1. Módulo de Gestión de Secretos (Secrets Vault - AES-256-GCM)

Para erradicar la dispersión e inseguridad de credenciales críticas en el frontend mediante llamadas directas a variables `.env`:

- **Arquitectura de Bóveda Centralizada**: Todas las credenciales críticas (claves de API de Firebase, OAuth Client ID, tokens de mensajería WhatsApp, llaves de Inteligencia Artificial Gemini) son gestionadas exclusivamente a través del servicio de Bóveda Cifrada (`src/services/secretsVault.ts` y módulo seguro en `server.ts`).
- **Cifrado en Reposo y en Tránsito (AES-256-GCM)**:
  - Derivación de claves maestras con **PBKDF2 (SHA-256, 100,000 iteraciones)** y salt criptográfico dedicado.
  - Cifrado simétrico autenticado **AES-256-GCM** con vectores de inicialización (IV) únicos de 96 bits y etiquetas de autenticación **AuthTag** de 128 bits.
- **Zero-Frontend-Leak (0 Credenciales Expuestas)**:
  - Ningún valor de credencial sensible viaja en texto plano hacia el navegador.
  - Los endpoints de consulta solo exponen metadatos sanitizados con máscaras ofuscadas de seguridad (`••••••••••••`).
  - La configuración pública de Firebase (`src/services/firebaseConfig.ts`) se alimenta de la configuración no sensible entregada por el Vault sin exponer secretos en el bundle de producción.
- **Auditoría Criptográfica en Tiempo Real**:
  - Endpoint de prueba de integridad (`POST /api/v1/barberia-casa-del-rey/vault/test`) que valida el ciclo completo de cifrado, descifrado y firmas AuthTag con telemetría de latencia en milisegundos.
- **Rotación Segura**: Los Super Administradores pueden rotar y actualizar cualquier secreto directamente desde la consola administrativa, enviando el nuevo valor cifrado al servidor.

## 2. Protección Contra Ataques de Fuerza Bruta (Límite de Intentos de Inicio de Sesión)

Para salvaguardar las cuentas de SuperAdmin, Administrador y Cajeros:

- **Límite Máximo**: 5 intentos fallidos consecutivos por dirección de correo electrónico o IP.
- **Bloqueo Temporal**: 15 minutos de inhabilitación inmediata tras alcanzar el 5.º intento fallido.
- **Defensa en Profundidad**:
  - **Capa Servidor (`server.ts`)**: Monitoreo en memoria con cabeceras `Retry-After` y código HTTP 429 (Too Many Requests).
  - **Capa Cliente / Fallback (`localBackendFallback.ts`)**: Persistencia segura de contadores y sellos temporales de bloqueo en almacenamiento local aislado para garantizar protección incluso en entornos estáticos (GitHub Pages).
- **Notificación Limpia**: La interfaz de inicio de sesión (`LoginModal.tsx`) notifica de forma discreta los intentos restantes en caso de error o el tiempo de espera restante si la cuenta queda bloqueada, sin banners intrusivos.

## 3. Control de Acceso Basado en Roles (RBAC)

- **Super Administrador (David Orjuela)**: Acceso irrestricto a la consola de API, gestión de nómina con modificación de fotografías de barberos, creación de sedes, auditoría contable y control de la Bóveda de Secretos.
- **Administrador**: Gestión operativa de citas, clientes y servicios sin acceso a la consola de API ni al Vault.
- **Cajero**: Aislamiento estricto a su sede asignada, apertura/cierre de gaveta y registro de turnos diarios.

## 4. Aislamiento en `.gitignore` y Sincronización en GitHub

Se previene cualquier filtración accidental en repositorios Git mediante exclusión estricta de:
- Archivos de variables de entorno: `.env*` (excepto `.env.example`).
- Claves privadas y certificados: `*.pem`, `*.key`, `*.pfx`, `*.p12`, `*.crt`.
- Cuentas de servicio y secretos: `credentials.json`, `service-account*.json`, `client_secret*.json`.
- Credenciales Firebase y caché local: `firebase-applet-config.json`, `.firebase/`.

