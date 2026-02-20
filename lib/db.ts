import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Use DATABASE_URL from env; build provides a placeholder via .env.local
const sql = neon(process.env.DATABASE_URL || "postgresql://build:build@localhost/build");
export const db = drizzle(sql, { schema });
