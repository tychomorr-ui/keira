import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response } from "express";
import { jwtVerify, SignJWT } from "jose";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";

const scrypt = promisify(scryptCallback);
const PASSWORD_KEY_LENGTH = 64;
const SESSION_ISSUER = "sovereign-portal";

type SessionClaims = {
  userId: number;
  name: string;
};

function secretKey() {
  if (!ENV.cookieSecret) {
    throw new Error("JWT_SECRET is required for sovereign authentication");
  }
  return new TextEncoder().encode(ENV.cookieSecret);
}

export function isValidOwnerAccessToken(candidate: string) {
  const configured = ENV.portalOwnerAccessToken;
  if (!configured || !candidate) return false;
  const candidateBuffer = Buffer.from(candidate);
  const configuredBuffer = Buffer.from(configured);
  return candidateBuffer.length === configuredBuffer.length && timingSafeEqual(candidateBuffer, configuredBuffer);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [saltHex, keyHex] = storedHash.split(":");
  if (!saltHex || !keyHex) return false;

  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(keyHex, "hex");
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function createSessionToken(user: SessionClaims) {
  return new SignJWT({ name: user.name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(user.userId))
    .setIssuer(SESSION_ISSUER)
    .setIssuedAt()
    .setExpirationTime("1y")
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionClaims | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
    });
    const userId = Number(payload.sub);
    const name = typeof payload.name === "string" ? payload.name : "";
    if (!Number.isInteger(userId) || userId <= 0 || !name) return null;
    return { userId, name };
  } catch {
    return null;
  }
}

export function setSessionCookie(req: Request, res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    ...getSessionCookieOptions(req),
    maxAge: ONE_YEAR_MS,
  });
}

export function clearSessionCookie(req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME, {
    ...getSessionCookieOptions(req),
    maxAge: 0,
  });
}
