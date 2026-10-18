
import { SignJWT, jwtVerify } from "jose";
import { randomBytes, createHash } from "node:crypto";

const secret = process.env.JWT_ACCESS_SECRET;

if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
  throw new Error("JWT_ACCESS_SECRET must contain at least 32 bytes");
}

const accessKey = new TextEncoder().encode(secret);

export type TokenUser = {
  id: string;
  role: string;
};

export async function createAccessToken(user: TokenUser) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessKey);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, accessKey, {
    algorithms: ["HS256"],
  });

  return payload;
}

export function createRefreshToken() {
  return randomBytes(32).toString("base64url");
}

export function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
