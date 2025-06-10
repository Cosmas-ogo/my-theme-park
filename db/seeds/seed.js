// const { dropTables, createTables } = require("./manage-tables");
// const insertData = require("./insert-data");

// // Just import the whole data set from the index.js file
// const { parks, foods, rides, stalls } = require("../data/dev-data");

// async function seed() {
//   await dropTables();
//   await createTables();
//   await insertData({
//     parksData: parks,
//     foodsData: foods,
//     ridesData: rides,
//     stallsData: stalls,
//   });
// }

// module.exports = seed;

const { dropTables, createTables } = require("./manage-tables");
const insertData = require("./insert-data");
const devData = require("../data/dev-data/index");

async function seed(data = devData) {
  const { parks, foods, rides, stalls } = data;
  await dropTables();
  await createTables();
  await insertData({ parks, foods, rides, stalls });
}

module.exports = seed;
