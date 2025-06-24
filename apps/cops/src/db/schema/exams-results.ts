import {
  sqliteTable,
  int,
  text,
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";

export const exams = sqliteTable("exams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  date: text("date").notNull(),
});

export const candidates = sqliteTable("candidates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
});

export const examResults = sqliteTable(
  "exam_results",
  {
    examId: text("exam_id")
      .notNull()
      .references(() => exams.id),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => candidates.id),
    grade: real("grade").notNull(),
    isApproved: int("is_approved", { mode: "boolean" })
      .notNull()
      .default(false),
    approvalRank: int("approval_rank"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.examId, table.candidateId] }),
  })
);
