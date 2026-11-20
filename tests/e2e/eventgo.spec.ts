/// <reference types="node" />

import { randomUUID } from "node:crypto";
import { expect, test, type Request } from "@playwright/test";

test("EventGo - Complete Automatic E2E Journey", async ({ page }) => {
  test.setTimeout(300_000);

  const email = `e2e-${randomUUID()}@example.invalid`;
  const password = `EventGo!${randomUUID()}Aa1`;

  const configuredTitle = process.env.EVENTGO_E2E_EVENT_TITLE?.trim();
  const targetEvent = configuredTitle || "Bittermark \u2014 Cultural Festival";
  const searchTerm =
    process.env.EVENTGO_E2E_EVENT_SEARCH?.trim() ||
    configuredTitle ||
    "Bittermark";

  async function expectCartCount(count: number) {
    const cartLink = page.getByRole("link", {
      name: `Open cart with ${count} tickets`,
      exact: true,
    });

    await expect(cartLink).toBeVisible({ timeout: 30_000 });
  }

  function targetEventCard() {
    return page
      .getByRole("region", { name: "Search results" })
      .locator("article")
      .filter({ hasText: targetEvent })
      .first();
  }

  async function openTargetEvent() {
    const params = new URLSearchParams({
      city: "Dortmund",
      radius: "25",
      q: searchTerm,
    });

    await page.goto(`/explore?${params.toString()}`);
    await expect(page).toHaveURL(/\/explore(?:\?|$)/);

    await expect(
      targetEventCard(),
      `Search for "${searchTerm}" must return the upcoming event "${targetEvent}" within 25 km of Dortmund.`
    ).toBeVisible({ timeout: 15_000 });
  }

  async function addGeneralAdmissionTicket() {
    await targetEventCard()
      .getByRole("button", { name: "View Tickets" })
      .click();

    const dialog = page.getByRole("dialog");

    await expect(
      dialog.getByRole("heading", { name: targetEvent, exact: true })
    ).toBeVisible();

    const generalAdmissionTicket = dialog
      .getByRole("button", { name: /General Admission.*\d+\s+available/i })
      .first();

    await expect(generalAdmissionTicket).toBeEnabled({
      timeout: 30_000,
    });

    await generalAdmissionTicket.click();

    const addButton = dialog.getByRole("button", {
      name: "Add to Cart",
      exact: true,
    });

    await expect(addButton).toBeEnabled({ timeout: 30_000 });
    await addButton.click();

    await expect(
      dialog.getByText("Ticket added to your cart.", { exact: true })
    ).toBeVisible({ timeout: 30_000 });

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expectCartCount(1);
  }

  await test.step("1. Sign Up", async () => {
    await page.goto("/auth/signup");

    await page
      .getByPlaceholder("Enter your full name")
      .fill("EventGo E2E Tester");

    await page.getByPlaceholder("Enter your email").fill(email);
    await page.getByPlaceholder("Create a password").fill(password);
    await page.getByPlaceholder("Repeat your password").fill(password);

    const signupButton = page.getByRole("button", {
      name: "Create Account",
    });

    await expect(signupButton).toBeEnabled();
    await signupButton.click();

    await expect(page).toHaveURL(/\/(?:auth\/)?login(?:\?.*)?$/, {
      timeout: 30_000,
    });
  });

  await test.step("2. Login", async () => {
    await page.goto("/auth/login");

    await page.getByPlaceholder("Enter your email").fill(email);
    await page.getByPlaceholder("Enter your password").fill(password);

    const loginButton = page.locator('form button[type="submit"]');

    await expect(loginButton).toBeEnabled();
    await loginButton.click();

    await expect(page).toHaveURL("http://localhost:3000/", {
      timeout: 30_000,
    });
  });

  await test.step("3. Home", async () => {
    await expect(
      page.getByRole("navigation", { name: "Main navigation" })
    ).toBeVisible({ timeout: 30_000 });

    await expect(page.locator("#popular-events")).toBeVisible({
      timeout: 30_000,
    });

    await expectCartCount(0);
  });

  if (process.env.EVENTGO_CART_ONLY !== "1") {
    await test.step("3.1. Category cache", async () => {
      const cards = page.locator("#categories .shrink-0");
      const firstCard = cards.nth(0);
      const secondCard = cards.nth(1);
      const results = page.locator("#popular-events");

      const categoryIds = new Set([
        "music",
        "sports",
        "technology",
        "food",
        "art",
        "business",
        "nightlife",
        "festivals",
        "cinema",
        "comedy",
        "culture",
        "wellness",
      ]);

      const requestedCategories: string[] = [];

      function readCategory(request: Request): string | undefined {
        if (
          request.method() !== "POST" ||
          !request.headers()["next-action"]
        ) {
          return undefined;
        }

        try {
          const args: unknown = JSON.parse(request.postData() ?? "null");

          if (
            Array.isArray(args) &&
            args.length === 1 &&
            typeof args[0] === "string" &&
            categoryIds.has(args[0])
          ) {
            return args[0];
          }
        } catch {
          return undefined;
        }

        return undefined;
      }

      function trackRequest(request: Request) {
        const category = readCategory(request);

        if (category !== undefined) {
          requestedCategories.push(category);
        }
      }

      await expect(firstCard).toBeVisible();
      await expect(secondCard).toBeVisible();

      page.on("request", trackRequest);

      try {
        const [firstResponse] = await Promise.all([
          page.waitForResponse(
            (response) => readCategory(response.request()) !== undefined,
            { timeout: 30_000 }
          ),
          firstCard.click(),
        ]);

        expect(firstResponse.ok()).toBe(true);

        const firstCategory = readCategory(firstResponse.request());
        const firstLoadedAt = Date.now();

        await expect(results).toBeVisible({ timeout: 30_000 });
        const firstResults = await results.innerText();

        const [secondResponse] = await Promise.all([
          page.waitForResponse(
            (response) => {
              const category = readCategory(response.request());
              return category !== undefined && category !== firstCategory;
            },
            { timeout: 30_000 }
          ),
          secondCard.click(),
        ]);

        expect(secondResponse.ok()).toBe(true);
        await expect(results).toBeVisible({ timeout: 30_000 });

        await firstCard.click();

        await expect(results).toBeVisible();
        await expect.poll(() => results.innerText()).toBe(firstResults);

        // Observe whether returning triggers another category request.
        await page.waitForTimeout(1_000);

        expect(Date.now() - firstLoadedAt).toBeLessThan(60_000);

        expect(
          requestedCategories.filter((category) => category === firstCategory),
          "The first category should be requested only once"
        ).toHaveLength(1);
      } finally {
        page.off("request", trackRequest);
      }
    });
  }

  await test.step("4. Explore Events", async () => {
    await openTargetEvent();
  });

  await test.step("5. Add Ticket to Cart", async () => {
    await addGeneralAdmissionTicket();
  });

  await test.step("6. Shopping Cart", async () => {
    await page.goto("/cart");

    await expect(
      page.getByRole("heading", { name: "Your Cart", exact: true })
    ).toBeVisible({ timeout: 30_000 });

    const cartItem = page
      .locator("article")
      .filter({ hasText: targetEvent })
      .first();

    const quantity = cartItem.locator("span.tabular-nums");

    const increaseButton = cartItem.getByRole("button", {
      name: "Increase quantity",
      exact: true,
    });

    const decreaseButton = cartItem.getByRole("button", {
      name: "Decrease quantity",
      exact: true,
    });

    await expect(cartItem).toBeVisible();
    await expect(quantity).toHaveText("1");
    await expectCartCount(1);

    await expect(
      increaseButton,
      "The test event needs at least two available General Admission tickets"
    ).toBeEnabled({ timeout: 30_000 });

    await increaseButton.click();
    await expect(quantity).toHaveText("2", { timeout: 30_000 });
    await expectCartCount(2);

    await expect(decreaseButton).toBeEnabled();
    await decreaseButton.click();
    await expect(quantity).toHaveText("1", { timeout: 30_000 });
    await expectCartCount(1);
    await expect(decreaseButton).toBeDisabled();

    const removeButton = cartItem.getByRole("button", {
      name: `Remove ${targetEvent}`,
      exact: true,
    });

    await expect(removeButton).toBeEnabled({ timeout: 30_000 });
    await removeButton.click();

    await expect(
      page.getByRole("heading", { name: "Your cart is empty", exact: true })
    ).toBeVisible({ timeout: 30_000 });

    await expect(cartItem).toHaveCount(0);
    await expectCartCount(0);

    await openTargetEvent();
    await addGeneralAdmissionTicket();
    await page.goto("/cart");

    await expect(cartItem).toBeVisible({ timeout: 30_000 });
    await expect(quantity).toHaveText("1");
    await expectCartCount(1);

    const checkoutLink = page.getByRole("link", {
      name: /Proceed to Checkout/i,
    });

    await expect(checkoutLink).toHaveAttribute("aria-disabled", "false", {
      timeout: 30_000,
    });

    await checkoutLink.click();
    await expect(page).toHaveURL(/\/checkout$/, { timeout: 30_000 });
  });

  await test.step("7. Complete Demo Purchase", async () => {
    await expect(
      page.getByRole("heading", { name: "Checkout", exact: true })
    ).toBeVisible({ timeout: 30_000 });

    const confirmButton = page.getByRole("button", {
      name: "Confirm Demo Order",
      exact: true,
    });

    await expect(confirmButton).toBeEnabled({ timeout: 30_000 });
    await confirmButton.click();

    await expect(page).toHaveURL(/\/checkout\/success\?orderId=/, {
      timeout: 45_000,
    });

    await expect(
      page.getByRole("heading", { name: "Demo Order Confirmed!" })
    ).toBeVisible();

    await expectCartCount(0);
  });

  await test.step("8. My Events", async () => {
    await page.goto("/my-events");

    await expect(
      page.getByRole("heading", { name: "My Events", exact: true })
    ).toBeVisible({ timeout: 30_000 });

    await expect(page.getByText(targetEvent).first()).toBeVisible({
      timeout: 30_000,
    });

    const ticketButton = page
      .getByRole("button", { name: /View Group Ticket/i })
      .first();

    await expect(ticketButton).toBeVisible({ timeout: 30_000 });
    await ticketButton.click();

    await expect(page.getByRole("dialog")).toBeVisible();
  });

  await test.step("9. Verify QR Code", async () => {
    const dialog = page.getByRole("dialog");
    const qrImage = dialog.getByRole("img", { name: "Group ticket QR code" });

    await expect(qrImage).toBeVisible({ timeout: 30_000 });
    await expect(qrImage).toHaveAttribute("src", /^data:image\/png;base64,/, {
      timeout: 30_000,
    });

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  await test.step("10. Logout", async () => {
    const logoutButton = page
      .getByRole("button", { name: "Logout", exact: true })
      .first();

    await expect(logoutButton).toBeVisible({ timeout: 30_000 });
    await logoutButton.click();

    await expect(page).toHaveURL(/\/auth\/login(?:\?|$)/, {
      timeout: 30_000,
    });
  });

  await test.step("11. Verify Logout Security", async () => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/auth\/login(?:\?|$)/, {
      timeout: 30_000,
    });
  });
});