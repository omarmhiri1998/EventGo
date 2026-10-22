import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cookies: vi.fn(), fetch: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));

// The requireAdmin module imports '@/lib/auth'. The Vitest project must
// resolve '@' to eventgo-admin/src, just as Next.js does.
import { getSession } from "../../src/lib/auth";
import { requireAdmin } from "../../src/lib/require-admin";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const session = (role: string) => ({ authenticated: true, userId: USER_ID, role });
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  vi.restoreAllMocks();
  mocks.cookies.mockReset();
  mocks.fetch.mockReset();
  vi.stubGlobal("fetch", mocks.fetch);
});
afterEach(() => vi.unstubAllGlobals());

describe("Admin authorization boundary", () => {
  it("rejects visitors without a refresh cookie", async () => {
    mocks.cookies.mockResolvedValue({ get: () => undefined });
    expect(await getSession()).toBeNull();
    await expect(requireAdmin()).rejects.toThrow("Unauthorized: Authentication required");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("rejects regular users", async () => {
    mocks.cookies.mockResolvedValue({ get: () => ({ value: "token" }) });
    mocks.fetch.mockResolvedValue(response(session("user")));
    await expect(requireAdmin()).rejects.toThrow("Forbidden: Admin access required");
  });

  it("accepts admins", async () => {
    mocks.cookies.mockResolvedValue({ get: () => ({ value: "token" }) });
    mocks.fetch.mockResolvedValue(response(session("admin")));
    expect(await requireAdmin()).toEqual(session("admin"));
    expect(mocks.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      method: "GET", cache: "no-store", headers: { Cookie: "eventgo_refresh=token" },
    }));
  });

  it("rejects forged role and malformed sessions", async () => {
    mocks.cookies.mockResolvedValue({ get: () => ({ value: "token" }) });
    mocks.fetch.mockResolvedValue(response(session("superadmin")));
    await expect(requireAdmin()).rejects.toThrow("Unauthorized: Authentication required");
  });

  it("denies expired sessions reported as 401", async () => {
    mocks.cookies.mockResolvedValue({ get: () => ({ value: "expired" }) });
    mocks.fetch.mockResolvedValue(response({}, 401));
    await expect(requireAdmin()).rejects.toThrow("Unauthorized: Authentication required");
  });

  it("does not grant access when auth backend errors", async () => {
    mocks.cookies.mockResolvedValue({ get: () => ({ value: "token" }) });
    mocks.fetch.mockResolvedValue(response({}, 500));
    await expect(requireAdmin()).rejects.toThrow("Authentication service unavailable");
  });
});
