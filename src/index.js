import 'dotenv/config';
import { createRequire } from 'node:module';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { handleMessage } from './bot.js';

const require = createRequire(import.meta.url);
const baileys = require('@whiskeysockets/baileys');
const makeWASocket = baileys.default || baileys.makeWASocket || baileys;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;

const logger = pino({ level: 'warn' });

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Using Baileys v${version.join('.')} (latest: ${isLatest})`);

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    markOnlineOnConnect: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 סרקו את ה־QR בוואטסאפ → הגדרות → מכשירים מקושרים → קישור מכשיר:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log(`✅ מחובר לוואטסאפ בתור: ${sock.user?.id}`);
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      console.log(`🔌 החיבור נסגר (קוד ${statusCode}). ${loggedOut ? 'מחקו את תיקיית auth_info כדי להתחבר מחדש.' : 'מתחבר מחדש...'}`);
      if (!loggedOut) setTimeout(start, 2000);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try {
        await handleMessage(sock, msg);
      } catch (err) {
        console.error('Handler error:', err);
      }
    }
  });
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
