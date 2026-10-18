
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type LoginResponse = {
    message?: string;
    user?: {
        id: string;
        name: string | null;
        email: string;
        role: "user" | "admin";
    };
    accessToken?: string;
};

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (loading) return;

        setError("");
        setLoading(true);

        try {
            const response = await fetch("/auth/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "same-origin",
                cache: "no-store",
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                }),
            });

            const data: LoginResponse = await response.json();

            if (!response.ok) {
                setError(data.message || "Login failed");
                return;
            }

            if (!data.user || !data.accessToken) {
                setError("Invalid server response");
                return;
            }

            // The refresh token is stored in an HttpOnly Cookie.
            // Never store access or refresh tokens in localStorage.

            const adminUrl =
                process.env.NEXT_PUBLIC_ADMIN_URL ??
                "http://localhost:3001";

            const appUrl =
                process.env.NEXT_PUBLIC_APP_URL ??
                "http://localhost:3000";

            if (data.user.role === "admin") {
                window.location.replace(adminUrl);
            } else if (data.user.role === "user") {
                window.location.replace(appUrl);
            } else {
                setError("Unknown user role");
            }
        } catch {
            setError("Unable to connect to the server");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="relative min-h-dvh overflow-hidden bg-[#261510] text-white">
            {/* Background */}
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
            <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-16">
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

            {/* Login container */}
            <div className="relative z-10 flex min-h-[calc(100dvh-100px)] items-center justify-center px-5 py-8">
                <section
                    className="
            login-entrance
            w-full max-w-[580px]
            rounded-[30px]
            border border-white/30
            bg-[#2b1714]/30
            p-8 md:p-12
            shadow-2xl
            backdrop-blur-md
          "
                >
                    {/* Title */}
                    <div className="mb-9">
                        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                            Welcome{" "}
                            <span className="text-orange-400">
                                Back
                            </span>
                        </h1>

                        <p className="mt-4 text-base leading-relaxed text-white/90">
                            Log in to your EventGo account and continue
                            your event journey.
                        </p>
                    </div>

                    {/* Login form */}
                    <form onSubmit={handleSubmit} className="space-y-7">
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
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                className="
                  w-full rounded-xl
                  border border-white/30
                  bg-black/25
                  px-5 py-4
                  text-white
                  outline-none
                  transition
                  placeholder:text-white/70
                  focus:border-orange-400
                  focus:bg-black/35
                "
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
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    className="
                    w-full rounded-xl
                    border border-white/30
                    bg-black/25
                    px-5 py-4 pr-20
                    text-white
                    outline-none
                    transition
                    placeholder:text-white/70
                    focus:border-orange-400
                    focus:bg-black/35
                  "
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
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

                        {/* Remember / Forgot */}
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    disabled={loading}
                                    className="h-4 w-4 accent-orange-500"
                                />
                                Remember me
                            </label>

                            <Link
                                href="/forgot-password"
                                className="text-orange-300 transition hover:text-orange-200"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Error */}
                        {error && (
                            <p
                                role="alert"
                                className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                            >
                                {error}
                            </p>
                        )}

                        {/* Login button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="
                group flex w-full items-center justify-center gap-3
                rounded-xl
                bg-gradient-to-r from-orange-400 to-orange-600
                px-5 py-4 text-lg font-semibold
                shadow-lg shadow-orange-500/20
                transition duration-300
                hover:-translate-y-1
                hover:shadow-orange-500/40
                disabled:cursor-not-allowed
                disabled:opacity-60
                disabled:hover:translate-y-0
              "
                        >
                            {loading ? "Logging in..." : "Log In"}

                            {!loading && (
                                <span className="transition-transform group-hover:translate-x-2">
                                    →
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Signup */}
                    <p className="mt-9 text-center text-sm text-white/90">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="font-semibold text-orange-300 transition hover:text-orange-200"
                        >
                            Sign Up
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}
