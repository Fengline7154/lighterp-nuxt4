import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || process.env.NUXT_POSTGRES_URL,
  },
  schema: "./prisma/schema.prisma",
});
