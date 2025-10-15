import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PUSHOVER_TOKEN = process.env.PUSHOVER_TOKEN;
const PUSHOVER_USER = process.env.PUSHOVER_USER;
const WEEZTIX_API_URL = "https://shop.api.weeztix.com";

app.post("/weeztix", async (req, res) => {
  try {
    const eventId = req.body.event_id;
    if (!eventId) {
      console.error("Event-ID fehlt");
      return res.status(400).send("Event-ID fehlt");
    }

    // API-Aufruf, um Bestelldaten zu erhalten
    const apiRes = await fetch(`${WEEZTIX_API_URL}/events/${eventId}/orders`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.WEEZTIX_API_KEY}`,
      },
    });

    if (!apiRes.ok) {
      console.error("Fehler beim Abrufen der Bestelldaten");
      return res.status(500).send("Fehler beim Abrufen der Bestelldaten");
    }

    const orderData = await apiRes.json();
    const ticketsBought = orderData.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    const totalTickets = orderData.total_tickets;

    const message = `${orderData.event_name} – ${ticketsBought} neue Tickets (insgesamt ${totalTickets})`;

    // Pushover-Benachrichtigung senden
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

    if (!pushoverRes.ok) {
      console.error("Fehler beim Senden der Pushover-Nachricht");
      return res.status(500).send("Fehler beim Senden der Pushover-Nachricht");
    }

    console.log("✅ Pushover gesendet:", message);
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Fehler im Webhook:", err);
    res.status(500).send("Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook läuft auf Port ${PORT}`));
