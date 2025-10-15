import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Formdata unterstützen

const PUSHOVER_TOKEN = process.env.PUSHOVER_TOKEN;
const PUSHOVER_USER = process.env.PUSHOVER_USER;
const WEEZTIX_API_KEY = process.env.WEEZTIX_API_KEY; // Dein API Key hier
const WEEZTIX_API_URL = "https://api.weeztix.com"; // Endpoint prüfen

// Webhook Route
app.post("/weeztix", async (req, res) => {
  try {
    const eventId = req.body.event_id || req.query.event_id;
    if (!eventId) {
      console.error("❌ Event-ID fehlt im Webhook");
      return res.status(400).send("Event-ID fehlt");
    }

    // 1️⃣ Daten von Weeztix API abrufen
    const apiRes = await fetch(`${WEEZTIX_API_URL}/events/${eventId}/orders`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${WEEZTIX_API_KEY}` },
    });

    if (!apiRes.ok) {
      console.error("❌ Fehler beim Abrufen der Bestelldaten");
      return res.status(500).send("Fehler bei API-Abfrage");
    }

    const orderData = await apiRes.json();

    // 2️⃣ Tickets summieren
    const ticketsBought = orderData.tickets?.reduce(
      (sum, t) => sum + (t.quantity || 1),
      0
    ) || 0;

    const totalTickets =
      orderData.total_tickets ||
      orderData.total_sold ||
      orderData.stats?.sold ||
      "unbekannt";

    const eventName =
      orderData.event_name ||
      orderData.event?.title ||
      "Unbekanntes Event";

    const message = `${eventName} – ${ticketsBought} neue Tickets (insgesamt ${totalTickets})`;

    // 3️⃣ Pushover senden
    const pushoverRes = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: PUSHOVER_TOKEN,
        user: PUSHOVER_USER,
        title: "🎟️ Ticketverkauf",
        message,
      }),
    });

    if (!pushoverRes.ok) throw new Error("Fehler beim Senden an Pushover");

    console.log("✅ Nachricht gesendet:", message);
    res.status(200).send("OK");

  } catch (err) {
    console.error("❌ Fehler im Webhook:", err);
    res.status(500).send("Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook läuft auf Port ${PORT}`));
