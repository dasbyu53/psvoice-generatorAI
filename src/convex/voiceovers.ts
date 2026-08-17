import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

/**
 * Save a generated voiceover to the signed-in user's history.
 */
export const save = mutation({
  args: {
    text: v.string(),
    title: v.optional(v.string()),
    voiceId: v.string(),
    voiceName: v.string(),
    emotionId: v.string(),
    scenePresetId: v.optional(v.string()),
    autoDirect: v.boolean(),
    settings: v.object({
      intonation: v.number(),
      pitch: v.number(),
      speed: v.number(),
      volume: v.number(),
      pause: v.number(),
    }),
    durationSec: v.number(),
    wordCount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      throw new Error("Not authenticated");
    }
    const id = await ctx.db.insert("voiceovers", {
      userId: user._id,
      text: args.text,
      title: args.title,
      voiceId: args.voiceId,
      voiceName: args.voiceName,
      emotionId: args.emotionId,
      scenePresetId: args.scenePresetId,
      autoDirect: args.autoDirect,
      settings: args.settings,
      durationSec: args.durationSec,
      wordCount: args.wordCount,
    });
    return id;
  },
});

/**
 * List the signed-in user's voiceover history, newest first.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return [];
    }
    return ctx.db
      .query("voiceovers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(30);
  },
});

/**
 * Delete one of the signed-in user's voiceovers. Only the owner can delete.
 */
export const remove = mutation({
  args: { id: v.id("voiceovers") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      throw new Error("Not authenticated");
    }
    const doc = await ctx.db.get(args.id);
    if (doc === null || doc.userId !== user._id) {
      throw new Error("Not found");
    }
    await ctx.db.delete(args.id);
  },
});
