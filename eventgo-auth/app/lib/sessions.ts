
import { pool } from "../../../eventgo-backend/src/db/database";

import {
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
} from "./tokens";

type SessionUser = {
  id: string;
  role: string;
};

// ======================================
// CREATE SESSION
// ======================================

export async function createSession(user: SessionUser) {
  const accessToken = await createAccessToken(user);
  const refreshToken = createRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);

  await pool.query(
    `
    INSERT INTO refresh_tokens (
      user_id,
      token_hash,
      expires_at
    )
    VALUES ($1, $2, NOW() + INTERVAL '7 days')
    `,
    [user.id, tokenHash]
  );

  return {
    accessToken,
    refreshToken,
  };
}

// ======================================
// REFRESH SESSION
// ======================================

export async function refreshSession(
  oldRefreshToken: string
) {
  const oldHash = hashRefreshToken(oldRefreshToken);
  const client = await pool.connect();

  let transactionOpen = false;

  try {
    await client.query("BEGIN");
    transactionOpen = true;

    const result = await client.query<{
      id: string;
      user_id: string;
      role: string;
    }>(
      `
      SELECT rt.id, rt.user_id, u.role
      FROM refresh_tokens rt
      JOIN users u ON u.id = rt.user_id
      WHERE rt.token_hash = $1
        AND rt.revoked_at IS NULL
        AND rt.expires_at > NOW()
      FOR UPDATE OF rt
      `,
      [oldHash]
    );

    const session = result.rows[0];

    if (!session) {
      await client.query("ROLLBACK");
      transactionOpen = false;
      return null;
    }

    const newRefreshToken = createRefreshToken();
    const newHash = hashRefreshToken(newRefreshToken);

    await client.query(
      `
      UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE id = $1
      `,
      [session.id]
    );

    await client.query(
      `
      INSERT INTO refresh_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, NOW() + INTERVAL '7 days')
      `,
      [session.user_id, newHash]
    );

    // Create access token BEFORE COMMIT.
    // If token generation fails, the transaction
    // can still be rolled back.

    const accessToken = await createAccessToken({
      id: session.user_id,
      role: session.role,
    });

    await client.query("COMMIT");
    transactionOpen = false;

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    if (transactionOpen) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Refresh session rollback failed:",
          rollbackError
        );
      }
    }

    throw error;
  } finally {
    client.release();
  }
}

// ======================================
// REVOKE SESSION
// ======================================

export async function revokeSession(
  refreshToken: string
): Promise<void> {
  const tokenHash = hashRefreshToken(refreshToken);

  await pool.query(
    `
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE token_hash = $1
      AND revoked_at IS NULL
    `,
    [tokenHash]
  );
}

// ======================================
// VALIDATE SESSION
// ======================================

export type ValidSession = {
  userId: string;
  role: "user" | "admin";
};

export async function validateSession(
  refreshToken: string
): Promise<ValidSession | null> {
  if (
    typeof refreshToken !== "string" ||
    !refreshToken ||
    refreshToken.length > 512
  ) {
    return null;
  }

  const tokenHash = hashRefreshToken(refreshToken);

  const result = await pool.query<{
    user_id: string;
    role: "user" | "admin";
  }>(
    `
    SELECT rt.user_id, u.role
    FROM refresh_tokens rt
    JOIN users u ON u.id = rt.user_id
    WHERE rt.token_hash = $1
      AND rt.revoked_at IS NULL
      AND rt.expires_at > NOW()
    LIMIT 1
    `,
    [tokenHash]
  );

  const session = result.rows[0];

  if (!session) {
    return null;
  }

  return {
    userId: session.user_id,
    role: session.role,
  };
}
