const express = require("express");
const postgres = require("postgres");
const z = require("zod");
const crypto = require("crypto");

const app = express();
const port = 8000;

const sql = postgres({ db: "Marketplace", user: "postgres", password: "msprepsi" });
app.use(express.json());


function hashPassword(password) {
  return crypto.createHash("sha512").update(password).digest("hex");
}


const UserSchema = z.object({
  id: z.string().optional(),
  username: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
});

const UserPatchSchema = z.object({
  id: z.string(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
});

app.post("/users", async (req, res) => {
  const validation = UserSchema.omit({ id: true }).safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors });
  }

  const { username, email, password } = validation.data;
  const hashedPassword = hashPassword(password);

  try {
    const result = await sql`
      INSERT INTO users (username, email, password)
      VALUES (${username}, ${email}, ${hashedPassword})
      RETURNING id, username, email
    `;
    res.status(201).json(result[0]); // password exclu
  } catch (error) {
    console.error("Erreur POST /users:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await sql`
      SELECT id, username, email FROM users WHERE id = ${id}
    `;
    if (result.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    res.json(result[0]);
  } catch (error) {
    console.error("Erreur GET /users/:id:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/users", async (req, res) => {
    try {
      const result = await sql`
        SELECT id, username, email FROM users
      `;
      res.json(result);
    } catch (error) {
      console.error("Erreur GET /users:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });


app.put("/users/:id", async (req, res) => {
  const validation = UserSchema.omit({ id: true }).safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors });
  }

  const { username, email, password } = validation.data;
  const hashedPassword = hashPassword(password);
  const { id } = req.params;

  try {
    const result = await sql`
      UPDATE users SET username = ${username}, email = ${email}, password = ${hashedPassword}
      WHERE id = ${id} RETURNING id, username, email
    `;
    if (result.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    res.json(result[0]);
  } catch (error) {
    console.error("Erreur PUT /users/:id:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.patch("/users/:id", async (req, res) => {
  const validation = UserPatchSchema.safeParse({ ...req.body, id: req.params.id });
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors });
  }

  const { username, email, password } = validation.data;
  let fields = [];
  let values = [];
  let index = 1;

  if (username) {
    fields.push(`username = $${index++}`);
    values.push(username);
  }
  if (email) {
    fields.push(`email = $${index++}`);
    values.push(email);
  }
  if (password) {
    fields.push(`password = $${index++}`);
    values.push(hashPassword(password));
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "Aucun champ à mettre à jour" });
  }

  const query = `UPDATE users SET ${fields.join(", ")} WHERE id = $${index} RETURNING id, username, email`;
  values.push(req.params.id);

  try {
    const result = await sql.unsafe(query, values);
    if (result.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    res.json(result[0]);
  } catch (error) {
    console.error("Erreur PATCH /users/:id:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /users/:id
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await sql`
      DELETE FROM users WHERE id = ${id} RETURNING id, username, email
    `;
    if (result.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    res.json({ message: "Utilisateur supprimé", user: result[0] });
  } catch (error) {
    console.error("Erreur DELETE /users/:id:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
