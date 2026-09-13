# Barbería La Casa del Rey - Sistema Integral de Gestión & Reservas

Aplicación web premium para la gestión operativa, reservas en línea individuales y grupales, control de caja y contabilidad diaria, gestión de nómina de maestros barberos y administración con control de acceso basado en roles (RBAC).

---

## Características Principales

### 1. Gestión de Barberos (Super Admin)
- **Modificación de Fotos y Perfiles**: Los perfiles de los maestros barberos ahora soportan actualización dinámica de su imagen/avatar.
- **Múltiples Métodos de Carga**:
  - Galería curada con 6 retratos vintage predefinidos de alta calidad.
  - Inserción de URL directa de imagen externa.
  - Subida directa de archivo de imagen desde el dispositivo (soporta PNG, JPG, WebP en base64).
  - Previsualización circular instantánea con marco dorado y botón para restablecer o remover la foto.
- **Visualización en Nómina**: La lista de barberos en el Super Admin y en el catálogo público muestra de inmediato el retrato actualizado.

### 2. Almacenamiento en la Nube de Google (Google Cloud Storage / Firebase Storage)
- **Bucket Conectado**: `galvanized-emblem-pzp2g.firebasestorage.app` (Región: `us-east1`).
- **Persistencia de Archivos**: Almacenamiento persistente de fotografías de perfil de los barberos, comprobantes de pago, galería de cortes y respaldos del sistema.
- **Protocolo y URLs Seguras**: Acceso mediante CDN de Google Cloud con tokens de descarga criptográficos (`getDownloadURL`) y soporte nativo para `gs://`.
- **Carga Directa Resiliente**: Servicio unificado `src/services/cloudStorage.ts` con manejo de subidas binarias (`File`/`Blob`) y cadenas Base64 con fallback automático.
- **Consola de Supervisión**: Panel en el módulo de Bóveda para comprobar en tiempo real la conectividad y estado del bucket en Google Cloud Platform.

### 3. Bóveda Cifrada de Secretos (Secrets Vault - AES-256-GCM)
- **Reemplazo Directo de `.env`**: Centralización de credenciales críticas en una bóveda criptográfica en lugar de depender de variables de entorno dispersas en el código.
- **Zero-Frontend-Leak**: Ninguna credencial sensible (claves de API de Firebase, OAuth Client IDs, Gemini API Key, WhatsApp Tokens) es expuesta en el frontend ni en repositorios públicos.
- **Cifrado Fuerte**: Claves maestras PBKDF2 (SHA-256 con 100,000 iteraciones) y cifrado autenticado AES-256-GCM con verificación de AuthTag.
- **Auditoría en Tiempo Real & Rotación**: Pestaña dedicada en la consola de Super Administrador para auditar la salud del Vault, verificar latencia criptográfica y rotar secretos en caliente.
- **Protección de Filtraciones en Git**: Reglas exhaustivas en `.gitignore` para bloquear archivos de credenciales (`*.pem`, `*.key`, `credentials.json`, `service-account*.json`, `.env*`).

### 3. Límite de Intentos de Inicio de Sesión (Protección Anti Fuerza Bruta)
- **Umbral de Seguridad**: Máximo **5 intentos fallidos** consecutivos por usuario o dirección IP.
- **Bloqueo Temporal**: Suspensión automática de **15 minutos** con respuesta HTTP 429 (`Too Many Requests`).
- **Defensa en Profundidad**: Implementado tanto en el backend Express (`server.ts`) como en la capa fallback de cliente (`localBackendFallback.ts`), asegurando protección ininterrumpida incluso en despliegues estáticos (GitHub Pages).
- **Interfaz Interactiva**: Modal de inicio de sesión (`LoginModal.tsx`) con visibilidad de contraseña, advertencias preventivas de intentos restantes y bloqueo con temporizador.

---

## Sincronización con GitHub

El repositorio Git local ya ha sido inicializado en la rama `main` y todos los archivos han sido consolidados.

Para vincular y sincronizar con tu repositorio en GitHub:

```bash
# 1. Conectar tu repositorio remoto de GitHub (reemplaza con tu URL real):
git remote add origin https://github.com/TU-USUARIO/barberia-la-casa-del-rey.git

# 2. Asegurar que la rama principal sea 'main':
git branch -M main

# 3. Subir el proyecto a GitHub:
git push -u origin main
```

El flujo de GitHub Actions configurado en `.github/workflows/deploy.yml` compilará y desplegará automáticamente la aplicación en **GitHub Pages** tras cada `git push`.
