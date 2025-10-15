import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// 🔐 Pushover-Zugangsdaten (Render → Environment Variables)
const PUSHOVER_TOKEN = process.env.PUSHOVER_TOKEN;
const PUSHOVER_USER = process.env.PUSHOVER_USER;

app.post("/weeztix", async (req, res) => {
  try {
    const data = req.body;

    // 👉 Eingehende Payload für Debug in Render-Logs
    console.log("📩 Eingehende Daten:", JSON.stringify(data, null, 2));

    // 🧠 Intelligente Erkennung der Event-Namen
    const eventName =
      data?.event?.name ||
      data?.event_name ||
      data?.eventTitle ||
      data?.eventtitle ||
      data?.name ||
      "Unbekanntes Event";

    // 🧮 Intelligente Erkennung der Anzahl neu gekaufter Tickets
    const bought =
      data?.order?.tickets ||
      data?.tickets?.length ||
      data?.quantity ||
      data?.order_quantity ||
      data?.sold_tickets ||
      0;

    // 📊 Intelligente Erkennung der Gesamtzahl aller verkauften Tickets
    const total =
      data?.order?.totalTicketsSold ||
      data?.totalTicketsSold ||
      data?.total_sold ||
      data?.total_tickets ||
      data?.stats?.sold ||
      "unbekannt";

    // 💬 Nachricht zusammenbauen
    const message = `${eventName} – ${bought} neue Tickets (insgesamt ${total})`;

    // 📨 Pushover senden
    const pushoverRes = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: PUSHOVER_TOKEN,
        user: PUSHOVER_USER,
        message,
        title: "🎟️ Ticketverkauf"
      })
    });

    if (!pushoverRes.ok) throw new Error("Pushover API Fehler");

    console.log("✅ Pushover Nachricht gesendet:", message);
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Fehler im Webhook:", err);
    res.status(500).send("Error");
  }
});

// Render PORT verwenden
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook läuft auf Port ${PORT}`));
