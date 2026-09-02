// //INTEGRATION TESTS
// import request from "supertest";
// import app from "../app.js";
// import { describe, it, expect, beforeAll, afterEach } from "vitest";
// import { clearTables, installExtensions } from "../scripts/seed.js";
// import db from "../db/db.js";
// import { users } from "../db/models/users.js";
// import { hashPassword } from "../utils/password.util.js";

// beforeAll(async () => {
//   await installExtensions();
// });

// afterEach(async () => {
//   await clearTables();
// });

// // ─── REGISTER ────────────────────────────────────────────────────────────────

// describe("POST /api/auth/register", () => {
//   // ── Success ──────────────────────────────────────────────────────────────

//   it("registers a new user and returns 200 with user data", async () => {
//     const res = await request(app)
//       .post("/api/auth/register")
//       .send({ email: "newuser@example.com", password: "Secure1234" });

//     expect(res.status).toBe(200);
//     expect(res.body.success).toBe(true);
//     expect(res.body.message).toBe("user created successfully");

//     // data shape
//     expect(res.body.data).toHaveProperty("id");
//     expect(res.body.data).toHaveProperty("email", "newuser@example.com");
//     expect(res.body.data).toHaveProperty("createdAt");
//     expect(typeof res.body.data.id).toBe("string");
//     expect(typeof res.body.data.createdAt).toBe("string");

//     // sensitive fields must not leak
//     expect(res.body.data).not.toHaveProperty("password");
//     expect(res.body.data).not.toHaveProperty("updatedAt");
//     expect(res.body.data).not.toHaveProperty("deletedAt");

//     // meta
//     expect(res.body.meta).toHaveProperty("correlationId");
//     expect(typeof res.body.meta.correlationId).toBe("string");
//   });

//   it("lowercases and trims the email before storing", async () => {
//     const res = await request(app)
//       .post("/api/auth/register")
//       .send({ email: "User@Example.COM", password: "Secure1234" });

//     expect(res.status).toBe(200);
//     expect(res.body.data.email).toBe("user@example.com");
//   });

//   it("returns correlation id from request header when provided", async () => {
//     const correlationId = "test-correlation-id-123";
//     const res = await request(app)
//       .post("/api/auth/register")
//       .set("x-correlation-id", correlationId)
//       .send({ email: "user@example.com", password: "Secure1234" });

//     expect(res.status).toBe(200);
//     expect(res.body.meta.correlationId).toBe(correlationId);
//     expect(res.headers["x-correlation-id"]).toBe(correlationId);
//   });

//   // ── Conflict ─────────────────────────────────────────────────────────────

//   it("returns 409 when email already exists", async () => {
//     // seed a user first
//     await request(app)
//       .post("/api/auth/register")
//       .send({ email: "duplicate@example.com", password: "Secure1234" });

//     // attempt duplicate
//     const res = await request(app)
//       .post("/api/auth/register")
//       .send({ email: "duplicate@example.com", password: "Secure1234" });

//     expect(res.status).toBe(409);
//     expect(res.body.status).toBe(false);
//     expect(res.body.error.code).toBe("CONFLICT");
//     expect(res.body.error.message).toBe("Email already exists");
//   });

//   it("treats emails case-insensitively for duplicate detection", async () => {
//     await request(app)
//       .post("/api/auth/register")
//       .send({ email: "user@example.com", password: "Secure1234" });

//     const res = await request(app)
//       .post("/api/auth/register")
//       .send({ email: "USER@EXAMPLE.COM", password: "Secure1234" });

//     expect(res.status).toBe(409);
//     expect(res.body.error.code).toBe("CONFLICT");
//   });

//   // ── Validation: missing fields ───────────────────────────────────────────

//   it("returns 400 when body is empty", async () => {
//     const res = await request(app)
//       .post("/api/auth/register")
//       .send({});

//     expect(res.status).toBe(400);
//     expect(res.body.status).toBe(false);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");
//     expect(res.body.error.message).toBe("Request validation failed");
//     expect(Array.isArray(res.body.error.details)).toBe(true);
//   });

//   it("returns 400 when email is missing", async () => {
//     const res = await request(app)
//       .post("/api/auth/register")
//       .send({ password: "Secure1234" });

//     expect(res.status).toBe(400);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");

//     const fields = res.body.error.details.map((d: any) => d.field);
//     expect(fields).toContain("email");
//   });

//   it("returns 400 when password is missing", async () => {
//     const res = await request(app)
//       .post("/api/auth/register")
//       .send({ email: "user@example.com" });

//     expect(res.status).toBe(400);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");

//     const fields = res.body.error.details.map((d: any) => d.field);
//     expect(fields).toContain("password");
//   });

//   // ── Validation: email format ─────────────────────────────────────────────

//   it("returns 400 for an invalid email format", async () => {
//     const res = await request(app)
//       .post("/api/auth/register")
//       .send({ email: "not-an-email", password: "Secure1234" });

//     expect(res.status).toBe(400);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");

//     const fields = res.body.error.details.map((d: any) => d.field);
//     expect(fields).toContain("email");
//   });

//   // ── Validation: password constraints ─────────────────────────────────────

//   it("returns 400 when password is shorter than 8 characters", async () => {
//     const res = await request(app)
//       .post("/api/auth/register")
//       .send({ email: "user@example.com", password: "Ab1" });

//     expect(res.status).toBe(400);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");

//     const messages = res.body.error.details.map((d: any) => d.message);
//     expect(messages).toContain("Password must be at least 8 characters");
//   });

//   it("returns 400 when password exceeds 128 characters", async () => {
//     const longPassword = "A1" + "a".repeat(128);
//     const res = await request(app)
//       .post("/api/auth/register")
//       .send({ email: "user@example.com", password: longPassword });

//     expect(res.status).toBe(400);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");

//     const messages = res.body.error.details.map((d: any) => d.message);
//     expect(messages).toContain("Password cannot exceed 128 characters");
//   });

//   it("returns 400 when password has no uppercase letter", async () => {
//     const res = await request(app)
//       .post("/api/auth/register")
//       .send({ email: "user@example.com", password: "alllower1" });

//     expect(res.status).toBe(400);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");

//     const messages = res.body.error.details.map((d: any) => d.message);
//     expect(messages).toContain("Must contain an uppercase letter");
//   });

//   it("returns 400 when password has no number", async () => {
//     const res = await request(app)
//       .post("/api/auth/register")
//       .send({ email: "user@example.com", password: "NoNumberHere" });

//     expect(res.status).toBe(400);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");

//     const messages = res.body.error.details.map((d: any) => d.message);
//     expect(messages).toContain("Must contain a number");
//   });

//   // ── Wrong HTTP method ────────────────────────────────────────────────────

//   it("returns 404 for GET /api/auth/register", async () => {
//     const res = await request(app).get("/api/auth/register");

//     expect(res.status).toBe(404);
//     expect(res.body.success).toBe(false);
//     expect(res.body.error.code).toBe("NOT_FOUND");
//   });
// });

// // ─── LOGIN ───────────────────────────────────────────────────────────────────

// describe("POST /api/auth/login", () => {
//   const testEmail = "login@example.com";
//   const testPassword = "Secure1234";

//   /** Seed a user directly in the database for login tests. */
//   const seedTestUser = async () => {
//     const hashed = await hashPassword(testPassword);
//     const [user] = await db
//       .insert(users)
//       .values({ email: testEmail, password: hashed })
//       .returning();
//     return user;
//   };

//   // ── Success ──────────────────────────────────────────────────────────────

//   it("logs in with valid credentials and returns 201 with token", async () => {
//     const seeded = await seedTestUser();

//     const res = await request(app)
//       .post("/api/auth/login")
//       .send({ email: testEmail, password: testPassword });

//     expect(res.status).toBe(201);
//     expect(res.body.success).toBe(true);
//     expect(res.body.message).toBe("user logged in successfully");

//     // data shape — only id and email, no sensitive fields
//     expect(res.body.data).toHaveProperty("id", seeded?.id);
//     expect(res.body.data).toHaveProperty("email", testEmail);
//     expect(Object.keys(res.body.data)).toHaveLength(2);

//     // meta shape
//     expect(res.body.meta).toHaveProperty("token");
//     expect(typeof res.body.meta.token).toBe("string");
//     expect(res.body.meta.token.split(".")).toHaveLength(3); // JWT has 3 segments
//     expect(res.body.meta).toHaveProperty("correlationId");
//   });

//   it("returns correlation id from request header when provided", async () => {
//     await seedTestUser();
//     const correlationId = "login-corr-456";

//     const res = await request(app)
//       .post("/api/auth/login")
//       .set("x-correlation-id", correlationId)
//       .send({ email: testEmail, password: testPassword });

//     expect(res.status).toBe(201);
//     expect(res.body.meta.correlationId).toBe(correlationId);
//     expect(res.headers["x-correlation-id"]).toBe(correlationId);
//   });

//   // ── Invalid credentials ──────────────────────────────────────────────────

//   it("returns 400 when email does not exist", async () => {
//     const res = await request(app)
//       .post("/api/auth/login")
//       .send({ email: "nonexistent@example.com", password: "Secure1234" });

//     expect(res.status).toBe(400);
//     expect(res.body.status).toBe(false);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");
//     expect(res.body.error.message).toBe("Invalid credentials");
//   });

//   it("returns 400 when password is incorrect", async () => {
//     await seedTestUser();

//     const res = await request(app)
//       .post("/api/auth/login")
//       .send({ email: testEmail, password: "WrongPass1" });

//     expect(res.status).toBe(400);
//     expect(res.body.status).toBe(false);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");
//     expect(res.body.error.message).toBe("Invalid credentials");
//   });

//   it("uses the same error shape for wrong email and wrong password", async () => {
//     await seedTestUser();

//     const wrongEmail = await request(app)
//       .post("/api/auth/login")
//       .send({ email: "ghost@example.com", password: "Secure1234" });

//     const wrongPass = await request(app)
//       .post("/api/auth/login")
//       .send({ email: testEmail, password: "WrongPass1" });

//     // responses must be indistinguishable to prevent user enumeration
//     expect(wrongEmail.status).toBe(wrongPass.status);
//     expect(wrongEmail.body.error.code).toBe(wrongPass.body.error.code);
//     expect(wrongEmail.body.error.message).toBe(wrongPass.body.error.message);
//   });

//   // ── Validation: missing fields ───────────────────────────────────────────

//   it("returns 400 when body is empty", async () => {
//     const res = await request(app)
//       .post("/api/auth/login")
//       .send({});

//     expect(res.status).toBe(400);
//     expect(res.body.status).toBe(false);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");
//     expect(res.body.error.message).toBe("Request validation failed");
//     expect(Array.isArray(res.body.error.details)).toBe(true);
//   });

//   it("returns 400 when email is missing", async () => {
//     const res = await request(app)
//       .post("/api/auth/login")
//       .send({ password: "Secure1234" });

//     expect(res.status).toBe(400);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");

//     const fields = res.body.error.details.map((d: any) => d.field);
//     expect(fields).toContain("email");
//   });

//   it("returns 400 when password is missing", async () => {
//     const res = await request(app)
//       .post("/api/auth/login")
//       .send({ email: "user@example.com" });

//     expect(res.status).toBe(400);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");

//     const fields = res.body.error.details.map((d: any) => d.field);
//     expect(fields).toContain("password");
//   });

//   // ── Validation: email format ─────────────────────────────────────────────

//   it("returns 400 for an invalid email format", async () => {
//     const res = await request(app)
//       .post("/api/auth/login")
//       .send({ email: "not-an-email", password: "Secure1234" });

//     expect(res.status).toBe(400);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");

//     const fields = res.body.error.details.map((d: any) => d.field);
//     expect(fields).toContain("email");
//   });

//   // ── Validation: password constraints ─────────────────────────────────────

//   it("returns 400 when password is shorter than 8 characters", async () => {
//     const res = await request(app)
//       .post("/api/auth/login")
//       .send({ email: "user@example.com", password: "Ab1" });

//     expect(res.status).toBe(400);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");

//     const messages = res.body.error.details.map((d: any) => d.message);
//     expect(messages).toContain("Password must be at least 8 characters");
//   });

//   it("returns 400 when password has no uppercase letter", async () => {
//     const res = await request(app)
//       .post("/api/auth/login")
//       .send({ email: "user@example.com", password: "alllower1" });

//     expect(res.status).toBe(400);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");

//     const messages = res.body.error.details.map((d: any) => d.message);
//     expect(messages).toContain("Must contain an uppercase letter");
//   });

//   it("returns 400 when password has no number", async () => {
//     const res = await request(app)
//       .post("/api/auth/login")
//       .send({ email: "user@example.com", password: "NoNumberHere" });

//     expect(res.status).toBe(400);
//     expect(res.body.error.code).toBe("VALIDATION_ERROR");

//     const messages = res.body.error.details.map((d: any) => d.message);
//     expect(messages).toContain("Must contain a number");
//   });

//   // ── Wrong HTTP method ────────────────────────────────────────────────────

//   it("returns 404 for GET /api/auth/login", async () => {
//     const res = await request(app).get("/api/auth/login");

//     expect(res.status).toBe(404);
//     expect(res.body.success).toBe(false);
//     expect(res.body.error.code).toBe("NOT_FOUND");
//   });
// });