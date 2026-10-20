
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createSession,
  refreshSession,
  revokeSession,
  validateSession,
} from "../../app/lib/sessions";

// ======================================
// MOCK FUNCTIONS
// ======================================

const mocks = vi.hoisted(() => ({
  poolQuery: vi.fn(),
  poolConnect: vi.fn(),
  clientQuery: vi.fn(),
  clientRelease: vi.fn(),

  createAccessToken: vi.fn(),
  createRefreshToken: vi.fn(),
  hashRefreshToken: vi.fn(),
}));

// ======================================
// DATABASE MOCK
// ======================================

vi.mock(
  "../../../eventgo-backend/src/db/database",
  () => ({
    pool: {
      query: mocks.poolQuery,
      connect: mocks.poolConnect,
    },
  })
);

// ======================================
// TOKEN MOCK
// ======================================

vi.mock("../../app/lib/tokens", () => ({
  createAccessToken: mocks.createAccessToken,
  createRefreshToken: mocks.createRefreshToken,
  hashRefreshToken: mocks.hashRefreshToken,
}));

// ======================================
// TEST DATA
// ======================================

const user = {
  id: "user-123",
  role: "user",
};

const databaseSession = {
  id: "session-123",
  user_id: "user-123",
  role: "user",
};

const accessToken = "mock-access-token";
const refreshToken = "mock-refresh-token";
const oldRefreshToken = "old-refresh-token";

const tokenHash = "mock-token-hash";
const oldHash = "old-token-hash";

// ======================================
// SETUP
// ======================================

beforeEach(() => {
  vi.resetAllMocks();

  mocks.createAccessToken.mockResolvedValue(
    accessToken
  );

  mocks.createRefreshToken.mockReturnValue(
    refreshToken
  );

  mocks.hashRefreshToken.mockImplementation(
    (token: string) => {
      if (token === oldRefreshToken) {
        return oldHash;
      }

      return tokenHash;
    }
  );

  mocks.poolQuery.mockResolvedValue({
    rows: [],
  });

  mocks.clientQuery.mockResolvedValue({
    rows: [],
  });

  mocks.poolConnect.mockResolvedValue({
    query: mocks.clientQuery,
    release: mocks.clientRelease,
  });
});

// ======================================
// CREATE SESSION TESTS
// ======================================

describe("createSession", () => {
  it("should create access and refresh tokens", async () => {
    const result = await createSession(user);

    expect(result).toEqual({
      accessToken,
      refreshToken,
    });

    expect(
      mocks.createAccessToken
    ).toHaveBeenCalledWith(user);

    expect(
      mocks.createRefreshToken
    ).toHaveBeenCalledOnce();
  });

  it("should store the refresh token hash", async () => {
    await createSession(user);

    expect(
      mocks.hashRefreshToken
    ).toHaveBeenCalledWith(refreshToken);

    expect(mocks.poolQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        "INSERT INTO refresh_tokens"
      ),
      [user.id, tokenHash]
    );
  });

  it("should never store the plain refresh token", async () => {
    await createSession(user);

    const [, params] =
      mocks.poolQuery.mock.calls[0];

    expect(params).toContain(tokenHash);
    expect(params).not.toContain(refreshToken);
  });

  it("should propagate database errors", async () => {
    mocks.poolQuery.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      createSession(user)
    ).rejects.toThrow("Database unavailable");

    expect(mocks.poolQuery).toHaveBeenCalledOnce();
  });

  it("should not insert a session if access token creation fails", async () => {
    mocks.createAccessToken.mockRejectedValue(
      new Error("JWT generation failed")
    );

    await expect(
      createSession(user)
    ).rejects.toThrow("JWT generation failed");

    expect(
      mocks.poolQuery
    ).not.toHaveBeenCalled();

    expect(
      mocks.createRefreshToken
    ).not.toHaveBeenCalled();
  });
});

// ======================================
// REFRESH SESSION TESTS
// ======================================

describe("refreshSession", () => {
  function mockValidSession() {
    mocks.clientQuery.mockImplementation(
      async (sql: string) => {
        if (sql.includes("SELECT rt.id")) {
          return {
            rows: [databaseSession],
          };
        }

        return {
          rows: [],
        };
      }
    );
  }

  it("should refresh a valid session", async () => {
    mockValidSession();

    const result = await refreshSession(
      oldRefreshToken
    );

    expect(result).toEqual({
      accessToken,
      refreshToken,
    });

    expect(
      mocks.createAccessToken
    ).toHaveBeenCalledWith({
      id: "user-123",
      role: "user",
    });
  });

  it("should start a database transaction", async () => {
    mockValidSession();

    await refreshSession(oldRefreshToken);

    expect(
      mocks.clientQuery
    ).toHaveBeenCalledWith("BEGIN");
  });

  it("should lock the existing token row", async () => {
    mockValidSession();

    await refreshSession(oldRefreshToken);

    expect(mocks.clientQuery).toHaveBeenCalledWith(
      expect.stringContaining("FOR UPDATE OF rt"),
      [oldHash]
    );
  });

  it("should revoke the old refresh token", async () => {
    mockValidSession();

    await refreshSession(oldRefreshToken);

    expect(mocks.clientQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        "UPDATE refresh_tokens"
      ),
      [databaseSession.id]
    );
  });

  it("should insert the new refresh token hash", async () => {
    mockValidSession();

    await refreshSession(oldRefreshToken);

    expect(mocks.clientQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        "INSERT INTO refresh_tokens"
      ),
      [databaseSession.user_id, tokenHash]
    );
  });

  it("should commit a successful rotation", async () => {
    mockValidSession();

    await refreshSession(oldRefreshToken);

    const sqlCommands =
      mocks.clientQuery.mock.calls.map(
        ([sql]) => sql
      );

    expect(sqlCommands[0]).toBe("BEGIN");
    expect(sqlCommands.at(-1)).toBe("COMMIT");

    expect(sqlCommands).not.toContain("ROLLBACK");
  });

  it("should generate the access token before COMMIT", async () => {
    const executionOrder: string[] = [];

    mocks.clientQuery.mockImplementation(
      async (sql: string) => {
        if (sql.includes("SELECT rt.id")) {
          executionOrder.push("SELECT");

          return {
            rows: [databaseSession],
          };
        }

        if (sql === "COMMIT") {
          executionOrder.push("COMMIT");
        }

        return { rows: [] };
      }
    );

    mocks.createAccessToken.mockImplementation(
      async () => {
        executionOrder.push("ACCESS_TOKEN");

        return accessToken;
      }
    );

    await refreshSession(oldRefreshToken);

    expect(executionOrder).toContain(
      "ACCESS_TOKEN"
    );

    expect(executionOrder).toContain("COMMIT");

    expect(
      executionOrder.indexOf("ACCESS_TOKEN")
    ).toBeLessThan(
      executionOrder.indexOf("COMMIT")
    );
  });

  it("should reject an invalid or revoked session", async () => {
    mocks.clientQuery.mockResolvedValue({
      rows: [],
    });

    const result = await refreshSession(
      oldRefreshToken
    );

    expect(result).toBeNull();

    expect(
      mocks.clientQuery
    ).toHaveBeenCalledWith("ROLLBACK");

    expect(
      mocks.clientQuery
    ).not.toHaveBeenCalledWith("COMMIT");

    expect(
      mocks.createAccessToken
    ).not.toHaveBeenCalled();
  });

  it("should rollback when inserting the new token fails", async () => {
    mocks.clientQuery.mockImplementation(
      async (sql: string) => {
        if (sql.includes("SELECT rt.id")) {
          return {
            rows: [databaseSession],
          };
        }

        if (
          sql.includes("INSERT INTO refresh_tokens")
        ) {
          throw new Error("Insert failed");
        }

        return { rows: [] };
      }
    );

    await expect(
      refreshSession(oldRefreshToken)
    ).rejects.toThrow("Insert failed");

    expect(
      mocks.clientQuery
    ).toHaveBeenCalledWith("ROLLBACK");

    expect(
      mocks.clientQuery
    ).not.toHaveBeenCalledWith("COMMIT");

    expect(
      mocks.createAccessToken
    ).not.toHaveBeenCalled();
  });

  it("should rollback if access token generation fails", async () => {
    mockValidSession();

    mocks.createAccessToken.mockRejectedValue(
      new Error("JWT generation failed")
    );

    await expect(
      refreshSession(oldRefreshToken)
    ).rejects.toThrow("JWT generation failed");

    expect(
      mocks.clientQuery
    ).toHaveBeenCalledWith("ROLLBACK");

    expect(
      mocks.clientQuery
    ).not.toHaveBeenCalledWith("COMMIT");

    expect(
      mocks.clientRelease
    ).toHaveBeenCalledOnce();
  });

  it("should rollback if revoking the old token fails", async () => {
    mocks.clientQuery.mockImplementation(
      async (sql: string) => {
        if (sql.includes("SELECT rt.id")) {
          return {
            rows: [databaseSession],
          };
        }

        if (
          sql.includes("UPDATE refresh_tokens")
        ) {
          throw new Error("Revoke failed");
        }

        return { rows: [] };
      }
    );

    await expect(
      refreshSession(oldRefreshToken)
    ).rejects.toThrow("Revoke failed");

    expect(
      mocks.clientQuery
    ).toHaveBeenCalledWith("ROLLBACK");

    expect(
      mocks.clientQuery
    ).not.toHaveBeenCalledWith("COMMIT");
  });

  it("should rollback when COMMIT fails", async () => {
    mocks.clientQuery.mockImplementation(
      async (sql: string) => {
        if (sql.includes("SELECT rt.id")) {
          return {
            rows: [databaseSession],
          };
        }

        if (sql === "COMMIT") {
          throw new Error("Commit failed");
        }

        return { rows: [] };
      }
    );

    await expect(
      refreshSession(oldRefreshToken)
    ).rejects.toThrow("Commit failed");

    expect(
      mocks.clientQuery
    ).toHaveBeenCalledWith("ROLLBACK");

    expect(
      mocks.clientRelease
    ).toHaveBeenCalledOnce();
  });

  it("should release the connection after success", async () => {
    mockValidSession();

    await refreshSession(oldRefreshToken);

    expect(
      mocks.clientRelease
    ).toHaveBeenCalledOnce();
  });

  it("should release the connection after failure", async () => {
    mocks.clientQuery.mockRejectedValueOnce(
      new Error("Transaction failed")
    );

    await expect(
      refreshSession(oldRefreshToken)
    ).rejects.toThrow("Transaction failed");

    expect(
      mocks.clientRelease
    ).toHaveBeenCalledOnce();
  });

  it("should release the connection for an invalid session", async () => {
    mocks.clientQuery.mockResolvedValue({
      rows: [],
    });

    const result = await refreshSession(
      oldRefreshToken
    );

    expect(result).toBeNull();

    expect(
      mocks.clientRelease
    ).toHaveBeenCalledOnce();
  });
});

// ======================================
// REVOKE SESSION TESTS
// ======================================

describe("revokeSession", () => {
  it("should revoke a refresh token using its hash", async () => {
    await revokeSession(refreshToken);

    expect(
      mocks.hashRefreshToken
    ).toHaveBeenCalledWith(refreshToken);

    expect(mocks.poolQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        "UPDATE refresh_tokens"
      ),
      [tokenHash]
    );
  });

  it("should only revoke an active token", async () => {
    await revokeSession(refreshToken);

    const [sql] = mocks.poolQuery.mock.calls[0];

    expect(sql).toContain(
      "revoked_at IS NULL"
    );
  });

  it("should propagate database errors", async () => {
    mocks.poolQuery.mockRejectedValue(
      new Error("Revoke failed")
    );

    await expect(
      revokeSession(refreshToken)
    ).rejects.toThrow("Revoke failed");
  });
});

// ======================================
// VALIDATE SESSION TESTS
// ======================================

describe("validateSession", () => {
  it("should validate an active session", async () => {
    mocks.poolQuery.mockResolvedValue({
      rows: [
        {
          user_id: "user-123",
          role: "user",
        },
      ],
    });

    const result = await validateSession(
      refreshToken
    );

    expect(result).toEqual({
      userId: "user-123",
      role: "user",
    });
  });

  it("should validate an admin session", async () => {
    mocks.poolQuery.mockResolvedValue({
      rows: [
        {
          user_id: "admin-123",
          role: "admin",
        },
      ],
    });

    const result = await validateSession(
      refreshToken
    );

    expect(result).toEqual({
      userId: "admin-123",
      role: "admin",
    });
  });

  it("should reject an empty token", async () => {
    const result = await validateSession("");

    expect(result).toBeNull();

    expect(
      mocks.poolQuery
    ).not.toHaveBeenCalled();

    expect(
      mocks.hashRefreshToken
    ).not.toHaveBeenCalled();
  });

  it("should reject a token longer than 512 characters", async () => {
    const result = await validateSession(
      "a".repeat(513)
    );

    expect(result).toBeNull();

    expect(
      mocks.poolQuery
    ).not.toHaveBeenCalled();
  });

  it("should accept a 512-character token for validation", async () => {
    mocks.poolQuery.mockResolvedValue({
      rows: [],
    });

    const result = await validateSession(
      "a".repeat(512)
    );

    expect(result).toBeNull();

    expect(
      mocks.poolQuery
    ).toHaveBeenCalledOnce();
  });

  it("should return null when no active session exists", async () => {
    mocks.poolQuery.mockResolvedValue({
      rows: [],
    });

    const result = await validateSession(
      refreshToken
    );

    expect(result).toBeNull();
  });

  it("should query only non-revoked and non-expired tokens", async () => {
    await validateSession(refreshToken);

    const [sql, params] =
      mocks.poolQuery.mock.calls[0];

    expect(sql).toContain(
      "rt.revoked_at IS NULL"
    );

    expect(sql).toContain(
      "rt.expires_at > NOW()"
    );

    expect(params).toEqual([tokenHash]);
  });

  it("should propagate database errors", async () => {
    mocks.poolQuery.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      validateSession(refreshToken)
    ).rejects.toThrow("Database unavailable");
  });
});
