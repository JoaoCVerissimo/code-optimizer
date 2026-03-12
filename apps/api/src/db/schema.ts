import {
  pgTable,
  uuid,
  varchar,
  text,
  smallint,
  doublePrecision,
  bigint,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    language: varchar("language", { length: 20 }).notNull(),
    originalCode: text("original_code").notNull(),
    optimizationGoal: varchar("optimization_goal", { length: 20 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_submissions_status").on(table.status)],
);

export const variants = pgTable(
  "variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    variantIndex: smallint("variant_index").notNull(),
    label: varchar("label", { length: 100 }).notNull(),
    code: text("code").notNull(),
    explanation: text("explanation"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_variant_submission_index").on(
      table.submissionId,
      table.variantIndex,
    ),
    index("idx_variants_submission").on(table.submissionId),
  ],
);

export const benchmarkResults = pgTable(
  "benchmark_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => variants.id, { onDelete: "cascade" }),
    runNumber: smallint("run_number").notNull().default(1),
    executionTimeMs: doublePrecision("execution_time_ms"),
    cpuTimeMs: doublePrecision("cpu_time_ms"),
    peakMemoryBytes: bigint("peak_memory_bytes", { mode: "number" }),
    exitCode: integer("exit_code"),
    stdout: text("stdout"),
    stderr: text("stderr"),
    timedOut: boolean("timed_out").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_benchmark_variant_run").on(
      table.variantId,
      table.runNumber,
    ),
    index("idx_benchmark_variant").on(table.variantId),
  ],
);

export const securityResults = pgTable("security_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => variants.id, { onDelete: "cascade" }),
  vulnerabilityCount: integer("vulnerability_count").notNull().default(0),
  findings: jsonb("findings").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const reliabilityResults = pgTable("reliability_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => variants.id, { onDelete: "cascade" }),
  totalTests: integer("total_tests").notNull(),
  passedTests: integer("passed_tests").notNull(),
  failureDetails: jsonb("failure_details").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const variantScores = pgTable("variant_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  variantId: uuid("variant_id")
    .notNull()
    .unique()
    .references(() => variants.id, { onDelete: "cascade" }),
  performanceScore: doublePrecision("performance_score"),
  memoryScore: doublePrecision("memory_score"),
  securityScore: doublePrecision("security_score"),
  reliabilityScore: doublePrecision("reliability_score"),
  readabilityScore: doublePrecision("readability_score"),
  overallScore: doublePrecision("overall_score"),
  rank: smallint("rank"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
