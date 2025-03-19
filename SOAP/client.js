const soap = require("soap");

soap.createClient("http://localhost:8000/products?wsdl", {}, function (err, client) {
  if (err) {
    console.error("Error creating SOAP client:", err);
    return;
  }
  // Make a SOAP request
  client.CreateProduct({ name: "My product",price:2,about:"test" }, function (err, result) {
    if (err) {
      console.error(
        "Error making SOAP request:",
        err.response.status,
        err.response.statusText,
        err.body
      );
      return;
    }
    console.log("Result:", result);
  });
  client.GetProducts({}, function (err, result) {
    if (err) {
      console.error(
        "Error making SOAP request for GetProducts:",
        err.response.status,
        err.response.statusText,
        err.body
      );
      return;
    }

    // Affiche la liste des produits récupérés
    console.log("All products:", result);
  });

});
