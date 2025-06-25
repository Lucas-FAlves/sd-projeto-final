import { sqliteTable, int, text } from "drizzle-orm/sqlite-core";

export const students = sqliteTable("students", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  age: int("age").notNull(),
  email: text("email").notNull().unique(),
});
