import db from "../db/db.js"
import logger from "../configs/logger.config.js";
import { users } from "../db/models/users.js";
import { hashPassword } from "../utils/password.util.js";

// CLEAR TABLES
const clearTables = async () => {
  try {
    logger.info("Clearing tables...");
    await db.delete(users);
    logger.info("Tables cleared :)");
  } catch (error: any) {
    logger.error("Could not delete all tables", {
      message: error.message,
    });
  }
};

// INSTALL EXTENSIONS
const installExtensions = async () => {
  try {
    logger.info("Installing Extensions");
    await db.execute(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    logger.info("Extensions Installed :)");
  } catch (error: any) {
    logger.error("Could not install extensions", {
      message: error.message,
    });
  }
};

// CLEAR TABLES
const seedUser = async () => {
  try {
    const newPassword = await hashPassword("1234")
    await db.insert(users).values({
        email: "user@example.com",
        password: newPassword
    })
    logger.info("User seeded :)");
  } catch (error: any) {
    logger.error("Could not seed user table", {
      message: error.message,
    });
  }
};


await clearTables();
await installExtensions();
await seedUser()