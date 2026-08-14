import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { verifySessionToken } from "../sovereign-auth";
import { COOKIE_NAME } from "@shared/const";

export class SovereignAuthService {
  async authenticateRequest(req: Request): Promise<User> {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const session = await verifySessionToken(cookies[COOKIE_NAME]);
    if (!session) throw ForbiddenError("Invalid sovereign session");

    const user = await db.getUserById(session.userId);
    if (!user) throw ForbiddenError("Sovereign account not found");

    await db.upsertUser({ id: user.id, lastSignedIn: new Date() });
    return user;
  }
}

export const sdk = new SovereignAuthService();
