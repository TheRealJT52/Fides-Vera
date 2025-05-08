import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Chats schema
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatSchema = createInsertSchema(chats).pick({
  title: true,
  userId: true,
});

export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;

// Messages schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => chats.id).notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  sources: jsonb("sources"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  chatId: true,
  role: true,
  content: true,
  sources: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Catholic Document schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source").notNull(),
  category: text("category").notNull(),
  metadata: jsonb("metadata"),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  title: true,
  content: true,
  source: true,
  category: true,
  metadata: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Source References for messages
export const sourceReference = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string().optional(),
  source: z.string(),
  category: z.string().optional(),
  section: z.string().optional(),
  relevanceScore: z.number().optional(),
});

export type SourceReference = z.infer<typeof sourceReference>;

// Message with role schema
export const messageWithRole = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  sources: z.array(sourceReference).optional(),
});

export type MessageWithRole = z.infer<typeof messageWithRole>;
