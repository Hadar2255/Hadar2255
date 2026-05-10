import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const RAW = process.env.BOT_ENCRYPTION_KEY;
export const ENCRYPTION_ENABLED = Boolean(RAW && RAW.length >= 12);

const key = ENCRYPTION_ENABLED
  ? scryptSync(RAW, 'victor-bot-data-key-v1', 32)
  : null;

const PREFIX = 'enc:v1:';

if (!ENCRYPTION_ENABLED) {
  console.warn(
    '⚠️  BOT_ENCRYPTION_KEY לא מוגדר (או קצר מ־12 תווים).\n' +
    '   ההודעות והרשימות יישמרו בקובץ DB ללא הצפנה.\n' +
    '   הוסף ב־.env שורה כמו: BOT_ENCRYPTION_KEY=סיסמה-חזקה-לפחות-12-תווים'
  );
}

export function encrypt(plaintext) {
  if (!ENCRYPTION_ENABLED || plaintext == null) return plaintext;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ct]).toString('base64');
}

export function decrypt(text) {
  if (typeof text !== 'string' || !text.startsWith(PREFIX)) return text;
  if (!ENCRYPTION_ENABLED) return '[מוצפן — הגדר BOT_ENCRYPTION_KEY]';
  try {
    const buf = Buffer.from(text.slice(PREFIX.length), 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  } catch {
    return '[פענוח נכשל]';
  }
}
