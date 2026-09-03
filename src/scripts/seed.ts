import db from "../db/db.js"
import logger from "../configs/logger.config.js";
import { users } from "../db/models/users.js";
import { products } from "../db/models/products.js"; 
import { hashPassword } from "../utils/password.util.js";

// CLEAR TABLES
export const clearTables = async () => {
  try {
    logger.info("Clearing tables...");
    await db.delete(products);
    await db.delete(users);
    logger.info("Tables cleared :)");
  } catch (error: any) {
    logger.error("Could not delete all tables", {
      message: error.message,
    });
  }
};

// INSTALL EXTENSIONS
export const installExtensions = async () => {
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

// SEED USERS TABLE
const seedUser = async () => {
  try {
    const newPassword = await hashPassword("SecurePass1")
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

const seedProducts = async () => {
  try {
    await db.insert(products).values([
      {
        name: "Wireless Mechanical Keyboard",
        description: "Compact RGB wireless mechanical keyboard with tactile switches.",
        price: 8999,
      },
      {
        name: "Ergonomic Gaming Mouse",
        description: "Precision wireless mouse with customizable buttons and ergonomic grip.",
        price: 4999,
      },
      {
        name: "UltraWide Monitor 34\"",
        description: "34-inch curved UltraWide QHD monitor with 144Hz refresh rate.",
        price: 45000,
      },
      {
        name: "Noise-Canceling Headphones",
        description: "Over-ear wireless headphones with active noise cancellation and 30-hour battery life.",
        price: 19999,
      },
    ]);
    logger.info("Products table seeded :)");
  } catch (error: any) {
    logger.error("Could not seed products table", {
      message: error.message,
    });
  }
};

await clearTables();
await installExtensions();
await seedUser();
await seedProducts();