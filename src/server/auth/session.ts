import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthSession, AppRole } from "@/server/domain/mvp";

const SESSION_COOKIE = "central-acolhimento-session";
const DEFAULT_AUTH_SECRET = "central-acolhimento-dev-secret";

function getAuthSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || DEFAULT_AUTH_SECRET;
}

function shouldUseSecureCookie() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  if (appUrl.startsWith("http://localhost") || appUrl.startsWith("http://127.0.0.1")) {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

function encode(input: string) {
  return Buffer.from(input).toString("base64url");
}

function decode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

export function createSessionToken(session: AuthSession) {
  const payload = encode(JSON.stringify(session));
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function parseSessionToken(token: string | undefined | null): AuthSession | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    return JSON.parse(decode(payload)) as AuthSession;
  } catch {
    return null;
  }
}

export async function getServerAuthSession() {
  const cookieStore = await cookies();
  return parseSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function setServerAuthSession(session: AuthSession) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearServerAuthSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: 0,
  });
}

function getHomePathByRole(role: AppRole) {
  return role === "coordinator" ? "/coord" : "/cuidador";
}

export async function requireServerAuthSession(role?: AppRole) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/login");
  }

  if (role && session.membership.role !== role) {
    redirect(getHomePathByRole(session.membership.role));
  }

  return session;
}
