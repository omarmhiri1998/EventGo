
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// ======================================
// MOCK NEXT.JS COOKIES
// ======================================

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

import {
  getSession,
  requireAuth,
} from "../../app/lib/auth";

// ======================================
// TEST DATA
// ======================================

const validUserSession = {
  authenticated: true,
  userId: "user-123",
  role: "user",
};

const validAdminSession = {
  authenticated: true,
  userId: "admin-123",
  role: "admin",
};

const authUrl =
  process.env.EVENTGO_AUTH_SESSION_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://eventgo-auth.vercel.app/auth/api/auth/session"
    : "http://localhost:3002/auth/api/auth/session");

// ======================================
// HELPERS
// ======================================

function mockFetchResponse(
  status: number,
  body: unknown
) {
  vi.mocked(fetch).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response);
}

function mockCookie(
  value: string | undefined
) {
  mocks.cookies.mockResolvedValue({
    get: vi.fn().mockReturnValue(
      value === undefined
        ? undefined
        : { value }
    ),
  });
}

function createRequest(cookie?: string) {
  return new Request(
    "http://localhost:3002/protected",
    {
      headers: cookie
        ? { cookie }
        : {},
    }
  );
}

// ======================================
// SETUP
// ======================================

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());

  mocks.cookies.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ======================================
// GET SESSION TESTS
// ======================================

describe("getSession", () => {
  it("returns null when the refresh cookie is missing", async () => {
    mockCookie(undefined);

    const result = await getSession();

    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns a valid user session", async () => {
    mockCookie("valid-refresh-token");

    mockFetchResponse(200, validUserSession);

    const result = await getSession();

    expect(result).toEqual(validUserSession);
  });

  it("returns a valid admin session", async () => {
    mockCookie("admin-refresh-token");

    mockFetchResponse(200, validAdminSession);

    const result = await getSession();

    expect(result).toEqual(validAdminSession);
  });

  it("encodes the refresh token in the Cookie header", async () => {
    mockCookie("token+with/special=characters");

    mockFetchResponse(200, validUserSession);

    await getSession();

    expect(fetch).toHaveBeenCalledWith(
      authUrl,
      {
        method: "GET",
        headers: {
          Cookie:
            "eventgo_refresh=token%2Bwith%2Fspecial%3Dcharacters",
        },
        cache: "no-store",
      }
    );
  });

  it("reads the eventgo_refresh cookie", async () => {
    const get = vi.fn().mockReturnValue({
      value: "valid-refresh-token",
    });

    mocks.cookies.mockResolvedValue({ get });

    mockFetchResponse(200, validUserSession);

    await getSession();

    expect(get).toHaveBeenCalledWith(
      "eventgo_refresh"
    );
  });

  it("returns null for an empty refresh cookie", async () => {
    mockCookie("");

    const result = await getSession();

    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});

// ======================================
// REQUIRE AUTH TESTS
// ======================================

describe("requireAuth", () => {
  it("returns null if the request has no cookies", async () => {
    const request = createRequest();

    const result = await requireAuth(request);

    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns a valid user session", async () => {
    mockFetchResponse(200, validUserSession);

    const request = createRequest(
      "eventgo_refresh=valid-token"
    );

    const result = await requireAuth(request);

    expect(result).toEqual(validUserSession);
  });

  it("returns a valid admin session", async () => {
    mockFetchResponse(200, validAdminSession);

    const request = createRequest(
      "eventgo_refresh=admin-token"
    );

    const result = await requireAuth(request);

    expect(result).toEqual(validAdminSession);
  });

  it("forwards the original Cookie header", async () => {
    mockFetchResponse(200, validUserSession);

    const cookieHeader =
      "eventgo_refresh=token123; theme=dark";

    await requireAuth(
      createRequest(cookieHeader)
    );

    expect(fetch).toHaveBeenCalledWith(
      authUrl,
      {
        method: "GET",
        headers: {
          Cookie: cookieHeader,
        },
        cache: "no-store",
      }
    );
  });

  it("does not use cached authentication responses", async () => {
    mockFetchResponse(200, validUserSession);

    await requireAuth(
      createRequest("eventgo_refresh=token123")
    );

    expect(fetch).toHaveBeenCalledWith(
      authUrl,
      expect.objectContaining({
        cache: "no-store",
      })
    );
  });
});

// ======================================
// AUTH SERVICE RESPONSE TESTS
// ======================================

describe("Authentication service validation", () => {
  it("returns null for HTTP 401", async () => {
    mockFetchResponse(401, {
      message: "Unauthorized",
    });

    const result = await requireAuth(
      createRequest("eventgo_refresh=invalid")
    );

    expect(result).toBeNull();
  });

  it("throws for HTTP 500", async () => {
    mockFetchResponse(500, {
      message: "Internal Server Error",
    });

    await expect(
      requireAuth(
        createRequest("eventgo_refresh=token")
      )
    ).rejects.toThrow(
      "Authentication service unavailable: HTTP 500"
    );
  });

  it("throws when the authentication service is unreachable", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    vi.mocked(fetch).mockRejectedValue(
      new Error("ECONNREFUSED")
    );

    await expect(
      requireAuth(
        createRequest("eventgo_refresh=token")
      )
    ).rejects.toThrow(
      "Authentication service unavailable"
    );

    expect(consoleSpy).toHaveBeenCalled();
  });

  it("returns null for authenticated false", async () => {
    mockFetchResponse(200, {
      authenticated: false,
      userId: "user-123",
      role: "user",
    });

    const result = await requireAuth(
      createRequest("eventgo_refresh=token")
    );

    expect(result).toBeNull();
  });

  it("returns null for an invalid userId", async () => {
    mockFetchResponse(200, {
      authenticated: true,
      userId: 123,
      role: "user",
    });

    const result = await requireAuth(
      createRequest("eventgo_refresh=token")
    );

    expect(result).toBeNull();
  });

  it("returns null for an unsupported role", async () => {
    mockFetchResponse(200, {
      authenticated: true,
      userId: "user-123",
      role: "superadmin",
    });

    const result = await requireAuth(
      createRequest("eventgo_refresh=token")
    );

    expect(result).toBeNull();
  });

  it("returns null for a null response body", async () => {
    mockFetchResponse(200, null);

    const result = await requireAuth(
      createRequest("eventgo_refresh=token")
    );

    expect(result).toBeNull();
  });

  it("returns null for a string response body", async () => {
    mockFetchResponse(200, "invalid-data");

    const result = await requireAuth(
      createRequest("eventgo_refresh=token")
    );

    expect(result).toBeNull();
  });

  it("returns null when authenticated is missing", async () => {
    mockFetchResponse(200, {
      userId: "user-123",
      role: "user",
    });

    const result = await requireAuth(
      createRequest("eventgo_refresh=token")
    );

    expect(result).toBeNull();
  });

  it("returns null when role is missing", async () => {
    mockFetchResponse(200, {
      authenticated: true,
      userId: "user-123",
    });

    const result = await requireAuth(
      createRequest("eventgo_refresh=token")
    );

    expect(result).toBeNull();
  });

  it("throws when response JSON parsing fails", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockRejectedValue(
        new SyntaxError("Invalid JSON")
      ),
    } as unknown as Response);

    await expect(
      requireAuth(
        createRequest("eventgo_refresh=token")
      )
    ).rejects.toThrow("Invalid JSON");
  });

  it("uses GET to check the session", async () => {
    mockFetchResponse(200, validUserSession);

    await requireAuth(
      createRequest("eventgo_refresh=token")
    );

    expect(fetch).toHaveBeenCalledWith(
      authUrl,
      expect.objectContaining({
        method: "GET",
      })
    );
  });
});
