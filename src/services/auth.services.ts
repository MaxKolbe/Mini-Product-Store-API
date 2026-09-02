import { hashPassword } from "../utils/password.util.js";
import { ConflictError } from "../lib/error.js";
import { users } from "../db/models/users.js"
import { eq } from "drizzle-orm";
import db from "../db/db.js";

export const register = async (options: {
    email: string;
    password: string;
  },
  correlationId: string,) => {
 const { email, password } = options;

  const [ogUser] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (ogUser) {
    throw new ConflictError("Email already exists");
  }

  const passwordHash = await hashPassword(password);
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      password: passwordHash,
    })
    .returning();

  if (!newUser) {
    throw new Error("User could not be created");
  }

  // add event to send user email on registration

  return {
    code: 200,
    message: "user created successfully",
    data: newUser,
    meta: {
        correlationId
    }
  };
}