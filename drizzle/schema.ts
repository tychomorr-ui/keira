import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Legacy identity slot retained for existing records; sovereign auth uses email/password. */
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  /** Scrypt-derived password hash. Never store plaintext passwords. */
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Knowledge Graph Tables

/**
 * Facts table: stores triples (subject, predicate, object)
 */
export const facts = mysqlTable("facts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  predicate: varchar("predicate", { length: 255 }).notNull(),
  object: varchar("object", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Fact = typeof facts.$inferSelect;
export type InsertFact = typeof facts.$inferInsert;

/**
 * Ontology Classes table: stores class definitions
 */
export const ontologyClasses = mysqlTable("ontologyClasses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  className: varchar("className", { length: 255 }).notNull(),
  parentClassName: varchar("parentClassName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OntologyClass = typeof ontologyClasses.$inferSelect;
export type InsertOntologyClass = typeof ontologyClasses.$inferInsert;

/**
 * Ontology Properties table: stores property definitions
 */
export const ontologyProperties = mysqlTable("ontologyProperties", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  propertyName: varchar("propertyName", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  range: varchar("range", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OntologyProperty = typeof ontologyProperties.$inferSelect;
export type InsertOntologyProperty = typeof ontologyProperties.$inferInsert;

/**
 * Semantic Index table: associates instances with classes
 */
export const semanticIndex = mysqlTable("semanticIndex", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  instanceName: varchar("instanceName", { length: 255 }).notNull(),
  className: varchar("className", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SemanticIndexEntry = typeof semanticIndex.$inferSelect;
export type InsertSemanticIndexEntry = typeof semanticIndex.$inferInsert;

/**
 * Mirror Reflections table: stores Mirror analysis results
 */
export const mirrorReflections = mysqlTable("mirrorReflections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  userInput: text("userInput").notNull(),
  reflection: text("reflection").notNull(),
  patterns: text("patterns"), // JSON array of detected patterns
  unityScore: int("unityScore").notNull(), // 0-100
  opportunityScore: int("opportunityScore").notNull(), // 0-100
  resistanceLevel: int("resistanceLevel").notNull(), // 0-100
  nextStep: text("nextStep").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MirrorReflection = typeof mirrorReflections.$inferSelect;
export type InsertMirrorReflection = typeof mirrorReflections.$inferInsert;


// Stripe Subscription Tables

/**
 * User subscriptions table: tracks active subscriptions
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).notNull().unique(),
  tier: mysqlEnum("tier", ["mirror", "portal"]).notNull(),
  status: mysqlEnum("status", ["active", "paused", "canceled", "past_due"]).notNull(),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  canceledAt: timestamp("canceledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Portal context table: stores Portal's recursive learning state and memory
 */
export const portalContexts = mysqlTable("portalContexts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  contextData: text("contextData").notNull(),
  reflectionCount: int("reflectionCount").default(0).notNull(),
  lastReflectionAt: timestamp("lastReflectionAt"),
  sovereignRuntime: text("sovereignRuntime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortalContext = typeof portalContexts.$inferSelect;
export type InsertPortalContext = typeof portalContexts.$inferInsert;

/**
 * Billing history table: tracks all charges and subscription events
 */
export const billingHistory = mysqlTable("billingHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  tier: mysqlEnum("tier", ["mirror", "portal"]).notNull(),
  eventType: mysqlEnum("eventType", ["charge", "subscription_created", "subscription_updated", "subscription_canceled", "refund"]).notNull(),
  status: mysqlEnum("status", ["succeeded", "failed", "pending"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BillingHistory = typeof billingHistory.$inferSelect;
export type InsertBillingHistory = typeof billingHistory.$inferInsert;


/**
 * Portal Conversations table: stores chat conversations for Portal subscribers
 */
export const portalConversations = mysqlTable("portalConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary"),
  messageCount: int("messageCount").default(0).notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortalConversation = typeof portalConversations.$inferSelect;
export type InsertPortalConversation = typeof portalConversations.$inferInsert;

/**
 * Portal Chat Messages table: stores individual messages in conversations
 */
export const portalChatMessages = mysqlTable("portalChatMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "portal"]).notNull(),
  content: text("content").notNull(),
  patterns: text("patterns"),
  emotionalTone: varchar("emotionalTone", { length: 50 }),
  growthIndicator: int("growthIndicator"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortalChatMessage = typeof portalChatMessages.$inferSelect;
export type InsertPortalChatMessage = typeof portalChatMessages.$inferInsert;

/**
 * Portal Learning Memory table: stores Portal's recursive learning state per user
 */
export const portalLearningMemory = mysqlTable("portalLearningMemory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  corePatterns: text("corePatterns").notNull(),
  growthAreas: text("growthAreas").notNull(),
  resistancePoints: text("resistancePoints").notNull(),
  breakthroughMoments: text("breakthroughMoments"),
  evolutionTimeline: text("evolutionTimeline"),
  lastAnalyzedAt: timestamp("lastAnalyzedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortalLearningMemory = typeof portalLearningMemory.$inferSelect;
export type InsertPortalLearningMemory = typeof portalLearningMemory.$inferInsert;
