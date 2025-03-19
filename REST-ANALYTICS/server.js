const express = require("express");
const { MongoClient,ObjectId } = require("mongodb");
const z = require("zod");

const app = express();
const port = 8000;
const client = new MongoClient("mongodb://localhost:27017");
let db;

app.use(express.json());


const AnalyticsSchema = z.object({
  source: z.string(),
  url: z.string(),
  visitor: z.string(),
  createdAt: z.coerce.date(),
  meta: z.record(z.any()), 
});

client.connect().then(() => {
  db = client.db("analyticsDB");
  app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
  });
}).catch(err => console.error("MongoDB Error:", err));



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


app.get("/goals/:goalId/details", async (req, res) => {
    const { goalId } = req.params;
  
    try {
      const _id = new ObjectId(goalId);
  
      const result = await db.collection("goals").aggregate([
        { $match: { _id } }, 
        {
          $lookup: { 
            from: "views",
            localField: "visitor",
            foreignField: "visitor",
            as: "views",
          },
        },
        {
          $lookup: { 
            from: "actions",
            localField: "visitor",
            foreignField: "visitor",
            as: "actions",
          },
        },
      ]).toArray();
  
      if (result.length === 0) {
        return res.status(404).json({ error: "Goal non trouvé" });
      }
  
      const data = result[0];
  
      res.json({
        goal: { ...data, _id: data._id.toString(), views: undefined, actions: undefined },
        views: data.views.map(v => ({ ...v, _id: v._id.toString() })),
        actions: data.actions.map(a => ({ ...a, _id: a._id.toString() })),
      });
  
    } catch (err) {
      console.error("Erreur GET /goals/:goalId/details (aggregation):", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
  

