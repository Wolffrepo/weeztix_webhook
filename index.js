import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PUSHOVER_TOKEN = process.env.PUSHOVER_TOKEN;
const PUSHOVER_USER = process.env.PUSHOVER_USER;

app.post("/weeztix", async (req, res) => {
  try {
    const data = req.body;

    const eventName = data?.event?.name || "Unbekanntes Event";
    const bought = data?.order?.tickets || 0;
    const total = data?.order?.totalTicketsSold || "unbekannt";

    const message = `${eventName} – ${bought} neue Tickets (insgesamt ${total})`;

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook läuft auf Port ${PORT}`));
