import dotenv from "dotenv";
import path from "path";

// Loaded via jest.config.js "setupFiles" — runs before any test file (and
// therefore before ../src/config/prisma.ts constructs its PrismaClient),
// so DATABASE_URL points at the test database, never the dev one.
dotenv.config({ path: path.resolve(__dirname, "..", ".env.test") });