const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");

async function seed() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const users = db.collection("users");

    await users.createIndex({ username: 1 }, { unique: true });
    await users.createIndex({ email: 1 }, { unique: true });

    const password = await bcrypt.hash("Exam2026!", 10);

    for (const role of ["Teacher", "Student"]) {
      for (let i = 1; i <= 3; i++) {
        const username = `${role.toLowerCase()}${i}`;

        await users.updateOne(
          { username },
          {
            $setOnInsert: {
              username,
              email: `${username}@example.com`,
              password,
              role,
            },
          },
          { upsert: true },
        );

        console.log(`${username} ready`);
      }
    }
  } finally {
    await client.close();
  }
}

seed().catch(console.error);