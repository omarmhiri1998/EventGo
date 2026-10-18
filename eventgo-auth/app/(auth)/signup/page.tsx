
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SignupResponse = {
  message?: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string;
  };
};

export default function SignupPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setError("");

    if (name.trim().length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/auth/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        console.error(
          "Signup API returned non-JSON response",
          {
            status: response.status,
            contentType,
          }
        );

        setError(
          `Signup API error (HTTP ${response.status}).`
        );
        return;
      }

      const data: SignupResponse = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            `Account creation failed (HTTP ${response.status}).`
        );
        return;
      }

      if (!data.user?.id) {
        setError("Invalid response from the server.");
        return;
      }

      // Account created successfully.
      // The user can now log in.
      router.push("/login");
    } catch (err) {
      console.error("Signup request failed:", err);

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = `
    w-full rounded-xl
    border border-white/30
    bg-black/25
    px-5 py-3.5
    text-white
    outline-none
    transition
    placeholder:text-white/60
    focus:border-orange-400
    focus:bg-black/35
  `;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#261510] text-white">
      {/* Background images */}
      <picture>
        <source
          media="(max-width: 767px)"
          srcSet="/auth/images/login-mobile.png"
        />
        <img
          src="/auth/images/login-desktop.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>

      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-16">
        <Link
          href="/login"
          className="text-3xl font-extrabold tracking-tight"
        >
          Event<span className="text-orange-500">Go</span>
        </Link>

        <span className="hidden text-sm text-white/80 md:block">
          Discover • Attend • Create Memories
        </span>
      </header>

      {/* Signup container */}
      <div className="relative z-10 flex min-h-[calc(100dvh-85px)] items-center justify-center px-5 py-8">
        {/* Glass card */}
        <section
          className="
            login-entrance
            w-full max-w-[580px]
            rounded-[30px]
            border border-white/30
            bg-[#2b1714]/30
            p-7 md:p-10
            shadow-2xl
            backdrop-blur-md
          "
        >
          {/* Heading */}
          <div className="mb-7 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/15 px-4 py-2 text-xs font-medium text-orange-200">
              ✨ Your next adventure starts here
            </div>

            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Join{" "}
              <span className="text-orange-400">
                EventGo
              </span>
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-white/85 md:text-base">
              Create your account and discover unforgettable
              events near you.
            </p>
          </div>

          {/* Signup Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium"
              >
                Full name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                minLength={2}
                required
                disabled={loading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputStyle}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputStyle}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className={`${inputStyle} pr-20`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-orange-300 hover:text-orange-200"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium"
              >
                Confirm password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  className={`${inputStyle} pr-20`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmation"
                      : "Show confirmation"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-orange-300 hover:text-orange-200"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Password guidance */}
            <p className="text-xs text-white/70">
              Use at least 8 characters for your password.
            </p>

            {/* Error message */}
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-400/40 bg-red-950/60 px-4 py-3 text-sm text-red-100"
              >
                {error}
              </p>
            )}

            {/* Signup button */}
            <button
              type="submit"
              disabled={loading}
              className="
                group flex w-full
                items-center justify-center gap-3
                rounded-xl
                bg-gradient-to-r
                from-orange-400 to-orange-600
                px-5 py-4
                text-lg font-semibold
                shadow-lg shadow-orange-500/20
                transition duration-300
                hover:-translate-y-1
                hover:shadow-orange-500/40
                disabled:cursor-not-allowed
                disabled:opacity-60
                disabled:hover:translate-y-0
              "
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}

              {!loading && (
                <span className="transition-transform group-hover:translate-x-2">
                  →
                </span>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-7 text-center text-sm text-white/90">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-orange-300 transition hover:text-orange-200"
            >
              Log In
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
