
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
} from "vitest";

import argon2 from "argon2";

vi.mock("../../src/db/database", () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from "../../src/db/database";

import {
  signup,
  login,
} from "../../src/services/auth.service";

const queryMock = pool.query as unknown as Mock;

describe("Authentication Service - Mock Database", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("creates a new user with a hashed password", async () => {
    const user = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      role: "user",
    };

    queryMock.mockResolvedValueOnce({
      rows: [user],
    });

    const result = await signup({
      name: "Test User",
      email: "test@example.com",
      password: "Password123!",
    });

    expect(result).toEqual(user);
    expect(queryMock).toHaveBeenCalledTimes(1);

    const [sql, parameters] =
      queryMock.mock.calls[0];

    expect(sql).toContain("INSERT INTO users");

    expect(parameters[0]).toBe("Test User");
    expect(parameters[1]).toBe("test@example.com");

    const passwordHash = parameters[2];

    expect(passwordHash).not.toBe("Password123!");

    expect(
      await argon2.verify(
        passwordHash,
        "Password123!"
      )
    ).toBe(true);
  });

  it("logs in successfully with correct credentials", async () => {
    const passwordHash = await argon2.hash(
      "Password123!",
      {
        type: argon2.argon2id,
      }
    );

    const databaseUser = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      role: "user",
      password_hash: passwordHash,
    };

    // First query: database diagnostics
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          database_name: "mock_database",
          schema_name: "public",
        },
      ],
    });

    // Second query: find the user
    queryMock.mockResolvedValueOnce({
      rows: [databaseUser],
    });

    const result = await login({
      email: "test@example.com",
      password: "Password123!",
    });

    expect(result).toEqual({
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      role: "user",
    });

    expect(result).not.toHaveProperty(
      "password_hash"
    );

    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it("rejects login with an incorrect password", async () => {
    const passwordHash = await argon2.hash(
      "CorrectPassword123!",
      {
        type: argon2.argon2id,
      }
    );

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          database_name: "mock_database",
          schema_name: "public",
        },
      ],
    });

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
          role: "user",
          password_hash: passwordHash,
        },
      ],
    });

    await expect(
      login({
        email: "test@example.com",
        password: "WrongPassword123!",
      })
    ).rejects.toThrow(
      "Invalid email or password"
    );
  });

  it("rejects signup with an existing email", async () => {
    queryMock.mockRejectedValueOnce({
      code: "23505",
    });

    await expect(
      signup({
        name: "Test User",
        email: "test@example.com",
        password: "Password123!",
      })
    ).rejects.toThrow(
      "Email already registered"
    );
  });
});
