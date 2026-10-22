import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cookies: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));

import { getSession, requireAuth } from "../../app/lib/auth";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const validAdmin = { authenticated: true, userId: USER_ID, role: "admin" };
const request = (cookie?: string) => new Request("http://localhost:3002/test", {
  headers: cookie ? { cookie } : {},
});
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  vi.restoreAllMocks();
  mocks.cookies.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

describe("Auth server boundary", () => {
  it("denies requests without cookies without contacting auth service", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await requireAuth(request())).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when the auth service responds 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ error: "Unauthorized" }, 401)));
    expect(await requireAuth(request("eventgo_refresh=bad"))).toBeNull();
  });

  it("accepts an authenticated admin and forwards the request cookie", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(validAdmin));
    vi.stubGlobal("fetch", fetchMock);
    expect(await requireAuth(request("eventgo_refresh=abc"))).toEqual(validAdmin);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      method: "GET", cache: "no-store", headers: { Cookie: "eventgo_refresh=abc" },
    }));
  });

  it.each([
    null, {}, { authenticated: false, userId: USER_ID, role: "admin" },
    { authenticated: true, userId: 42, role: "admin" },
    { authenticated: true, userId: USER_ID, role: "superadmin" },
    { authenticated: true, userId: USER_ID },
  ])("rejects malformed session payload %j", async (payload) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(payload)));
    expect(await requireAuth(request("eventgo_refresh=abc"))).toBeNull();
  });

  it("does not treat an auth-service error as an anonymous user", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({}, 503)));
    await expect(requireAuth(request("eventgo_refresh=abc"))).rejects.toThrow("Authentication service unavailable");
  });

  it("fails closed on network errors", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    await expect(requireAuth(request("eventgo_refresh=abc"))).rejects.toThrow("Authentication service unavailable");
    errorSpy.mockRestore();
  });

  it("getSession does not fetch without refresh cookie", async () => {
    mocks.cookies.mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await getSession()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("getSession safely encodes the refresh cookie", async () => {
    mocks.cookies.mockResolvedValue({ get: vi.fn().mockReturnValue({ value: "a;b=c" }) });
    const fetchMock = vi.fn().mockResolvedValue(response(validAdmin));
    vi.stubGlobal("fetch", fetchMock);
    expect(await getSession()).toEqual(validAdmin);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      headers: { Cookie: "eventgo_refresh=a%3Bb%3Dc" },
    }));
  });
});
