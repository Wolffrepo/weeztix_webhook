import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Form-Data akzeptieren

const PUSHOVER_TOKEN = process.env.PUSHOVER_TOKEN;
const PUSHOVER_USER = process.env.PUSHOVER_USER;

app.post("/weeztix", async (req, res) => {
  try {
    // Payload: Body oder Query-Parameter
    const data = Object.keys(req.body).length ? req.body : req.query;
    console.log("📩 Eingehende Payload:", JSON.stringify(data, null, 2));

    // --- Event-Name ermitteln ---
    const eventName =
      data.event_name ||
      data.event_title ||
      data.event?.name ||
      data.event?.title ||
      data.name ||
      "Unbekanntes Event";

    // --- Anzahl gekaufter Tickets ermitteln ---
    let bought = 0;
    if (Array.isArray(data.tickets)) {
      bought = data.tickets.reduce((sum, t) => sum + (t.quantity || 1), 0);
    } else if (data.order?.tickets) {
      bought = data.order.tickets.reduce((sum, t) => sum + (t.quantity || 1), 0);
    } else if (data.quantity) {
      bought = Number(data.quantity);
    }

    // --- Gesamtanzahl aller Tickets ---
    let total = "unbekannt";
    if (data.order?.total_tickets) total = data.order.total_tickets;
    else if (data.total_tickets_sold) total = data.total_tickets_sold;
    else if (data.total_sold) total = data.total_sold;
    else if (data.stats?.sold) total = data.stats.sold;

    // --- Nachricht zusammenbauen ---
    const message = `${bought} neue Tickets (gesamt ${total})`;

    // --- Pushover senden ---
    const pushoverRes = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: PUSHOVER_TOKEN,
        user: PUSHOVER_USER,
        title: `🎟️ ${eventName}`,
        message,
      }),
    });

    if (!pushoverRes.ok) throw new Error("Pushover API Fehler");

    console.log("✅ Pushover gesendet:", message);
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Fehler im Webhook:", err);
    res.status(500).send("Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook läuft auf Port ${PORT}`));
