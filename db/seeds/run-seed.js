const seed = require("./seed");
const db = require("../connection");

seed()
  .then(() => {
    console.log("Seeding complete. Closing connection.");
    return db.end();
  })
  .catch((err) => {
    console.error("Seeding failed:", err);
    return db.end();
  });
