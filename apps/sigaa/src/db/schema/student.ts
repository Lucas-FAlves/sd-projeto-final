import { sqliteTable, int, text } from "drizzle-orm/sqlite-core";

export const students = sqliteTable("students", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  age: int("age").notNull(),
  email: text("email").notNull().unique(),
});
