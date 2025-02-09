const makeWASocket = require("@whiskeysockets/baileys").default;
const { useSingleFileAuthState } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const pino = require("pino");

// Ensure auth folder exists
if (!fs.existsSync("./auth_info")) {
    fs.mkdirSync("./auth_info", { recursive: true });
}

const { state, saveState } = useSingleFileAuthState("./auth_info/creds.json");

const startBot = () => {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" })
    });

    sock.ev.on("creds.update", saveState);
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
            console.log("Connection closed, reconnecting...", shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log("✅ Successfully connected to WhatsApp!");
        }
    });
};

startBot();
