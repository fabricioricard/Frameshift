import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, videos, comments, likes, liveStreams, InsertVideo, InsertComment, InsertLike, InsertLiveStream } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Video queries
export async function createVideo(video: InsertVideo) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.insert(videos).values(video);
  return result;
}

export async function getVideoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPublishedVideos(limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(videos)
    .where(eq(videos.isPublished, 1))
    .orderBy(desc(videos.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getVideosByUserId(userId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(videos)
    .where(and(eq(videos.userId, userId), eq(videos.isPublished, 1)))
    .orderBy(desc(videos.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function incrementVideoViews(videoId: number) {
  const db = await getDb();
  if (!db) return;
  // This is a placeholder - in production, use raw SQL or a proper increment function
  const video = await getVideoById(videoId);
  if (video) {
    await db.update(videos).set({ views: (video.views || 0) + 1 }).where(eq(videos.id, videoId));
  }
}

// Comment queries
export async function createComment(comment: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(comments).values(comment);
}

export async function getCommentsByVideoId(videoId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(comments)
    .where(eq(comments.videoId, videoId))
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .offset(offset);
}

// Like queries
export async function likeVideo(videoId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(likes).values({ videoId, userId });
}

export async function unlikeVideo(videoId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(likes).where(and(eq(likes.videoId, videoId), eq(likes.userId, userId)));
}

export async function hasUserLikedVideo(videoId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select()
    .from(likes)
    .where(and(eq(likes.videoId, videoId), eq(likes.userId, userId)))
    .limit(1);
  return result.length > 0;
}

export async function getVideoLikeCount(videoId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select()
    .from(likes)
    .where(eq(likes.videoId, videoId));
  return result.length;
}

// Video update and delete
export async function updateVideo(id: number, userId: number, updates: Partial<Omit<InsertVideo, 'userId'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const video = await getVideoById(id);
  if (!video) throw new Error("Video not found");
  if (video.userId !== userId) throw new Error("Unauthorized");
  
  return await db.update(videos).set(updates).where(eq(videos.id, id));
}

export async function deleteVideo(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const video = await getVideoById(id);
  if (!video) throw new Error("Video not found");
  if (video.userId !== userId) throw new Error("Unauthorized");
  
  return await db.delete(videos).where(eq(videos.id, id));
}

// User profile queries
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(id: number, updates: Partial<Omit<InsertUser, 'openId'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(users).set(updates).where(eq(users.id, id));
}

// Live stream queries
export async function createLiveStream(stream: InsertLiveStream) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(liveStreams).values(stream);
}

export async function getLiveStreamById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(liveStreams).where(eq(liveStreams.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActiveLiveStreams(limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(liveStreams)
    .where(eq(liveStreams.status, "live"))
    .orderBy(desc(liveStreams.viewers))
    .limit(limit)
    .offset(offset);
}

export async function getLiveStreamsByUserId(userId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(liveStreams)
    .where(eq(liveStreams.userId, userId))
    .orderBy(desc(liveStreams.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateLiveStream(id: number, userId: number, updates: Partial<Omit<InsertLiveStream, "userId">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const stream = await getLiveStreamById(id);
  if (!stream) throw new Error("Stream not found");
  if (stream.userId !== userId) throw new Error("Unauthorized");
  
  return await db.update(liveStreams).set(updates).where(eq(liveStreams.id, id));
}

export async function deleteLiveStream(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const stream = await getLiveStreamById(id);
  if (!stream) throw new Error("Stream not found");
  if (stream.userId !== userId) throw new Error("Unauthorized");
  
  return await db.delete(liveStreams).where(eq(liveStreams.id, id));
}

export async function updateLiveStreamViewers(id: number, viewers: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(liveStreams).set({ viewers }).where(eq(liveStreams.id, id));
}
