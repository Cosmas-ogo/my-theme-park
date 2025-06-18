const db = require("../db/connection");
const seed = require("../db/seeds/seed");
const { dropTables, createTables } = require("../db/seeds/manage-tables");
const testData = require("../db/data/test-data/index");

// Helper: flatten total count of join table rows
const countJoinRows = (stalls) =>
  stalls.reduce((acc, stall) => acc + stall.foods_served.length, 0);

beforeAll(async () => {
  await dropTables();
  await createTables();
  await seed(testData);
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

  describe("stalls table", () => {
    test("stalls table exists", async () => {
      const {
        rows: [{ exists }],
      } = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables WHERE table_name = 'stalls'
        );
      `);
      expect(exists).toBe(true);
    });

    test("stall_id column is serial primary key", async () => {
      const {
        rows: [column],
      } = await db.query(`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'stalls' AND column_name = 'stall_id';
      `);
      expect(column).toMatchObject({
        column_name: "stall_id",
        data_type: "integer",
        column_default: expect.stringContaining("nextval('stalls_stall_id_seq"),
      });
    });

    test("has stall_name and park_id columns", async () => {
      const columns = ["stall_name", "park_id"];
      for (const name of columns) {
        const { rows } = await db.query(
          `
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'stalls' AND column_name = $1;
        `,
          [name]
        );
        expect(rows.length).toBe(1);
        expect(rows[0].column_name).toBe(name);
      }
    });
  });

  describe("foods table", () => {
    test("foods table exists", async () => {
      const {
        rows: [{ exists }],
      } = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables WHERE table_name = 'foods'
        );
      `);
      expect(exists).toBe(true);
    });

    test("food_id column is serial primary key", async () => {
      const {
        rows: [column],
      } = await db.query(`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'foods' AND column_name = 'food_id';
      `);
      expect(column).toMatchObject({
        column_name: "food_id",
        data_type: "integer",
        column_default: expect.stringContaining("nextval('foods_food_id_seq"),
      });
    });

    test("has food_name and vegan_option columns", async () => {
      const columns = ["food_name", "vegan_option"];
      for (const name of columns) {
        const { rows } = await db.query(
          `
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'foods' AND column_name = $1;
        `,
          [name]
        );
        expect(rows.length).toBe(1);
        expect(rows[0].column_name).toBe(name);
      }
    });
  });

  describe("stalls_foods table", () => {
    test("stalls_foods table exists", async () => {
      const {
        rows: [{ exists }],
      } = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables WHERE table_name = 'stalls_foods'
        );
      `);
      expect(exists).toBe(true);
    });

    test("has stall_id and food_id columns", async () => {
      const columns = ["stall_id", "food_id"];
      for (const name of columns) {
        const { rows } = await db.query(
          `
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'stalls_foods' AND column_name = $1;
        `,
          [name]
        );
        expect(rows.length).toBe(1);
        expect(rows[0].column_name).toBe(name);
      }
    });

    test("has a composite primary key (stall_id, food_id)", async () => {
      const { rows } = await db.query(`
        SELECT
          kcu.column_name,
          tc.constraint_type
        FROM
          information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE
          tc.table_name = 'stalls_foods'
          AND tc.constraint_type = 'PRIMARY KEY'
        ORDER BY kcu.ordinal_position;
      `);
      // Should be two columns and in order: stall_id, food_id
      expect(rows.length).toBe(2);
      expect(rows[0].column_name).toBe("stall_id");
      expect(rows[1].column_name).toBe("food_id");
    });
  });
});

// --- SEED LOGIC TESTS ---
describe("SEED LOGIC TESTS", () => {
  beforeEach(async () => {
    await dropTables();
    await createTables();
    await seed(testData);
  });

  test("parks: correct number of rows and correct values", async () => {
    const { rows: parksRows } = await db.query(
      "SELECT * FROM parks ORDER BY park_id"
    );
    expect(parksRows).toHaveLength(testData.parks.length);
    testData.parks.forEach((park, i) => {
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
    expect(foodsRows).toHaveLength(testData.foods.length);
    testData.foods.forEach((food, i) => {
      expect(foodsRows[i]).toMatchObject({
        food_name: food.food_name,
        vegan_option: food.vegan_option,
      });
    });
  });

  test("rides: correct number of rows and valid foreign keys", async () => {
    const { rows: ridesRows } = await db.query("SELECT * FROM rides");
    expect(ridesRows).toHaveLength(testData.rides.length);
    ridesRows.forEach((ride) => {
      expect(typeof ride.park_id).toBe("number");
      expect(typeof ride.ride_name).toBe("string");
      expect(typeof ride.year_opened).toBe("number");
      expect(typeof ride.votes).toBe("number");
    });
  });

  test("stalls: correct number of rows and valid foreign keys", async () => {
    const { rows: stallsRows } = await db.query("SELECT * FROM stalls");
    expect(stallsRows).toHaveLength(testData.stalls.length);
    stallsRows.forEach((stall) => {
      expect(typeof stall.stall_id).toBe("number");
      expect(typeof stall.stall_name).toBe("string");
      expect(typeof stall.park_id).toBe("number");
    });
  });

  test("stalls_foods: correct number of join rows", async () => {
    const { rows: joinRows } = await db.query("SELECT * FROM stalls_foods");
    expect(joinRows.length).toBe(countJoinRows(testData.stalls));
    // Check each relationship exists
    for (const stall of testData.stalls) {
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
    await seed(testData);
    const { rows: parksRows } = await db.query("SELECT * FROM parks");
    expect(parksRows.length).toBe(testData.parks.length);
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
      ...testData,
      rides: [...testData.rides, ...badRides],
    };
    await expect(seed(badData)).rejects.toThrow();
  });
});
