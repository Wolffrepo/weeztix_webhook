import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const WEEZTIX_API_KEY = process.env.WEEZTIX_API_KEY;
const PUSHOVER_TOKEN = process.env.PUSHOVER_TOKEN;
const PUSHOVER_USER = process.env.PUSHOVER_USER;

app.post("/weeztix-webhook", async (req, res) => {
  try {
    const data = req.body;
    const eventGuid = data.event_guid;
    const ticketsBought = data.tickets?.length || 1;

    // 1️⃣ Eventdetails abrufen
    const eventResponse = await axios.get(
      `https://api.weeztix.com/event/${eventGuid}`,
      { headers: { Authorization: `Bearer ${WEEZTIX_API_KEY}` } }
    );
    const eventName = eventResponse.data.name || "Unbekanntes Event";

    // 2️⃣ Gesamtzahl der verkauften Tickets abrufen
    const statsResponse = await axios.post(
      `https://api.weeztix.com/event/${eventGuid}/salesstats`,
      {},
      { headers: { Authorization: `Bearer ${WEEZTIX_API_KEY}` } }
    );

    const totalTickets = statsResponse.data.ticket_types
      ?.map((t) => t.sold)
      ?.reduce((a, b) => a + b, 0) || 0;

    // 3️⃣ Nachricht zusammenbauen
    const message = `🎟️ ${eventName}\n➕ ${ticketsBought} neue Tickets\n📊 Insgesamt: ${totalTickets}`;

    // 4️⃣ Pushover senden
    await axios.post("https://api.pushover.net/1/messages.json", {
      token: PUSHOVER_TOKEN,
      user: PUSHOVER_USER,
      title: "Weeztix Ticketverkauf",
      message,
    });

    res.status(200).send("OK");
  } catch (error) {
    console.error("Fehler:", error.message);
    res.status(500).send("Fehler beim Verarbeiten des Webhooks");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Webhook läuft auf Port ${port}`));
