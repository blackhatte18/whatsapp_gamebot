import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import express from 'express';
import readline from 'readline';
import P from 'pino';

const app = express();
const PORT = 3005;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function startBot() {
    try {
        rl.question('Do you want to use QR code or pairing code? (qr/pairing): ', async (method) => {
            if (method !== 'qr' && method !== 'pairing') {
                console.log('Invalid option. Please restart and choose "qr" or "pairing".');
                rl.close();
                return;
            }

            if (method === 'pairing') {
                rl.question('Enter your phone number (with country code, e.g., 234XXXXXXXXXX): ', async (phoneNumber) => {
                    await initializeBot(method, phoneNumber);
                    rl.close();
                });
            } else {
                await initializeBot(method);
                rl.close();
            }
        });
    } catch (error) {
        console.log('An error occurred:', error);
    }
}

async function initializeBot(method, phoneNumber = null) {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: method === 'qr', 
            getMessage: async (key) => {},
            logger: P({ level: 'silent' }),
            browser: ['Ubuntu', 'Chrome', '22.04.4']
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr, pairingCode } = update;

            if (method === 'qr' && qr) {
                console.log('Scan this QR Code:', qr);
            }
            if (method === 'pairing' && pairingCode) {
                console.log(`Pairing Code for ${phoneNumber}:`, pairingCode);
            }

            if (connection === 'close') {
                if (lastDisconnect?.error?.output?.statusCode !== 401) {
                    startBot();
                } else {
                    console.log('Logged out. Restart server to reauthenticate.');
                }
            } else if (connection === 'open') {
                console.log('Connected to WhatsApp! 📱');
            }
        });
    } catch (error) {
        console.log('An error occurred:', error);
    }
}

startBot();

app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
});
