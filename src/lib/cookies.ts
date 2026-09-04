import { env } from "../configs/env.config.js"

const isProduction = env.NODE_ENV === "production";
const sameSite = isProduction ? "none" : "lax";

export const cookieOptions = {
  httpOnly: true,
  secure: isProduction, // should browser send the cookie over https?
  sameSite,
  expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), 
  partitioned: isProduction,
} as const;

