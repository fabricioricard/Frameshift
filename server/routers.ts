import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createVideo,
  getVideoById,
  getPublishedVideos,
  getVideosByUserId,
  createComment,
  getCommentsByVideoId,
  likeVideo,
  unlikeVideo,
  hasUserLikedVideo,
  getVideoLikeCount,
  createLiveStream,
  getLiveStreamById,
  getActiveLiveStreams,
  getLiveStreamsByUserId,
  updateLiveStream,
  deleteLiveStream,
  updateLiveStreamViewers,
} from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  videos: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(({ input }) => getPublishedVideos(input.limit, input.offset)),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getVideoById(input.id)),
    
    getByUserId: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
      .query(({ input }) => getVideosByUserId(input.userId, input.limit, input.offset)),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        videoUrl: z.string().url(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return createVideo({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          thumbnailUrl: input.thumbnailUrl,
          videoUrl: input.videoUrl,
          duration: input.duration,
        });
      }),
  }),

  comments: router({
    getByVideoId: publicProcedure
      .input(z.object({ videoId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
      .query(({ input }) => getCommentsByVideoId(input.videoId, input.limit, input.offset)),
    
    create: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        return createComment({
          videoId: input.videoId,
          userId: ctx.user.id,
          content: input.content,
        });
      }),
  }),

  likes: router({
    toggle: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const hasLiked = await hasUserLikedVideo(input.videoId, ctx.user.id);
        if (hasLiked) {
          await unlikeVideo(input.videoId, ctx.user.id);
        } else {
          await likeVideo(input.videoId, ctx.user.id);
        }
        return { liked: !hasLiked };
      }),
    
    count: publicProcedure
      .input(z.object({ videoId: z.number() }))
      .query(({ input }) => getVideoLikeCount(input.videoId)),
    
    hasLiked: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .query(({ input, ctx }) => hasUserLikedVideo(input.videoId, ctx.user.id)),
  }),

  liveStreams: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(({ input }) => getActiveLiveStreams(input.limit, input.offset)),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getLiveStreamById(input.id)),
    
    getByUserId: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
      .query(({ input }) => getLiveStreamsByUserId(input.userId, input.limit, input.offset)),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        streamUrl: z.string().url(),
      }))
      .mutation(async ({ input, ctx }) => {
        return createLiveStream({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          thumbnailUrl: input.thumbnailUrl,
          streamUrl: input.streamUrl,
          status: "scheduled",
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        status: z.enum(["scheduled", "live", "ended"]).optional(),
        viewers: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        return updateLiveStream(id, ctx.user.id, updates);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return deleteLiveStream(input.id, ctx.user.id);
      }),
    
    updateViewers: publicProcedure
      .input(z.object({ id: z.number(), viewers: z.number() }))
      .mutation(async ({ input }) => {
        return updateLiveStreamViewers(input.id, input.viewers);
      }),
  }),
});

export type AppRouter = typeof appRouter;
