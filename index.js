import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ unterstützt Formdaten

const PUSHOVER_TOKEN = process.env.PUSHOVER_TOKEN;
const PUSHOVER_USER = process.env.PUSHOVER_USER;

app.post("/weeztix", async (req, res) => {
  try {
    const data = Object.keys(req.body).length ? req.body : req.query;

    console.log("📩 Eingehende Daten:", JSON.stringify(data, null, 2));

    const eventName =
      data.event_name || data.event || data.name || "Unbekanntes Event";
    const bought = data.quantity || data.tickets || 0;
    const total = data.total || data.total_sold || "unbekannt";

    const message = `${eventName} – ${bought} neue Tickets (insgesamt ${total})`;

    await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: PUSHOVER_TOKEN,
        user: PUSHOVER_USER,
        title: "🎟️ Ticketverkauf",
        message,
      }),
    });

    console.log("✅ Pushover Nachricht gesendet:", message);
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Fehler im Webhook:", err);
    res.status(500).send("Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook läuft auf Port ${PORT}`));
