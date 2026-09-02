import { hashPassword, verifyPassword } from "../utils/password.util.js";
import { ConflictError, ValidationError } from "../lib/error.js";
import { users } from "../db/models/users.js";
import { eq } from "drizzle-orm";
import db from "../db/db.js";
import { generateToken } from "../utils/token.util.js";

export const register = async (
  options: {
    email: string;
    password: string;
  },
  correlationId: string,
) => {
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
      correlationId,
    },
  };
};

export const login = async (
  options: {
    email: string;
    password: string;
  },
  correlationId: string,
) => {
  const { email, password } = options;
  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    // emitter to log failed login attempt

    throw new ValidationError("Invalid credentials");
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    // emitter to log failed login attempt
    throw new ValidationError("Invalid credentials");
  }

  // emitter to log login attempt

  const token = generateToken({
    id: user.id,
  });

  return {
    code: 201,
    message: "user logged in successfully",
    data: {
      id: user.id,
      email: user.email,
    },
    meta: {
      token,
      correlationId,
    },
  };
};
