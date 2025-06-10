const db = require("../connection");

const dropTables = async () => {
  await db.query("DROP TABLE IF EXISTS stalls_foods;");
  await db.query("DROP TABLE IF EXISTS stalls;");
  await db.query("DROP TABLE IF EXISTS rides;");
  await db.query("DROP TABLE IF EXISTS foods;");
  await db.query("DROP TABLE IF EXISTS parks;");
};

const createTables = async () => {
  await db.query(`
    CREATE TABLE parks (
      park_id SERIAL PRIMARY KEY,
      park_name VARCHAR NOT NULL,
      year_opened INT NOT NULL,
      annual_attendance INT NOT NULL
    );
  `);

  await db.query(`
    CREATE TABLE foods (
      food_id SERIAL PRIMARY KEY,
      food_name VARCHAR UNIQUE NOT NULL,
      vegan_option BOOLEAN NOT NULL
    );
  `);

  await db.query(`
    CREATE TABLE rides (
      ride_id SERIAL PRIMARY KEY,
      park_id INT NOT NULL REFERENCES parks(park_id),
      ride_name VARCHAR NOT NULL,
      year_opened INT NOT NULL,
      votes INT DEFAULT 0 NOT NULL
    );
  `);

  await db.query(`
    CREATE TABLE stalls (
      stall_id SERIAL PRIMARY KEY,
      stall_name VARCHAR NOT NULL,
      park_id INT REFERENCES parks(park_id)
    );
  `);

  await db.query(`
    CREATE TABLE stalls_foods (
      stall_id INT REFERENCES stalls(stall_id),
      food_id INT REFERENCES foods(food_id),
      PRIMARY KEY (stall_id, food_id)
    );
  `);
};

module.exports = { dropTables, createTables };
