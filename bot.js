const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");
const cron = require("node-cron");

console.log("🚀 FASE 1: Avvio bot...");

async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState('auth');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on("creds.update", saveCreds);

    // 📡 CONNESSIONE + QR
    sock.ev.on("connection.update", (update) => {
        const { connection, qr, lastDisconnect } = update;

        if (qr) {
            console.log("📲 FASE 2: SCANSIONA IL QR:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "open") {
            console.log("🔐 FASE 3: LOGIN COMPLETATO");
            console.log("⚙️ FASE 4: BOT INIZIALIZZATO");

            console.log("📂 TUTTO PRONTO!");
            console.log("🤖 Il bot è attivo");
        }

        if (connection === "close") {

            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log("❌ Connessione chiusa. Reconnect:", shouldReconnect);

            if (shouldReconnect) {
                startBot();
            }
        }
    });

    // 📩 COMANDO !giorni
    sock.ev.on("messages.upsert", async (m) => {

        const msg = m.messages[0];
        if (!msg.message) return;

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text;

        if (text?.toLowerCase() === "!giorni") {

            const oggi = new Date();
            const target = new Date("2026-07-05");

            const giorni = Math.ceil(
                (target - oggi) / (1000 * 60 * 60 * 24)
            );

            let reply;

            if (giorni > 0) reply = `-${giorni}`;
            else if (giorni === 0) reply = "0";
            else reply = "Evento passato";

            await sock.sendMessage(msg.key.remoteJid, {
                text: reply
            });
        }
    });

    // 🕗 MESSAGGIO GIORNALIERO
    cron.schedule("0 8 * * *", async () => {

        try {

            const groupId = "INSERISCI_ID_GRUPPO@g.us";

            const oggi = new Date();
            const target = new Date("2026-07-05");

            const giorni = Math.ceil(
                (target - oggi) / (1000 * 60 * 60 * 24)
            );

            let msg = "";

            if (giorni > 0) msg = `-${giorni}`;
            else if (giorni === 0) msg = "0";
            else return;

            await sock.sendMessage(groupId, { text: msg });

        } catch (err) {
            console.log("❌ Errore cron:", err);
        }

    });

}

startBot();