import { createCookieSessionStorage } from "@remix-run/node";

// This is a secret used to encrypt the session
// In a real app, use a long, random string from an environment variable
const SECRET_KEY = "playfairs_secret_key_2025_super_secure";

export const { getSession, commitSession, destroySession } = 
  createCookieSessionStorage({
    cookie: {
      name: "__session",
      httpOnly: true,
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
      sameSite: "lax",
      secrets: [SECRET_KEY],
      secure: process.env.NODE_ENV === "production"
    }
  });
