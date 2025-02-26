const soap = require("soap");
const fs = require("node:fs");
const http = require("http");
const { Pool } = require("pg");

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  user: "postgres",         
  host: "localhost",         
  database: "Marketplace", 
  password: "msprepsi",      
  port: 5432,                
});

// Définition du service SOAP
const service = {
  ProductsService: {
    ProductsPort: {
      // Opération CreateProduct
      CreateProduct: async function ({ name, price, about }, callback) {
        if (!name || !about || !price) {
          throw {
            Fault: {
              Code: {
                Value: "soap:Sender",
                Subcode: { value: "rpc:BadArguments" },
              },
              Reason: { Text: "Processing Error" },
              statusCode: 400,
            },
          };
        }

        try {
          // Insérer dans la base de données
          const result = await pool.query(
            "INSERT INTO products (name, price, about) VALUES ($1, $2, $3) RETURNING *",
            [name, price, about]
          );
          // Retourner l'ID généré
          callback(result.rows[0]);
        } catch (error) {
          console.error("Erreur PostgreSQL :", error);
          callback({ error: "Erreur lors de l'ajout du produit" });
        }
      },

      // Opération GetProducts
      GetProducts: async function (_, callback) {
        try {
          // Récupérer tous les produits depuis la base de données
          const result = await pool.query("SELECT * FROM products");

          // Mapper les résultats pour correspondre à la structure attendue par le client SOAP
          const products = result.rows.map(product => ({
            id: product.id,
            name: product.name,
            about: product.about,
            price: product.price, 
          }));

          // Retourner les produits au client SOAP
          callback(products);

        } catch (error) {
          console.error("Erreur lors de la récupération des produits :", error);
          throw {
            Fault: {
              Code: { Value: "soap:Server" },
              Reason: { Text: "Internal Server Error" },
              statusCode: 501,
            },
          };
        }
      },
    },
  },
};

// Démarrer le serveur HTTP ici
const server = http.createServer(function (request, response) {
  response.end("404: Not Found: " + request.url);
});

server.listen(8000, () => {
  console.log("HTTP server listening on port 8000");
});

// Charger le fichier WSDL
const xml = fs.readFileSync("productsService.wsdl", "utf8");

// Créer et démarrer le serveur SOAP
soap.listen(server, "/products", service, xml, function () {
  console.log("SOAP server running at http://localhost:8000/products?wsdl");
});
