const db = require("../db/connection");
const seed = require("../db/seeds/seed");
const { dropTables, createTables } = require("../db/seeds/manage-tables");
const devData = require("../db/data/dev-data/index");

// Helper: flatten total count of join table rows
const countJoinRows = (stalls) =>
  stalls.reduce((acc, stall) => acc + stall.foods_served.length, 0);

beforeAll(async () => {
  await dropTables();
  await createTables();
  await seed(devData);
});

afterAll(() => db.end());

describe("SCHEMA TESTS", () => {
  describe("parks table", () => {
    test("parks table exists", async () => {
      const {
        rows: [{ exists }],
      } = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables WHERE table_name = 'parks'
        );
      `);
      expect(exists).toBe(true);
    });

    test("park_id column is serial primary key", async () => {
      const {
        rows: [column],
      } = await db.query(`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'parks' AND column_name = 'park_id';
      `);
      expect(column).toMatchObject({
        column_name: "park_id",
        data_type: "integer",
        column_default: expect.stringContaining("nextval('parks_park_id_seq"),
      });
    });

    test("has park_name, year_opened, annual_attendance columns", async () => {
      const columns = ["park_name", "year_opened", "annual_attendance"];
      for (const name of columns) {
        const { rows } = await db.query(
          `
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'parks' AND column_name = $1;
        `,
          [name]
        );
        expect(rows.length).toBe(1);
        expect(rows[0].column_name).toBe(name);
      }
    });
  });

  describe("rides table", () => {
    test("rides table exists", async () => {
      const {
        rows: [{ exists }],
      } = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables WHERE table_name = 'rides'
        );
      `);
      expect(exists).toBe(true);
    });

    test("ride_id is serial primary key", async () => {
      const {
        rows: [column],
      } = await db.query(`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'rides' AND column_name = 'ride_id';
      `);
      expect(column).toMatchObject({
        column_name: "ride_id",
        data_type: "integer",
        column_default: expect.stringContaining("nextval('rides_ride_id_seq"),
      });
    });

    test("has park_id, ride_name, year_opened, votes columns", async () => {
      const columns = ["park_id", "ride_name", "year_opened", "votes"];
      for (const name of columns) {
        const { rows } = await db.query(
          `
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'rides' AND column_name = $1;
        `,
          [name]
        );
        expect(rows.length).toBe(1);
        expect(rows[0].column_name).toBe(name);
      }
    });
  });

  // Repeat similar blocks for stalls, foods, stalls_foods...
});

describe("SEED LOGIC TESTS", () => {
  beforeEach(async () => {
    await dropTables();
    await createTables();
    await seed(devData);
  });

  test("parks: correct number of rows and correct values", async () => {
    const { rows: parksRows } = await db.query(
      "SELECT * FROM parks ORDER BY park_id"
    );
    expect(parksRows).toHaveLength(devData.parks.length);
    devData.parks.forEach((park, i) => {
      expect(parksRows[i]).toHaveProperty("park_name", park.park_name);
      expect(parksRows[i]).toHaveProperty("year_opened", park.year_opened);
      expect(parksRows[i]).toHaveProperty(
        "annual_attendance",
        park.annual_attendance
      );
    });
  });

  test("foods: correct number of rows and correct values", async () => {
    const { rows: foodsRows } = await db.query(
      "SELECT * FROM foods ORDER BY food_id"
    );
    expect(foodsRows).toHaveLength(devData.foods.length);
    devData.foods.forEach((food, i) => {
      expect(foodsRows[i]).toMatchObject({
        food_name: food.food_name,
        vegan_option: food.vegan_option,
      });
    });
  });

  test("rides: correct number of rows and valid foreign keys", async () => {
    const { rows: ridesRows } = await db.query("SELECT * FROM rides");
    expect(ridesRows).toHaveLength(devData.rides.length);
    ridesRows.forEach((ride) => {
      expect(typeof ride.park_id).toBe("number");
      expect(typeof ride.ride_name).toBe("string");
      expect(typeof ride.year_opened).toBe("number");
      expect(typeof ride.votes).toBe("number");
    });
  });

  test("stalls: correct number of rows and valid foreign keys", async () => {
    const { rows: stallsRows } = await db.query("SELECT * FROM stalls");
    expect(stallsRows).toHaveLength(devData.stalls.length);
    stallsRows.forEach((stall) => {
      expect(typeof stall.stall_id).toBe("number");
      expect(typeof stall.stall_name).toBe("string");
      expect(typeof stall.park_id).toBe("number");
    });
  });

  test("stalls_foods: correct number of join rows", async () => {
    const { rows: joinRows } = await db.query("SELECT * FROM stalls_foods");
    expect(joinRows.length).toBe(countJoinRows(devData.stalls));
    // Check each relationship exists
    for (const stall of devData.stalls) {
      const stallRes = await db.query(
        "SELECT stall_id FROM stalls WHERE stall_name = $1",
        [stall.stall_name]
      );
      expect(stallRes.rows.length).toBe(1);
      const stallId = stallRes.rows[0].stall_id;
      for (const foodName of stall.foods_served) {
        const foodRes = await db.query(
          "SELECT food_id FROM foods WHERE food_name = $1",
          [foodName]
        );
        expect(foodRes.rows.length).toBe(1);
        const foodId = foodRes.rows[0].food_id;
        const join = await db.query(
          "SELECT * FROM stalls_foods WHERE stall_id = $1 AND food_id = $2",
          [stallId, foodId]
        );
        expect(join.rows.length).toBe(1);
      }
    }
  });

  test("seed is idempotent (can be run twice without duplication)", async () => {
    await seed(devData);
    const { rows: parksRows } = await db.query("SELECT * FROM parks");
    expect(parksRows.length).toBe(devData.parks.length);
  });

  test("seed fails with invalid foreign key (bad data)", async () => {
    // Make a bad copy of rides
    const badRides = [
      {
        ride_name: "Ghost Ride",
        year_opened: 2001,
        votes: 5,
        park_name: "Nonexistent Park",
      },
    ];
    const badData = {
      ...devData,
      rides: [...devData.rides, ...badRides],
    };
    await expect(seed(badData)).rejects.toThrow();
  });
});
