import crypto from 'crypto';

const VAULT_MASTER_KEY = process.env.VAULT_MASTER_KEY || crypto.randomBytes(32).toString('hex');
const CIPHER_ALGO = 'aes-256-gcm';

export function encriptarTextoPlano(texto: string, claveSecretaHex: string = VAULT_MASTER_KEY): { iv: string; tag: string; data: string } {
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(claveSecretaHex, 'salt-casa-del-rey-v1', 32);
  const cipher = crypto.createCipheriv(CIPHER_ALGO, key, iv);
  let encrypted = cipher.update(texto, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted
  };
}

export function desencriptarTextoPlano(payload: { iv: string; tag: string; data: string }, claveSecretaHex: string = VAULT_MASTER_KEY): string {
  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const key = crypto.scryptSync(claveSecretaHex, 'salt-casa-del-rey-v1', 32);
  const decipher = crypto.createDecipheriv(CIPHER_ALGO, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(payload.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function sanitizarComoTextoPlanoServer(input: unknown, maxLen = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, maxLen);
}
