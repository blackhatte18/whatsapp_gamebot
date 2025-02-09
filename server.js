const { Boom } = require('@hapi/boom');
const { useSingleFileAuthState, makeWASocket } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const express = require('express');

const { state, saveState } = useSingleFileAuthState("./auth_info/creds.json");
const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state
});

sock.ev.on('creds.update', saveState);

sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('Connection closed. Reconnecting...', shouldReconnect);
        if (shouldReconnect) {
            startBot();
        }
    } else if (connection === 'open') {
        console.log('✅ Connected to WhatsApp');
    }
});

sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const sender = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    
    if (text?.toLowerCase() === 'ping') {
        await sock.sendMessage(sender, { text: 'Pong! 🏓' });
    }
});

const app = express();
app.get('/', (req, res) => res.send('WhatsApp Bot is running!'));
app.listen(3000, () => console.log('🌐 Server running on port 3000'));

function startBot() {
    require('child_process').spawn('node', ['server.js'], {
        stdio: 'inherit'
    });
}
