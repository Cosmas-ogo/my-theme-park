const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

const ENV = process.env.NODE_ENV || "development";
const envPath = path.resolve(__dirname, "..", `.env.${ENV}`);
dotenv.config({ path: envPath });

if (!process.env.PGDATABASE) {
  throw new Error("No PGDATABASE configured");
}

const pool = new Pool(); // Uses env vars

module.exports = pool;
