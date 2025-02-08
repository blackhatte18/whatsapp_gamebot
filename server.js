const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Keep Glitch awake
app.get("/", (req, res) => {
    res.send("Bot is running! 🚀");
});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");
    const sock = makeWASocket({ auth: state });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", ({ connection, qr }) => {
        if (qr) {
            console.log("Scan this QR code with WhatsApp:");
            console.log(qr);
        } else if (connection === "open") {
            console.log("✅ Bot is now connected to WhatsApp!");
            console.log("CREATORS: GOD, levi, and blvck");
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const chatId = msg.key.remoteJid;
        const text = msg.message.conversation?.toLowerCase() || "";

        let reply = "";

        if (text.includes("start")) {
            reply = "🔥 Welcome to the Manipulator's Game 🔥\n\nReply with 'Truth' or 'Lie'.";
        } else if (text === "truth" || text === "lie") {
            reply = `You chose: ${text.toUpperCase()} ✅\n\nNow, type "Guess" to see if I catch you!`;
        } else if (text.includes("guess")) {
            reply = Math.random() < 0.5 ? "I caught you! 😈" : "You tricked me! 🎉";
        } else {
            reply = "Send 'Start' to begin the game!";
        }

        await sock.sendMessage(chatId, { text: reply });
    });
}

app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

startBot();
