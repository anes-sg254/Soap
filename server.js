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
      CreateProduct: async function ({name,price,about}, callback) {
       
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
            "INSERT INTO products (name, price,about) VALUES ($1, $2,$3) RETURNING *",
            [name, price,about]
          );
          // Retourner l'ID généré
          callback(result.rows[0]);
        } catch (error) {
          console.error("Erreur PostgreSQL :", error);
          callback({ error: "Erreur lors de l'ajout du produit" });
        }
      },


      // CreateProduct: function ({ name, about, price }, callback) {
      //   if (!name || !about || !price) {
      //     throw {
      //       Fault: {
      //         Code: {
      //           Value: "soap:Sender",
      //           Subcode: { value: "rpc:BadArguments" },
      //         },
      //         Reason: { Text: "Processing Error" },
      //         statusCode: X,
      //       },
      //     };
      //   }
      //   callback({ ...args, id: "myid" });
      // },
    },
  },
};

// Démarrer le serveur SOAP ici...

	
// http server example
const server = http.createServer(function (request, response) {
  response.end("404: Not Found: " + request.url);
});
 
server.listen(8000);
 
// Create the SOAP server
const xml = fs.readFileSync("productsService.wsdl", "utf8");
soap.listen(server, "/products", service, xml, function () {
  console.log("SOAP server running at http://localhost:8000/products?wsdl");
});
