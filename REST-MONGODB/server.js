const express = require("express");
const { MongoClient } = require("mongodb");
const z = require("zod");
const { ObjectId } = require("mongodb");

const app = express();
const port = 8000;
const client = new MongoClient("mongodb://localhost:27017");
let db;

app.use(express.json());

// Zod schemas
const ProductSchema = z.object({
  _id: z.string(),
  name: z.string(),
  about: z.string(),
  price: z.number().positive(),
  categoryIds: z.array(z.string()).optional(),
});

const CreateProductSchema = ProductSchema.omit({ _id: true });

const CategorySchema = z.object({
    _id: z.string(),
    name: z.string(),
  });
  
  const CreateCategorySchema = CategorySchema.omit({ _id: true });

// Connexion MongoDB + lancement serveur
client.connect().then(() => {
  db = client.db("myDB");
  app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
  });
}).catch(err => {
  console.error("Erreur MongoDB:", err);
});

// POST /products – Crée un produit
app.post("/products", async (req, res) => {
    const result = await CreateProductSchema.safeParse(req.body);
  
    if (result.success) {
      const { name, about, price, categoryIds = [] } = result.data;
  
      try {
        // Conversion des string en ObjectId
        const categoryObjectIds = categoryIds.map(id => new ObjectId(id));
  
        const ack = await db.collection("products").insertOne({
          name,
          about,
          price,
          categoryIds: categoryObjectIds
        });
  
        // Retour propre
        res.send({
          _id: ack.insertedId.toString(),
          name,
          about,
          price,
          categoryIds: categoryObjectIds.map(id => id.toString())
        });
  
      } catch (err) {
        console.error("Erreur POST /products:", err);
        res.status(500).json({ error: "Erreur serveur" });
      }
  
    } else {
      res.status(400).send(result);
    }
  });
  

// GET /products – Liste tous les produits avec _id en string
app.get("/products", async (req, res) => {
    try {
      const result = await db
        .collection("products")
        .aggregate([
          { $match: {} }, 
          {
            $lookup: {
              from: "categories",
              localField: "categoryIds",
              foreignField: "_id",
              as: "categories",
            },
          },
        ])
        .toArray();
  
      const safeResult = result.map(product => ({
        ...product,
        _id: product._id.toString(),
        categoryIds: product.categoryIds ? product.categoryIds.map(id => id.toString()) : [],
        categories: product.categories.map(cat => ({
          ...cat,
          _id: cat._id.toString(),
        })),
      }));
  
      res.json(safeResult);
  
    } catch (err) {
      console.error("Erreur GET /products:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post("/products", async (req, res) => {
    const result = await CreateProductSchema.safeParse(req.body);
  
    if (result.success) {
      const { name, about, price, categoryIds = [] } = result.data;
  
      try {
        const ack = await db.collection("products").insertOne({ name, about, price, categoryIds });
  
        res.send({
          _id: ack.insertedId.toString(),
          name, about, price, categoryIds
        });
      } catch (err) {
        console.error("Erreur POST /products:", err);
        res.status(500).json({ error: "Erreur serveur" });
      }
    } else {
      res.status(400).send(result);
    }
  });

  app.get("/products", async (req, res) => {
    try {
      const result = await db.collection("products").aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "categoryIds",
            foreignField: "_id",
            as: "categories",
          },
        },
      ]).toArray();
  
      // Convertir _id en string
      const safeResult = result.map(p => ({
        ...p,
        _id: p._id.toString(),
        categoryIds: p.categoryIds ? p.categoryIds.map(id => id.toString()) : [],
        categories: p.categories.map(c => ({ ...c, _id: c._id.toString() })),
      }));
  
      res.json(safeResult);
    } catch (err) {
      console.error("Erreur GET /products aggrégation:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  	
app.post("/categories", async (req, res) => {
    const result = await CreateCategorySchema.safeParse(req.body);
   
    // If Zod parsed successfully the request body
    if (result.success) {
      const { name } = result.data;
   
      const ack = await db.collection("categories").insertOne({ name });
   
      res.send({ _id: ack.insertedId, name });
    } else {
      res.status(400).send(result);
    }
  });	
app.post("/categories", async (req, res) => {
  const result = await CreateCategorySchema.safeParse(req.body);
 
  // If Zod parsed successfully the request body
  if (result.success) {
    const { name } = result.data;
 
    const ack = await db.collection("categories").insertOne({ name });
 
    res.send({ _id: ack.insertedId, name });
  } else {
    res.status(400).send(result);
  }
});
  
  
