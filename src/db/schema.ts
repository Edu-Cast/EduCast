import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 40 }).notNull().unique(),
  fullName: varchar("full_name", { length: 120 }),
  email: varchar("email", { length: 160 }).unique(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const audios = pgTable("audios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  topic: varchar("topic", { length: 120 }).notNull(),
  audioUrl: text("audio_url").notNull(),
  transcript: text("transcript"),
  durationSec: integer("duration_sec").notNull().default(0),
  plays: integer("plays").notNull().default(0),
  completionRate: numeric("completion_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  score: numeric("score", { precision: 6, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
});

export const audioTags = pgTable(
  "audio_tags",
  {
    audioId: integer("audio_id")
      .notNull()
      .references(() => audios.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.audioId, table.tagId] })],
);

export const likes = pgTable(
  "likes",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    audioId: integer("audio_id")
      .notNull()
      .references(() => audios.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.audioId] })],
);

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  audioId: integer("audio_id")
    .notNull()
    .references(() => audios.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  timestampSec: integer("timestamp_sec"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description"),
  examDate: date("exam_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const playlistItems = pgTable(
  "playlist_items",
  {
    playlistId: integer("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    audioId: integer("audio_id")
      .notNull()
      .references(() => audios.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.playlistId, table.audioId] })],
);

export const listeningEvents = pgTable("listening_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  audioId: integer("audio_id")
    .notNull()
    .references(() => audios.id, { onDelete: "cascade" }),
  secondsListened: integer("seconds_listened").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
