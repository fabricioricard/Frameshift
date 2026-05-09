import { verifyFirebaseToken } from "./firebase";
import { getUserByOpenId, upsertUser } from "../db";
import type { Request, Response } from "express";

export type TrpcContext = {
  req: Request;
  res: Response;
  user: Awaited<ReturnType<typeof getUserByOpenId>> | null;
};

export async function createContext(opts: {
  req: Request;
  res: Response;
}): Promise<TrpcContext> {
  let user: TrpcContext["user"] = null;

  try {
    const authHeader = opts.req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const idToken = authHeader.slice(7);
      const decoded = await verifyFirebaseToken(idToken);

      const openId = decoded.uid;
      const signedInAt = new Date();

      let existing = await getUserByOpenId(openId);

      if (!existing) {
        await upsertUser({
          openId,
          name: decoded.name ?? null,
          email: decoded.email ?? null,
          loginMethod: decoded.firebase?.sign_in_provider ?? null,
          lastSignedIn: signedInAt,
        });
        existing = await getUserByOpenId(openId);
      } else {
        await upsertUser({ openId, lastSignedIn: signedInAt });
      }

      user = existing ?? null;
    }
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}