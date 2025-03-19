const express = require("express");
const postgres = require("postgres");
const z = require("zod");

const app = express();
const port = 8000;


// Connexion PostgreSQL
const sql = postgres({ db: "Marketplace", user: "postgres", password: "msprepsi" });

// Middleware JSON
app.use(express.json());

// Schéma Zod
const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  about: z.string(),
  price: z.number().positive(),
});

const CreateProductSchema = ProductSchema.omit({ id: true });

// ---------------- ROUTES PRODUITS ---------------- //

// GET /
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/products", async (req, res) => {
    const { name, about, price } = req.query;
  
    let conditions = [];
    let values = [];
  
    if (name) {
      conditions.push(`LOWER(name) LIKE LOWER('%' || $${values.length + 1} || '%')`);
      values.push(name);
    }
  
    if (about) {
      conditions.push(`LOWER(about) LIKE LOWER('%' || $${values.length + 1} || '%')`);
      values.push(about);
    }
  
    if (price) {
      const priceNumber = parseFloat(price);
      if (!isNaN(priceNumber)) {
        conditions.push(`price <= $${values.length + 1}`);
        values.push(priceNumber);
      }
    }
  
    // Construction finale de la requête SQL
    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    const query = `SELECT * FROM products ${whereClause}`;
  
    try {
      const products = await sql.unsafe(query, values);
      res.json(products);
    } catch (error) {
      console.error("Erreur recherche /products:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
  

// GET /products/:id - un produit
app.get("/products/:id", async (req, res) => {
  try {
    const result = await sql`SELECT * FROM products WHERE id = ${req.params.id}`;
    if (result.length === 0) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }
    res.json(result[0]);
  } catch (error) {
    console.error("Erreur GET /products/:id:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /products - ajouter un produit
app.post("/products", async (req, res) => {
  const result = CreateProductSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: result.error.errors });
  }

  const { name, about, price } = result.data;

  try {
    const product = await sql`
      INSERT INTO products (name, about, price)
      VALUES (${name}, ${about}, ${price})
      RETURNING *
    `;
    res.status(201).json(product[0]);
  } catch (error) {
    console.error("Erreur POST /products:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /products/:id - supprimer un produit
app.delete("/products/:id", async (req, res) => {
  try {
    const product = await sql`
      DELETE FROM products WHERE id=${req.params.id} RETURNING *
    `;
    if (product.length === 0) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }
    res.json(product[0]);
  } catch (error) {
    console.error("Erreur DELETE /products/:id:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ---------------- ROUTES F2P GAMES ---------------- //

// GET /f2p-games - tous les jeux F2P
app.get("/f2p-games", async (req, res) => {
  try {
    const response = await fetch("https://www.freetogame.com/api/games");
    const games = await response.json();
    res.json(games);
  } catch (error) {
    console.error("Erreur GET /f2p-games:", error);
    res.status(500).json({ error: "Erreur de récupération des jeux F2P" });
  }
});

// GET /f2p-games/:id - détail d’un jeu
app.get("/f2p-games/:id", async (req, res) => {
  try {
    const response = await fetch(`https://www.freetogame.com/api/game?id=${req.params.id}`);
    if (!response.ok) {
      return res.status(404).json({ error: "Jeu non trouvé" });
    }
    const game = await response.json();
    res.json(game);
  } catch (error) {
    console.error("Erreur GET /f2p-games/:id:", error);
    res.status(500).json({ error: "Erreur de récupération du jeu F2P" });
  }
});

// ---------------- DEMARRAGE ---------------- //
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
