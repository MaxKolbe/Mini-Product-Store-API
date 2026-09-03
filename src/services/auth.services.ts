import { hashPassword, verifyPassword } from "../utils/password.util.js";
import { ConflictError, ValidationError } from "../lib/error.js";
import { generateToken } from "../utils/token.util.js";
import { appEvents } from "../lib/events.js";
import { users } from "../db/models/users.js";
import { eq } from "drizzle-orm";
import db from "../db/db.js";
import { AUTH_EVENTS } from "../events/auth.events.js";

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

  // event to send user email on registration
  appEvents.emit(AUTH_EVENTS.AUTH_SIGNUP, {
    email: newUser.email,
    userId: newUser.id,
    correlationId,
  });

  return {
    code: 200,
    message: "user created successfully",
    data: {
      id: newUser.id,
      email: newUser.email,
      createdAt: newUser.createdAt,
    },
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
    appEvents.emit(AUTH_EVENTS.AUTH_LOGIN_FAIL, {
      email,
      reason: "user not found",
      deviceInfo: undefined,
      correlationId,
    });

    throw new ValidationError("Invalid credentials");
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    appEvents.emit(AUTH_EVENTS.AUTH_LOGIN_FAIL, {
      email,
      reason: "invald password",
      deviceInfo: undefined,
      correlationId,
    });

    throw new ValidationError("Invalid credentials");
  }

  appEvents.emit(AUTH_EVENTS.AUTH_LOGIN, {
    email,
    deviceInfo: undefined,
    correlationId,
  });

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
