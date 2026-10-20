
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { NextRequest } from "next/server";
import { isAllowedOrigin } from "../../app/lib/allowed-origin";

// ======================================
// TEST HELPERS
// ======================================

function createRequest(
  origin?: string
): NextRequest {
  const headers = new Headers();

  if (origin !== undefined) {
    headers.set("origin", origin);
  }

  return {
    headers,
  } as NextRequest;
}

function configureEnvironment(
  values: Record<string, string | undefined>
) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      vi.stubEnv(key, undefined);
    } else {
      vi.stubEnv(key, value);
    }
  }
}

// ======================================
// SETUP
// ======================================

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");

  configureEnvironment({
    EVENTGO_PUBLIC_ORIGIN: undefined,
    AUTH_ORIGIN: undefined,
    EVENTGO_TRUSTED_ORIGINS: undefined,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ======================================
// GENERAL VALIDATION
// ======================================

describe("isAllowedOrigin - General", () => {
  it("should reject a request without Origin", () => {
    const request = createRequest();

    expect(isAllowedOrigin(request)).toBe(false);
  });

  it("should reject an empty Origin", () => {
    const request = createRequest("");

    expect(isAllowedOrigin(request)).toBe(false);
  });

  it("should reject an unknown Origin", () => {
    const request = createRequest(
      "https://evil.example.com"
    );

    expect(isAllowedOrigin(request)).toBe(false);
  });

  it("should reject an Origin with a different protocol", () => {
    configureEnvironment({
      EVENTGO_PUBLIC_ORIGIN:
        "https://eventgo.example.com",
    });

    const request = createRequest(
      "http://eventgo.example.com"
    );

    expect(isAllowedOrigin(request)).toBe(false);
  });

  it("should reject an Origin with a different port", () => {
    configureEnvironment({
      EVENTGO_PUBLIC_ORIGIN:
        "https://eventgo.example.com:8443",
    });

    expect(
      isAllowedOrigin(
        createRequest(
          "https://eventgo.example.com:9443"
        )
      )
    ).toBe(false);
  });

  it("should reject a malicious subdomain", () => {
    configureEnvironment({
      EVENTGO_PUBLIC_ORIGIN:
        "https://eventgo.example.com",
    });

    expect(
      isAllowedOrigin(
        createRequest(
          "https://eventgo.example.com.evil.com"
        )
      )
    ).toBe(false);
  });

  it("should reject an Origin containing userinfo", () => {
    configureEnvironment({
      EVENTGO_PUBLIC_ORIGIN:
        "https://eventgo.example.com",
    });

    expect(
      isAllowedOrigin(
        createRequest(
          "https://eventgo.example.com@evil.com"
        )
      )
    ).toBe(false);
  });

  it("should reject the literal null Origin", () => {
    expect(
      isAllowedOrigin(createRequest("null"))
    ).toBe(false);
  });
});

// ======================================
// DEVELOPMENT ORIGINS
// ======================================

describe("isAllowedOrigin - Development", () => {
  it.each([
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
  ])(
    "should allow development Origin %s",
    (origin) => {
      expect(
        isAllowedOrigin(createRequest(origin))
      ).toBe(true);
    }
  );

  it("should reject localhost on an unconfigured port", () => {
    expect(
      isAllowedOrigin(
        createRequest("http://localhost:9999")
      )
    ).toBe(false);
  });

  it("should reject HTTPS localhost when only HTTP is allowed", () => {
    expect(
      isAllowedOrigin(
        createRequest("https://localhost:3000")
      )
    ).toBe(false);
  });

  it("should reject localhost:3003 in the current configuration", () => {
    expect(
      isAllowedOrigin(
        createRequest("http://localhost:3003")
      )
    ).toBe(false);
  });
});

// ======================================
// PRODUCTION ORIGINS
// ======================================

describe("isAllowedOrigin - Production", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
  });

  it("should reject development Origins", () => {
    expect(
      isAllowedOrigin(
        createRequest("http://localhost:3000")
      )
    ).toBe(false);
  });

  it("should reject 127.0.0.1 Origins", () => {
    expect(
      isAllowedOrigin(
        createRequest("http://127.0.0.1:3001")
      )
    ).toBe(false);
  });

  it("should allow EVENTGO_PUBLIC_ORIGIN", () => {
    configureEnvironment({
      EVENTGO_PUBLIC_ORIGIN:
        "https://eventgo.example.com",
    });

    expect(
      isAllowedOrigin(
        createRequest(
          "https://eventgo.example.com"
        )
      )
    ).toBe(true);
  });

  it("should allow AUTH_ORIGIN", () => {
    configureEnvironment({
      AUTH_ORIGIN:
        "https://auth.example.com",
    });

    expect(
      isAllowedOrigin(
        createRequest("https://auth.example.com")
      )
    ).toBe(true);
  });

  it("should reject unknown production Origins", () => {
    configureEnvironment({
      EVENTGO_PUBLIC_ORIGIN:
        "https://eventgo.example.com",
    });

    expect(
      isAllowedOrigin(
        createRequest("https://unknown.example.com")
      )
    ).toBe(false);
  });
});

// ======================================
// TRUSTED ORIGINS
// ======================================

describe("isAllowedOrigin - Trusted Origins", () => {
  it("should allow multiple trusted Origins", () => {
    configureEnvironment({
      EVENTGO_TRUSTED_ORIGINS:
        "https://admin.example.com,https://app.example.com",
    });

    expect(
      isAllowedOrigin(
        createRequest("https://admin.example.com")
      )
    ).toBe(true);

    expect(
      isAllowedOrigin(
        createRequest("https://app.example.com")
      )
    ).toBe(true);
  });

  it("should trim whitespace around configured Origins", () => {
    configureEnvironment({
      EVENTGO_TRUSTED_ORIGINS:
        "  https://admin.example.com  ,  https://app.example.com  ",
    });

    expect(
      isAllowedOrigin(
        createRequest("https://admin.example.com")
      )
    ).toBe(true);

    expect(
      isAllowedOrigin(
        createRequest("https://app.example.com")
      )
    ).toBe(true);
  });

  it("should remove trailing slashes from configured Origins", () => {
    configureEnvironment({
      EVENTGO_TRUSTED_ORIGINS:
        "https://admin.example.com/",
    });

    expect(
      isAllowedOrigin(
        createRequest("https://admin.example.com")
      )
    ).toBe(true);
  });

  it("should reject an Origin not included in the trusted list", () => {
    configureEnvironment({
      EVENTGO_TRUSTED_ORIGINS:
        "https://admin.example.com,https://app.example.com",
    });

    expect(
      isAllowedOrigin(
        createRequest("https://evil.example.com")
      )
    ).toBe(false);
  });

  it("should not accept a domain merely because it shares a suffix", () => {
    configureEnvironment({
      EVENTGO_TRUSTED_ORIGINS:
        "https://example.com",
    });

    expect(
      isAllowedOrigin(
        createRequest("https://fakeexample.com")
      )
    ).toBe(false);
  });

  it("should match configured Origins exactly", () => {
    configureEnvironment({
      EVENTGO_TRUSTED_ORIGINS:
        "https://admin.example.com",
    });

    expect(
      isAllowedOrigin(
        createRequest("https://admin.example.com")
      )
    ).toBe(true);

    expect(
      isAllowedOrigin(
        createRequest("https://admin.example.com/")
      )
    ).toBe(false);
  });
});

// ======================================
// CONFIGURATION COMBINATIONS
// ======================================

describe("isAllowedOrigin - Configuration", () => {
  it("should allow Origins from all three configuration variables", () => {
    configureEnvironment({
      EVENTGO_PUBLIC_ORIGIN:
        "https://eventgo.example.com",
      AUTH_ORIGIN:
        "https://auth.example.com",
      EVENTGO_TRUSTED_ORIGINS:
        "https://admin.example.com",
    });

    const origins = [
      "https://eventgo.example.com",
      "https://auth.example.com",
      "https://admin.example.com",
    ];

    for (const origin of origins) {
      expect(
        isAllowedOrigin(createRequest(origin))
      ).toBe(true);
    }
  });

  it("should handle duplicate configured Origins", () => {
    configureEnvironment({
      EVENTGO_PUBLIC_ORIGIN:
        "https://eventgo.example.com",
      EVENTGO_TRUSTED_ORIGINS:
        "https://eventgo.example.com,https://eventgo.example.com",
    });

    expect(
      isAllowedOrigin(
        createRequest("https://eventgo.example.com")
      )
    ).toBe(true);
  });

  it("should handle empty trusted Origins", () => {
    configureEnvironment({
      EVENTGO_TRUSTED_ORIGINS: "",
    });

    expect(
      isAllowedOrigin(
        createRequest("https://unknown.example.com")
      )
    ).toBe(false);
  });
});
