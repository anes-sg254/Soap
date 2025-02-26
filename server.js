const soap = require("soap");
const fs = require("node:fs");
const http = require("http");
const { Pool } = require("pg");

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  user: "postgres",         
  host: "localhost",         
  database: "products", 
  password: "msprepsi",      
  port: 5432,                
});

// Définition du service SOAP
const service = {
  ProductsService: {
    ProductsPort: {
      CreateProduct: async function (args, callback) {
        console.log("ARGS : ", args);

        try {
          // Insérer dans la base de données
          const result = await pool.query(
            "INSERT INTO products (name, price) VALUES ($1, $2) RETURNING id",
            [args.name, args.price]
          );

          // Retourner l'ID généré
          callback({ id: result.rows[0].id, ...args });
        } catch (error) {
          console.error("Erreur PostgreSQL :", error);
          callback({ error: "Erreur lors de l'ajout du produit" });
        }
      },
    },
  },
};

// Démarrer le serveur SOAP ici...
