
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  getAdminCities,
} from "../../src/services/city.service";

// ======================================
// DATABASE MOCK
// ======================================

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
}));

vi.mock("../../src/db/database", () => ({
  pool: {
    query: mocks.query,
  },
}));

// ======================================
// TEST DATA
// ======================================

const cityRow = {
  id: 12345,
  name: "Dortmund",
  country_code: "DE",
  latitude: "51.5136",
  longitude: "7.4653",
};

function mockCitiesResults(
  rows: Array<typeof cityRow> = [cityRow],
  total = "1"
) {
  mocks.query
    .mockResolvedValueOnce({
      rows,
    })
    .mockResolvedValueOnce({
      rows: [{ total }],
    });
}

// ======================================
// SETUP
// ======================================

beforeEach(() => {
  vi.resetAllMocks();
});

// ======================================
// GET ADMIN CITIES
// ======================================

describe("getAdminCities", () => {
  it("returns mapped cities", async () => {
    mockCitiesResults();

    const result = await getAdminCities();

    expect(result).toEqual({
      cities: [
        {
          id: "12345",
          name: "Dortmund",
          countryCode: "DE",
          latitude: 51.5136,
          longitude: 7.4653,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
  });

  it("returns an empty list when no cities exist", async () => {
    mockCitiesResults([], "0");

    const result = await getAdminCities();

    expect(result).toEqual({
      cities: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });
  });

  it("converts latitude and longitude to numbers", async () => {
    mockCitiesResults();

    const result = await getAdminCities();

    expect(result.cities[0].latitude).toBe(51.5136);
    expect(result.cities[0].longitude).toBe(7.4653);

    expect(
      typeof result.cities[0].latitude
    ).toBe("number");
  });

  it("calculates pagination correctly", async () => {
    mockCitiesResults([cityRow], "45");

    const result = await getAdminCities(2);

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(20);
    expect(result.total).toBe(45);
    expect(result.totalPages).toBe(3);

    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("LIMIT $3 OFFSET $4"),
      ["", "%%", 20, 20]
    );
  });

  it("uses the correct offset for page 3", async () => {
    mockCitiesResults();

    await getAdminCities(3);

    expect(mocks.query).toHaveBeenCalledWith(
      expect.any(String),
      ["", "%%", 20, 40]
    );
  });

  it.each([
    0,
    -1,
    1.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ])("rejects invalid page %s", async page => {
    await expect(
      getAdminCities(page)
    ).rejects.toThrow("Invalid page.");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("rejects pagination offset overflow", async () => {
    await expect(
      getAdminCities(Number.MAX_SAFE_INTEGER)
    ).rejects.toThrow("Invalid page.");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("trims search input", async () => {
    mockCitiesResults();

    await getAdminCities(1, "  Dortmund  ");

    expect(mocks.query).toHaveBeenCalledWith(
      expect.any(String),
      ["Dortmund", "%Dortmund%", 20, 0]
    );

    expect(mocks.query).toHaveBeenCalledWith(
      expect.any(String),
      ["Dortmund", "%Dortmund%"]
    );
  });

  it("rejects search longer than 200 characters", async () => {
    await expect(
      getAdminCities(1, "x".repeat(201))
    ).rejects.toThrow("Search is too long.");

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("accepts a search of exactly 200 characters", async () => {
    mockCitiesResults();

    await getAdminCities(1, "x".repeat(200));

    expect(mocks.query).toHaveBeenCalledTimes(2);
  });

  it("searches city name and country code", async () => {
    mockCitiesResults();

    await getAdminCities(1, "DE");

    const [sql] = mocks.query.mock.calls[0];

    expect(sql).toContain("name ILIKE $2");
    expect(sql).toContain("country_code ILIKE $2");
  });

  it("uses parameterized SQL queries", async () => {
    mockCitiesResults();

    const search = "' OR 1=1 --";

    await getAdminCities(1, search);

    expect(mocks.query).toHaveBeenCalledWith(
      expect.any(String),
      [search, `%${search}%`, 20, 0]
    );

    const [sql] = mocks.query.mock.calls[0];

    expect(sql).not.toContain(search);
  });

  it("sorts results consistently", async () => {
    mockCitiesResults();

    await getAdminCities();

    const [sql] = mocks.query.mock.calls[0];

    expect(sql).toContain(
      "ORDER BY name ASC, country_code ASC, id ASC"
    );
  });

  it("propagates database errors", async () => {
    mocks.query.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      getAdminCities()
    ).rejects.toThrow("Database unavailable");
  });
});
