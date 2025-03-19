const express = require("express");
const { MongoClient } = require("mongodb");
const z = require("zod");

const app = express();
const port = 8000;
const client = new MongoClient("mongodb://localhost:27017");
let db;

app.use(express.json());

// 🔹 Schemas dynamiques pour analytics
const AnalyticsSchema = z.object({
  source: z.string(),
  url: z.string(),
  visitor: z.string(),
  createdAt: z.coerce.date(),
  meta: z.record(z.any()), // meta flexible
});

// 🔸 Connexion MongoDB
client.connect().then(() => {
  db = client.db("analyticsDB");
  app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
  });
}).catch(err => console.error("MongoDB Error:", err));


// ========== ROUTES ANALYTICS ==========

// 🔸 POST /views
app.post("/views", async (req, res) => {
  const result = AnalyticsSchema.safeParse(req.body);

  if (!result.success) return res.status(400).json(result);

  try {
    const data = result.data;
    await db.collection("views").insertOne(data);
    res.status(201).json({ message: "View enregistrée", data });
  } catch (err) {
    console.error("Erreur POST /views:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🔸 POST /actions
app.post("/actions", async (req, res) => {
  const result = AnalyticsSchema.extend({ action: z.string() }).safeParse(req.body);

  if (!result.success) return res.status(400).json(result);

  try {
    const data = result.data;
    await db.collection("actions").insertOne(data);
    res.status(201).json({ message: "Action enregistrée", data });
  } catch (err) {
    console.error("Erreur POST /actions:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🔸 POST /goals
app.post("/goals", async (req, res) => {
  const result = AnalyticsSchema.extend({ goal: z.string() }).safeParse(req.body);

  if (!result.success) return res.status(400).json(result);

  try {
    const data = result.data;
    await db.collection("goals").insertOne(data);
    res.status(201).json({ message: "Goal enregistré", data });
  } catch (err) {
    console.error("Erreur POST /goals:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

