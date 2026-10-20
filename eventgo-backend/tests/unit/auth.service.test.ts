
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import argon2 from "argon2";

import { pool } from "../../src/db/database";
import {
  signup,
  login,
} from "../../src/services/auth.service";

// =====================================
// MOCKS
// =====================================

vi.mock("argon2", () => ({
  default: {
    hash: vi.fn(),
    verify: vi.fn(),
    argon2id: 2,
  },
}));

vi.mock("../../src/db/database", () => ({
  pool: {
    query: vi.fn(),
  },
}));

const queryMock = vi.mocked(pool.query);
const hashMock = vi.mocked(argon2.hash);
const verifyMock = vi.mocked(argon2.verify);

// =====================================
// TEST DATA
// =====================================

const publicUser = {
  id: "user-1",
  name: "Omar",
  email: "omar@example.com",
  role: "user",
};

const authUser = {
  ...publicUser,
  password_hash: "stored-password-hash",
};

// =====================================
// SETUP
// =====================================

beforeEach(() => {
  vi.resetAllMocks();

  // Current login() performs a diagnostic
  // database query before looking up the user.
  // Suppress its console output in tests.
  vi.spyOn(console, "log").mockImplementation(() => {});
});

// =====================================
// SIGNUP UNIT TESTS
// =====================================

describe("Signup Service", () => {
  it("should create a user with valid data", async () => {
    hashMock.mockResolvedValue("hashed-password");

    queryMock.mockResolvedValue({
      rows: [publicUser],
    } as never);

    const result = await signup({
      name: "Omar",
      email: "omar@example.com",
      password: "StrongPass123",
    });

    expect(result).toEqual(publicUser);

    expect(hashMock).toHaveBeenCalledWith(
      "StrongPass123",
      {
        type: argon2.argon2id,
      }
    );

    expect(queryMock).toHaveBeenCalledOnce();

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO users"),
      [
        "Omar",
        "omar@example.com",
        "hashed-password",
      ]
    );
  });

  it("should reject a name shorter than 2 characters", async () => {
    await expect(
      signup({
        name: "A",
        email: "omar@example.com",
        password: "StrongPass123",
      })
    ).rejects.toThrow(
      "Name must contain at least 2 characters"
    );

    expect(hashMock).not.toHaveBeenCalled();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("should reject an empty name", async () => {
    await expect(
      signup({
        name: "   ",
        email: "omar@example.com",
        password: "StrongPass123",
      })
    ).rejects.toThrow(
      "Name must contain at least 2 characters"
    );

    expect(queryMock).not.toHaveBeenCalled();
  });

  it("should reject invalid email formats", async () => {
    const invalidEmails = [
      "invalid-email",
      "omar@",
      "@example.com",
      "omar@example",
      "",
      "omar @example.com",
    ];

    for (const email of invalidEmails) {
      await expect(
        signup({
          name: "Omar",
          email,
          password: "StrongPass123",
        })
      ).rejects.toThrow("Invalid email address");
    }

    expect(queryMock).not.toHaveBeenCalled();
    expect(hashMock).not.toHaveBeenCalled();
  });

  it("should reject a password shorter than 8 characters", async () => {
    await expect(
      signup({
        name: "Omar",
        email: "omar@example.com",
        password: "1234567",
      })
    ).rejects.toThrow(
      "Password must contain at least 8 characters"
    );

    expect(hashMock).not.toHaveBeenCalled();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("should accept a password with exactly 8 characters", async () => {
    hashMock.mockResolvedValue("hashed-password");

    queryMock.mockResolvedValue({
      rows: [publicUser],
    } as never);

    const result = await signup({
      name: "Omar",
      email: "omar@example.com",
      password: "12345678",
    });

    expect(result).toEqual(publicUser);
    expect(hashMock).toHaveBeenCalledWith(
      "12345678",
      { type: argon2.argon2id }
    );
  });

  it("should normalize name and email", async () => {
    hashMock.mockResolvedValue("hashed-password");

    queryMock.mockResolvedValue({
      rows: [publicUser],
    } as never);

    await signup({
      name: "  Omar  ",
      email: "  OMAR@EXAMPLE.COM  ",
      password: "StrongPass123",
    });

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO users"),
      [
        "Omar",
        "omar@example.com",
        "hashed-password",
      ]
    );
  });

  it("should never store the plain password in the SQL parameters", async () => {
    hashMock.mockResolvedValue("hashed-password");

    queryMock.mockResolvedValue({
      rows: [publicUser],
    } as never);

    await signup({
      name: "Omar",
      email: "omar@example.com",
      password: "StrongPass123",
    });

    const [, params] = queryMock.mock.calls[0];

    expect(params).toContain("hashed-password");
    expect(params).not.toContain("StrongPass123");
  });

  it("should reject an already registered email", async () => {
    hashMock.mockResolvedValue("hashed-password");

    queryMock.mockRejectedValue({
      code: "23505",
    });

    await expect(
      signup({
        name: "Omar",
        email: "omar@example.com",
        password: "StrongPass123",
      })
    ).rejects.toThrow("Email already registered");
  });

  it("should propagate unexpected database errors", async () => {
    hashMock.mockResolvedValue("hashed-password");

    queryMock.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      signup({
        name: "Omar",
        email: "omar@example.com",
        password: "StrongPass123",
      })
    ).rejects.toThrow("Database unavailable");
  });
});

// =====================================
// LOGIN UNIT TESTS
// =====================================

describe("Login Service", () => {
  // The existing login() has two queries:
  // 1. Temporary diagnostic query
  // 2. User lookup query
  function mockLoginQueries(
    user: typeof authUser | undefined
  ) {
    queryMock.mockResolvedValueOnce({
      rows: [{}],
    } as never);

    queryMock.mockResolvedValueOnce({
      rows: user ? [user] : [],
    } as never);
  }

  it("should login with valid credentials", async () => {
    mockLoginQueries(authUser);

    verifyMock.mockResolvedValue(true);

    const result = await login({
      email: "omar@example.com",
      password: "StrongPass123",
    });

    expect(result).toEqual(publicUser);

    expect(verifyMock).toHaveBeenCalledWith(
      "stored-password-hash",
      "StrongPass123"
    );
  });

  it("should reject a nonexistent user", async () => {
    mockLoginQueries(undefined);

    await expect(
      login({
        email: "missing@example.com",
        password: "StrongPass123",
      })
    ).rejects.toThrow("Invalid email or password");

    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("should reject an incorrect password", async () => {
    mockLoginQueries(authUser);

    verifyMock.mockResolvedValue(false);

    await expect(
      login({
        email: "omar@example.com",
        password: "WrongPass123",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("should normalize the email before login", async () => {
    mockLoginQueries(authUser);

    verifyMock.mockResolvedValue(true);

    const result = await login({
      email: "  OMAR@EXAMPLE.COM  ",
      password: "StrongPass123",
    });

    expect(result).toEqual(publicUser);

    expect(queryMock).toHaveBeenLastCalledWith(
      expect.stringContaining("FROM users"),
      ["omar@example.com"]
    );
  });

  it("should never expose the password hash", async () => {
    mockLoginQueries(authUser);

    verifyMock.mockResolvedValue(true);

    const result = await login({
      email: "omar@example.com",
      password: "StrongPass123",
    });

    expect(result).not.toHaveProperty("password_hash");

    expect(result).toEqual({
      id: "user-1",
      name: "Omar",
      email: "omar@example.com",
      role: "user",
    });
  });

  it("should propagate database errors", async () => {
    // First query: diagnostic
    queryMock.mockResolvedValueOnce({
      rows: [{}],
    } as never);

    // Second query: user lookup
    queryMock.mockRejectedValueOnce(
      new Error("Database unavailable")
    );

    await expect(
      login({
        email: "omar@example.com",
        password: "StrongPass123",
      })
    ).rejects.toThrow("Database unavailable");

    expect(verifyMock).not.toHaveBeenCalled();
  });
});
