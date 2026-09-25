/**
 * Sanitizador y Validador de Seguridad para Textos e Inputs
 * Barbería La Casa del Rey
 *
 * Detecta y neutraliza:
 * 1. Ataques XSS (tags <script>, javascript:, onerror=, onload=, etc.)
 * 2. Inyecciones SQL (SELECT, UNION, DROP TABLE, OR 1=1, etc.)
 * 3. Inyecciones NoSQL / MongoDB ($gt, $ne, $where, etc.)
 * 4. Path traversal (../, ..\\, etc.)
 * 5. Inyección de comandos del sistema operativo (; rm -rf, &&, |, ``, etc.)
 * 6. Caracteres de control invisibles o exploits Unicode
 */

export interface ValidationResult {
  esValido: boolean;
  motivo?: string;
  amenazaDetectada?: string;
}

// Patrones regex de amenazas comunes
const DANGEROUS_PATTERNS: Array<{ regex: RegExp; threat: string; reason: string }> = [
  // 1. Tags HTML ejecutables y Scripts
  {
    regex: /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
    threat: 'XSS_SCRIPT_TAG',
    reason: 'Etiquetas de script no permitidas'
  },
  {
    regex: /<[^>]+(on\w+|formaction|xlink:href)\s*=[^>]*>/gi,
    threat: 'XSS_EVENT_HANDLER',
    reason: 'Atributos de eventos o código ejecutable en HTML'
  },
  {
    regex: /(javascript|vbscript|data):/gi,
    threat: 'XSS_PROTOCOL_URI',
    reason: 'Esquema de protocolo malicioso o ejecutable'
  },
  {
    regex: /\b(?:javascript|vbscript):|document\.(?:cookie|location|write)|window\.(?:location|open)|eval\s*\(|alert\s*\(|prompt\s*\(|confirm\s*\(/gi,
    threat: 'XSS_EXECUTION',
    reason: 'Instrucción o script de JavaScript en texto plano'
  },
  {
    regex: /<iframe|<embed|<object|<applet|<meta|<link|<style|<base/gi,
    threat: 'DANGEROUS_HTML_TAG',
    reason: 'Etiquetas HTML peligrosas o de incrustación externa'
  },

  // 2. Inyección de Comandos del Sistema (encadenados o directos)
  {
    regex: /(?:;|&&|\|\||`|\$\([^)]+\))\s*(?:rm|bash|sh|cat|curl|wget|nc|netcat|ncat|powershell|cmd|chmod|chown|kill|exec|eval|whoami|id|sudo)\b/gi,
    threat: 'COMMAND_INJECTION_CHAIN',
    reason: 'Encadenamiento o tubería de comandos de consola/shell'
  },
  {
    regex: /\b(?:sudo\s+|whoami\b|rm\s+-[rf]+|bash\s+-c|sh\s+-c|powershell(?:\.exe)?\s+|cmd\.exe|wget\s+https?:|curl\s+https?:|chmod\s+\+?[0-7]{3,4}|iptables\s+|systemctl\s+(?:stop|restart|status)|killall\s+|nc\s+-e)/gi,
    threat: 'STANDALONE_COMMAND',
    reason: 'Comando de consola o shell del sistema detectado'
  },

  // 3. Inyección SQL maliciosa típica en campos de texto
  {
    regex: /(\b(union\s+all\s+select|union\s+select|select\s+.+\s+from|insert\s+into|drop\s+table|drop\s+database|truncate\s+table|alter\s+table|exec\s*\(|execute\s*immediate)\b)|(\b(or|and)\b\s+['"\d\w]+\s*=\s*['"\d\w]+(\s*--|\s*#|\s*\/\*))|('\s*or\s*'1'\s*=\s*'1|"\s*or\s*"1"\s*=\s*"1|\b1=1\b)/gi,
    threat: 'SQL_INJECTION',
    reason: 'Sintaxis de inyección de base de datos SQL no permitida'
  },

  // 4. Inyección NoSQL
  {
    regex: /\$(?:gt|gte|lt|lte|ne|nin|where|regex|expr|or|and|nor)\b/gi,
    threat: 'NOSQL_INJECTION',
    reason: 'Operadores de inyección NoSQL no permitidos'
  },

  // 5. Path Traversal
  {
    regex: /(\.\.[\/\\]|\/etc\/passwd|c:\\windows\\system32)/gi,
    threat: 'PATH_TRAVERSAL',
    reason: 'Intento de navegación de directorios de sistema'
  },

  // 6. Template Injection (SSTI)
  {
    regex: /(\{\{[\s\S]*\}\}|\$\{[\s\S]*\}|<%[\s\S]*%>)/gi,
    threat: 'TEMPLATE_INJECTION',
    reason: 'Expresiones de inyección de plantillas de servidor'
  }
];

/**
 * Valida si un texto plano es seguro y no contiene código malicioso
 */
export function validarTextoSeguro(
  texto?: string | null,
  opciones?: {
    campo?: string;
    longitudMaxima?: number;
    permitirSaltosLinea?: boolean;
    permitirSimbolosEspeciales?: boolean;
  }
): ValidationResult {
  if (texto === undefined || texto === null || texto === '') {
    return { esValido: true };
  }

  const str = String(texto);
  const maxLen = opciones?.longitudMaxima || 500;

  // 1. Longitud excesiva (prevención DoS por payloads kilométricos)
  if (str.length > maxLen) {
    return {
      esValido: false,
      amenazaDetectada: 'LENGTH_EXCEEDED',
      motivo: `El campo ${opciones?.campo ? `"${opciones.campo}"` : ''} supera la longitud máxima permitida de ${maxLen} caracteres.`
    };
  }

  // 2. Comprobar patrones maliciosos conocidos
  for (const { regex, threat, reason } of DANGEROUS_PATTERNS) {
    regex.lastIndex = 0; // reset regex state
    if (regex.test(str)) {
      return {
        esValido: false,
        amenazaDetectada: threat,
        motivo: `Contenido no permitido en ${opciones?.campo ? `"${opciones.campo}"` : 'el texto'}: ${reason}.`
      };
    }
  }

  // 3. Caracteres nulos o de control no imprimibles (excepto saltos de línea estándar)
  const caracteresControl = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
  if (caracteresControl.test(str)) {
    return {
      esValido: false,
      amenazaDetectada: 'CONTROL_CHARACTERS',
      motivo: 'El texto contiene caracteres de control no permitidos.'
    };
  }

  return { esValido: true };
}

/**
 * Sanitiza una cadena eliminando entidades HTML peligrosas para prevenir inyecciones al renderizar
 */
export function sanitizarTexto(texto?: string | null): string {
  if (!texto) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validador específico para nombres de personas
 */
export function validarNombre(nombre?: string | null): ValidationResult {
  if (!nombre || !nombre.trim()) {
    return { esValido: false, motivo: 'El nombre es obligatorio.' };
  }

  const limpio = nombre.trim();
  if (limpio.length < 2) {
    return { esValido: false, motivo: 'El nombre debe tener al menos 2 caracteres.' };
  }
  if (limpio.length > 80) {
    return { esValido: false, motivo: 'El nombre no puede exceder 80 caracteres.' };
  }

  // Comprobar amenazas
  const checkAmenazas = validarTextoSeguro(limpio, { campo: 'Nombre', longitudMaxima: 80 });
  if (!checkAmenazas.esValido) return checkAmenazas;

  // Permitir letras (incluyendo tildes/ñ), espacios, apóstrofes y guiones comunes
  const regexNombreValido = /^[a-zA-ZÀ-ÿ0-9\s'’.\-()]+$/;
  if (!regexNombreValido.test(limpio)) {
    return {
      esValido: false,
      amenazaDetectada: 'INVALID_CHARACTERS',
      motivo: 'El nombre solo puede contener letras, espacios, puntos o guiones.'
    };
  }

  return { esValido: true };
}

/**
 * Validador específico para teléfonos
 */
export function validarTelefono(telefono?: string | null): ValidationResult {
  if (!telefono || !telefono.trim()) {
    return { esValido: false, motivo: 'El teléfono es obligatorio.' };
  }

  const limpio = telefono.trim();
  const checkAmenazas = validarTextoSeguro(limpio, { campo: 'Teléfono', longitudMaxima: 25 });
  if (!checkAmenazas.esValido) return checkAmenazas;

  // Un teléfono solo debe contener números, espacios, +, paréntesis y guiones
  const regexTel = /^[+0-9\s().-]{7,25}$/;
  if (!regexTel.test(limpio)) {
    return {
      esValido: false,
      amenazaDetectada: 'INVALID_PHONE_FORMAT',
      motivo: 'El número telefónico contiene caracteres no válidos (solo dígitos y prefijo +).'
    };
  }

  const digitos = limpio.replace(/\D/g, '');
  if (digitos.length < 7 || digitos.length > 15) {
    return {
      esValido: false,
      amenazaDetectada: 'INVALID_PHONE_LENGTH',
      motivo: 'El teléfono debe contener entre 7 y 15 dígitos numéricos.'
    };
  }

  return { esValido: true };
}

/**
 * Validador para correos electrónicos
 */
export function validarEmail(email?: string | null): ValidationResult {
  if (!email || !email.trim()) {
    return { esValido: true }; // Email puede ser opcional
  }

  const limpio = email.trim();
  const checkAmenazas = validarTextoSeguro(limpio, { campo: 'Correo electrónico', longitudMaxima: 100 });
  if (!checkAmenazas.esValido) return checkAmenazas;

  // Regex estricta RFC-5322
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(limpio)) {
    return {
      esValido: false,
      amenazaDetectada: 'INVALID_EMAIL_FORMAT',
      motivo: 'El correo electrónico no tiene un formato válido.'
    };
  }

  return { esValido: true };
}
