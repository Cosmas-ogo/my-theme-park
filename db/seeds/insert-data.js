// const db = require("../connection");
// const format = require("pg-format");

// async function insertData({ parksData, foodsData, ridesData, stallsData }) {
//   const client = await db.connect();
//   try {
//     await client.query("BEGIN");

//     // Insert parks
//     const parksInsert = format(
//       "INSERT INTO parks (park_name, year_opened, annual_attendance) VALUES %L RETURNING park_id, park_name",
//       parksData.map((p) => [p.park_name, p.year_opened, p.annual_attendance])
//     );
//     const { rows: insertedParks } = await client.query(parksInsert);

//     // Insert foods
//     const foodsInsert = format(
//       "INSERT INTO foods (food_name, vegan_option) VALUES %L RETURNING food_id, food_name",
//       foodsData.map((f) => [f.food_name, f.vegan_option])
//     );
//     const { rows: insertedFoods } = await client.query(foodsInsert);

//     const parkNameToId = Object.fromEntries(
//       insertedParks.map((p) => [p.park_name, p.park_id])
//     );
//     const foodNameToId = Object.fromEntries(
//       insertedFoods.map((f) => [f.food_name, f.food_id])
//     );

//     // Insert rides
//     const ridesInsert = format(
//       "INSERT INTO rides (ride_name, year_opened, votes, park_id) VALUES %L",
//       ridesData.map((r) => [
//         r.ride_name,
//         r.year_opened,
//         r.votes,
//         parkNameToId[r.park_name],
//       ])
//     );
//     await client.query(ridesInsert);

//     // Insert stalls
//     const stallsInsert = format(
//       "INSERT INTO stalls (stall_name, park_id) VALUES %L RETURNING stall_id, stall_name",
//       stallsData.map((s) => [s.stall_name, parkNameToId[s.park_name]])
//     );
//     const { rows: insertedStalls } = await client.query(stallsInsert);
//     const stallNameToId = Object.fromEntries(
//       insertedStalls.map((s) => [s.stall_name, s.stall_id])
//     );

//     // Insert stalls_foods
//     const stallsFoodsValues = [];
//     stallsData.forEach((stall) => {
//       const stallId = stallNameToId[stall.stall_name];
//       stall.foods_served.forEach((foodName) => {
//         const foodId = foodNameToId[foodName];
//         stallsFoodsValues.push([stallId, foodId]);
//       });
//     });

//     if (stallsFoodsValues.length > 0) {
//       const stallsFoodsInsert = format(
//         "INSERT INTO stalls_foods (stall_id, food_id) VALUES %L",
//         stallsFoodsValues
//       );
//       await client.query(stallsFoodsInsert);
//     }

//     await client.query("COMMIT");
//     console.log("Insert completed successfully!");
//   } catch (err) {
//     await client.query("ROLLBACK");
//     console.error("Insert failed:", err);
//     throw err;
//   } finally {
//     client.release();
//   }
// }

// module.exports = insertData;

const db = require("../connection");
const format = require("pg-format");

async function insertData({ parks, foods, rides, stalls }) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Insert parks
    const parksInsert = format(
      "INSERT INTO parks (park_name, year_opened, annual_attendance) VALUES %L RETURNING park_id, park_name",
      parks.map((p) => [p.park_name, p.year_opened, p.annual_attendance])
    );
    const { rows: insertedParks } = await client.query(parksInsert);

    // Insert foods
    const foodsInsert = format(
      "INSERT INTO foods (food_name, vegan_option) VALUES %L RETURNING food_id, food_name",
      foods.map((f) => [f.food_name, f.vegan_option])
    );
    const { rows: insertedFoods } = await client.query(foodsInsert);

    const parkNameToId = Object.fromEntries(
      insertedParks.map((p) => [p.park_name, p.park_id])
    );
    const foodNameToId = Object.fromEntries(
      insertedFoods.map((f) => [f.food_name, f.food_id])
    );

    // Insert rides
    const ridesInsert = format(
      "INSERT INTO rides (ride_name, year_opened, votes, park_id) VALUES %L",
      rides.map((r) => [
        r.ride_name,
        r.year_opened,
        r.votes,
        parkNameToId[r.park_name],
      ])
    );
    await client.query(ridesInsert);

    // Insert stalls
    const stallsInsert = format(
      "INSERT INTO stalls (stall_name, park_id) VALUES %L RETURNING stall_id, stall_name",
      stalls.map((s) => [s.stall_name, parkNameToId[s.park_name]])
    );
    const { rows: insertedStalls } = await client.query(stallsInsert);
    const stallNameToId = Object.fromEntries(
      insertedStalls.map((s) => [s.stall_name, s.stall_id])
    );

    // Insert stalls_foods
    const stallsFoodsValues = [];
    stalls.forEach((stall) => {
      const stallId = stallNameToId[stall.stall_name];
      stall.foods_served.forEach((foodName) => {
        const foodId = foodNameToId[foodName];
        stallsFoodsValues.push([stallId, foodId]);
      });
    });

    if (stallsFoodsValues.length > 0) {
      const stallsFoodsInsert = format(
        "INSERT INTO stalls_foods (stall_id, food_id) VALUES %L",
        stallsFoodsValues
      );
      await client.query(stallsFoodsInsert);
    }

    await client.query("COMMIT");
    console.log("Insert completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Insert failed:", err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = insertData;
