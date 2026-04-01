import { Client } from "pg";

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("[v0] Connected to Neon database");

    const sql = await import("fs").then((fs) =>
      fs.promises.readFile("./scripts/setup-db.sql", "utf-8")
    );

    await client.query(sql);
    console.log("[v0] Database schema created successfully");
  } catch (error) {
    console.error("[v0] Database setup failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
