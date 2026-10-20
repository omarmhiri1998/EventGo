
import {
  beforeAll,
  afterAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  decodeJwt,
  decodeProtectedHeader,
  SignJWT,
  jwtVerify,
} from "jose";

import { createHash } from "node:crypto";

// ======================================
// TEST CONFIGURATION
// ======================================

const originalSecret = process.env.JWT_ACCESS_SECRET;

// Test-only secret: never use a production secret.
const testSecret =
  "eventgo-unit-test-secret-at-least-32-bytes-long";

const testKey = new TextEncoder().encode(testSecret);

type TokenModule =
  typeof import("../../app/lib/tokens");

let tokens: TokenModule;

const testUser = {
  id: "user-123",
  role: "user",
};

// ======================================
// SETUP
// ======================================

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = testSecret;

  // Import after configuring environment,
  // because tokens.ts validates the secret
  // when the module is first loaded.
  vi.resetModules();

  tokens = await import("../../app/lib/tokens");
});

afterAll(() => {
  if (originalSecret === undefined) {
    delete process.env.JWT_ACCESS_SECRET;
  } else {
    process.env.JWT_ACCESS_SECRET = originalSecret;
  }

  vi.resetModules();
});

// ======================================
// ACCESS TOKEN TESTS
// ======================================

describe("createAccessToken", () => {
  it("should create a valid JWT string", async () => {
    const token = await tokens.createAccessToken(testUser);

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const { payload } = await jwtVerify(token, testKey);

    expect(payload.sub).toBe(testUser.id);
    expect(payload.role).toBe(testUser.role);
  });

  it("should contain the correct user ID and role", async () => {
    const token = await tokens.createAccessToken({
      id: "admin-123",
      role: "admin",
    });

    const payload = decodeJwt(token);

    expect(payload.sub).toBe("admin-123");
    expect(payload.role).toBe("admin");
  });

  it("should use HS256 algorithm", async () => {
    const token = await tokens.createAccessToken(testUser);

    const header = decodeProtectedHeader(token);

    expect(header.alg).toBe("HS256");
  });

  it("should expire after 15 minutes", async () => {
    const token = await tokens.createAccessToken(testUser);

    const payload = decodeJwt(token);

    expect(payload.iat).toBeTypeOf("number");
    expect(payload.exp).toBeTypeOf("number");

    expect(payload.exp! - payload.iat!).toBe(900);
  });

  it("should not contain a password", async () => {
    const token = await tokens.createAccessToken(testUser);

    const payload = decodeJwt(token);

    expect(payload).not.toHaveProperty("password");
    expect(payload).not.toHaveProperty("password_hash");
  });
});

// ======================================
// VERIFY ACCESS TOKEN TESTS
// ======================================

describe("verifyAccessToken", () => {
  it("should verify a valid access token", async () => {
    const token = await tokens.createAccessToken(testUser);

    const payload = await tokens.verifyAccessToken(token);

    expect(payload.sub).toBe("user-123");
    expect(payload.role).toBe("user");
  });

  it("should reject a modified JWT signature", async () => {
    const token = await tokens.createAccessToken(testUser);

    const parts = token.split(".");

    const signature = parts[2];

    // Modify one character without changing
    // the token's overall structure.
    parts[2] =
      (signature[0] === "A" ? "B" : "A") +
      signature.slice(1);

    const modifiedToken = parts.join(".");

    await expect(
      tokens.verifyAccessToken(modifiedToken)
    ).rejects.toThrow();
  });

  it("should reject an expired token", async () => {
    const expiredToken = await new SignJWT({
      role: "user",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-123")
      .setIssuedAt()
      .setExpirationTime("-1s")
      .sign(testKey);

    await expect(
      tokens.verifyAccessToken(expiredToken)
    ).rejects.toThrow();
  });

  it("should reject a JWT signed with another secret", async () => {
    const wrongKey = new TextEncoder().encode(
      "completely-different-test-secret-123456789"
    );

    const token = await new SignJWT({
      role: "user",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-123")
      .setExpirationTime("15m")
      .sign(wrongKey);

    await expect(
      tokens.verifyAccessToken(token)
    ).rejects.toThrow();
  });

  it("should reject a malformed token", async () => {
    await expect(
      tokens.verifyAccessToken("invalid-token")
    ).rejects.toThrow();
  });

  it("should reject an unsupported algorithm", async () => {
    const token = await new SignJWT({
      role: "user",
    })
      .setProtectedHeader({ alg: "HS384" })
      .setSubject("user-123")
      .setExpirationTime("15m")
      .sign(testKey);

    await expect(
      tokens.verifyAccessToken(token)
    ).rejects.toThrow();
  });
});

// ======================================
// REFRESH TOKEN TESTS
// ======================================

describe("createRefreshToken", () => {
  it("should create a non-empty string", () => {
    const token = tokens.createRefreshToken();

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("should generate a token containing 32 bytes", () => {
    const token = tokens.createRefreshToken();

    const decoded = Buffer.from(token, "base64url");

    expect(decoded).toHaveLength(32);
  });

  it("should generate different tokens", () => {
    const token1 = tokens.createRefreshToken();
    const token2 = tokens.createRefreshToken();

    expect(token1).not.toBe(token2);
  });

  it("should generate URL-safe tokens", () => {
    const token = tokens.createRefreshToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

// ======================================
// HASH REFRESH TOKEN TESTS
// ======================================

describe("hashRefreshToken", () => {
  it("should return a SHA-256 hash", () => {
    const token = "example-refresh-token";

    const hash = tokens.hashRefreshToken(token);

    const expected = createHash("sha256")
      .update(token)
      .digest("hex");

    expect(hash).toBe(expected);
  });

  it("should produce a 64-character hexadecimal hash", () => {
    const hash = tokens.hashRefreshToken("test-token");

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should produce the same hash for the same token", () => {
    const token = "same-refresh-token";

    const hash1 = tokens.hashRefreshToken(token);
    const hash2 = tokens.hashRefreshToken(token);

    expect(hash1).toBe(hash2);
  });

  it("should produce different hashes for different tokens", () => {
    const hash1 = tokens.hashRefreshToken("token-one");
    const hash2 = tokens.hashRefreshToken("token-two");

    expect(hash1).not.toBe(hash2);
  });

  it("should not expose the original token", () => {
    const token = "sensitive-refresh-token";

    const hash = tokens.hashRefreshToken(token);

    expect(hash).not.toBe(token);
    expect(hash).not.toContain(token);
  });
});

// ======================================
// JWT SECRET VALIDATION TESTS
// ======================================

describe("JWT secret configuration", () => {
  it("should reject a secret shorter than 32 bytes", async () => {
    vi.resetModules();

    vi.stubEnv("JWT_ACCESS_SECRET", "short-secret");

    try {
      await expect(
        import("../../app/lib/tokens")
      ).rejects.toThrow(
        "JWT_ACCESS_SECRET must contain at least 32 bytes"
      );
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  it("should reject a missing secret", async () => {
    vi.resetModules();

    vi.stubEnv("JWT_ACCESS_SECRET", "");

    try {
      await expect(
        import("../../app/lib/tokens")
      ).rejects.toThrow(
        "JWT_ACCESS_SECRET must contain at least 32 bytes"
      );
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});
