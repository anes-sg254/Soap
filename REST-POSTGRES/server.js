const express = require("express");
const postgres = require("postgres");
const z = require("zod");

const app = express();
const port = 8000;

// Connexion PostgreSQL
const sql = postgres({ db: "Marketplace", user: "postgres", password: "msprepsi" });

// Middleware JSON parser
app.use(express.json());

// Schéma Zod pour valider les produits
const ProductSchema = z.object({
  id: z.string().optional(), // généré par BDD
  name: z.string(),
  about: z.string(),
  price: z.number().positive(),
});

	
const CreateProductSchema = ProductSchema.omit({ id: true });

app.get("/", (req, res) => {
  res.send("Hello World!");
});


app.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await sql`SELECT * FROM products WHERE id = ${id}`;
    if (result.length === 0) {
      return res.status(404).json({ error: "Produit non trouvé" });
    }
    res.json(result[0]);
  } catch (error) {
    console.error("Erreur GET /products/:id:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

	
app.get("/products", async (req, res) => {
    const products = await sql`
      SELECT * FROM products
      `;
   
    res.send(products);
  });
   
  app.get("/products/:id", async (req, res) => {
    const product = await sql`
      SELECT * FROM products WHERE id=${req.params.id}
      `;
   
    if (product.length > 0) {
      res.send(product[0]);
    } else {
      res.status(404).send({ message: "Not found" });
    }
  });

	
app.post("/products", async (req, res) => {
    const result = await CreateProductSchema.safeParse(req.body);
   
    // If Zod parsed successfully the request body
    if (result.success) {
      const { name, about, price } = result.data;
   
      const product = await sql`
      INSERT INTO products (name, about, price)
      VALUES (${name}, ${about}, ${price})
      RETURNING *
      `;
   
      res.send(product[0]);
    } else {
      res.status(400).send(result);
    }
  });
  

	
  app.delete("/products/:id", async (req, res) => {
    const product = await sql`
      DELETE FROM products
      WHERE id=${req.params.id}
      RETURNING *
      `;
   
    if (product.length > 0) {
      res.send(product[0]);
    } else {
      res.status(404).send({ message: "Not found" });
    }
  });



app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
