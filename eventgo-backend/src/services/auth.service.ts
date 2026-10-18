import argon2 from "argon2";
import { pool } from "../db/database";

type SignupInput = {
  name: string;
  email: string;
  password: string;
};

type PublicUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export async function signup({
  name,
  email,
  password,
}: SignupInput): Promise<PublicUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  if (normalizedName.length < 2) {
    throw new Error("Name must contain at least 2 characters");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Invalid email address");
  }

  if (password.length < 8) {
    throw new Error("Password must contain at least 8 characters");
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  try {
    const result = await pool.query<PublicUser>(
      `
      INSERT INTO users (
        name,
        email,
        password_hash,
        role
      )
      VALUES ($1, $2, $3, 'user')
      RETURNING id, name, email, role
      `,
      [normalizedName, normalizedEmail, passwordHash]
    );

    return result.rows[0];
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new Error("Email already registered");
    }

    throw error;
  }
}

type LoginInput = {
  email: string;
  password: string;
};

type AuthUser = PublicUser & {
  password_hash: string;
};

export async function login({
  email,
  password,
}: LoginInput): Promise<PublicUser> {
  const normalizedEmail = email.trim().toLowerCase();

  // Temporary diagnostic: remove after identifying the connection.
  const dbInfo = await pool.query(`
    SELECT
      current_database() AS database_name,
      current_schema() AS schema_name,
      current_user AS database_user,
      inet_server_addr()::text AS server_address,
      inet_server_port() AS server_port
  `);

  console.log("AUTH DATABASE:", dbInfo.rows[0]);

  const result = await pool.query<AuthUser>(
    `
    SELECT id, name, email, role, password_hash
    FROM users
    WHERE email = $1
    `,
    [normalizedEmail]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const validPassword = await argon2.verify(
    user.password_hash,
    password
  );

  if (!validPassword) {
    throw new Error("Invalid email or password");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}