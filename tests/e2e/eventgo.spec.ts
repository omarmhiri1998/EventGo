
import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("EventGo - Complete Automatic E2E Journey", async ({
  page,
}) => {
  test.setTimeout(300_000);

  const id = randomUUID();

  const name = "EventGo E2E Tester";
  const email = `e2e-${id}@example.invalid`;
  const password = `EventGo!${randomUUID()}Aa1`;

  const targetEvent = "Bittermark — Live Music Night";

  // ==========================================
  // 1. SIGN UP
  // ==========================================

  await test.step("1. Sign Up", async () => {
    await page.goto("/auth/signup");

    await page
      .getByPlaceholder("Enter your full name")
      .fill(name);

    await page
      .getByPlaceholder("Enter your email")
      .fill(email);

    await page
      .getByPlaceholder("Create a password")
      .fill(password);

    await page
      .getByPlaceholder("Repeat your password")
      .fill(password);

    const signupButton = page.getByRole("button", {
      name: "Create Account",
    });

    await expect(signupButton).toBeEnabled();

    await signupButton.click();

    await expect(page).toHaveURL(
      /\/(?:auth\/)?login(?:\?.*)?$/,
      { timeout: 30000 }
    );

    console.log("SIGN UP: SUCCESS");
  });

  // ==========================================
  // 2. LOGIN
  // ==========================================

  await test.step("2. Login", async () => {
    await page.goto("/auth/login");

    await page
      .getByPlaceholder("Enter your email")
      .fill(email);

    await page
      .getByPlaceholder("Enter your password")
      .fill(password);

    const loginButton = page.locator(
      'form button[type="submit"]'
    );

    await expect(loginButton).toBeEnabled();

    await loginButton.click();

    await expect(page).toHaveURL(
      "http://localhost:3000/",
      { timeout: 30000 }
    );

    console.log("LOGIN: SUCCESS");
  });

  // ==========================================
  // 3. HOME
  // ==========================================

  await test.step("3. Home", async () => {
    await expect(
      page.getByRole("navigation", {
        name: "Main navigation",
      })
    ).toBeVisible({
      timeout: 30000,
    });

    console.log("HOME: SUCCESS");
  });

  // ==========================================
  // 4. EXPLORE
  // ==========================================

  await test.step("4. Explore Events", async () => {
    // Search for the event by name.
    // This avoids relying on the order
    // of the first 20 search results.
    const params = new URLSearchParams({
      city: "Dortmund",
      radius: "25",
      q: targetEvent,
    });

    await page.goto(`/explore?${params.toString()}`);

    await expect(page).toHaveURL(/\/explore/);

    const eventCard = page
      .locator("article")
      .filter({
        hasText: targetEvent,
      })
      .first();

    await expect(eventCard).toBeVisible({
      timeout: 45000,
    });

    console.log("EXPLORE: SUCCESS");
  });

  // ==========================================
  // 5. ADD TICKET TO CART
  // ==========================================

  await test.step("5. Add Ticket to Cart", async () => {
    const eventCard = page
      .locator("article")
      .filter({
        hasText: targetEvent,
      })
      .first();

    await expect(eventCard).toBeVisible();

    const viewTicketsButton = eventCard.getByRole(
      "button",
      {
        name: "View Tickets",
      }
    );

    await expect(viewTicketsButton).toBeEnabled();

    await viewTicketsButton.click();

    const dialog = page.getByRole("dialog");

    await expect(dialog).toBeVisible();

    await expect(
      dialog.getByRole("heading", {
        name: targetEvent,
      })
    ).toBeVisible();

    // Wait for the ticket request to finish.
    await expect(
      dialog.getByText("Loading tickets...")
    ).toHaveCount(0, {
      timeout: 30000,
    });

    // Confirm that the Standard ticket exists.
    const standardTicket = dialog
      .getByRole("button", {
        name: /Standard.*available/i,
      })
      .first();

    await expect(standardTicket).toBeVisible({
      timeout: 30000,
    });

    await expect(standardTicket).toBeEnabled();

    // Select the Standard ticket explicitly.
    await standardTicket.click();

    const addButton = dialog.getByRole("button", {
      name: "Add to Cart",
      exact: true,
    });

    await expect(addButton).toBeEnabled({
      timeout: 30000,
    });

    await addButton.click();

    await expect(
      dialog.getByText("Ticket added to your cart.")
    ).toBeVisible({
      timeout: 30000,
    });

    console.log("TICKET ADDED TO CART: SUCCESS");
  });

  // ==========================================
  // 6. SHOPPING CART
  // ==========================================

  await test.step("6. Shopping Cart", async () => {
    await page.goto("/cart");

    await expect(
      page.getByRole("heading", {
        name: "Your Cart",
        exact: true,
      })
    ).toBeVisible({
      timeout: 30000,
    });

    await expect(
      page.getByRole("heading", {
        name: "Your cart is empty",
        exact: true,
      })
    ).toHaveCount(0);

    await expect(
      page.getByText(targetEvent).first()
    ).toBeVisible();

    const checkoutLink = page.getByRole("link", {
      name: /Proceed to Checkout/i,
    });

    await expect(checkoutLink).toBeVisible();

    await expect(checkoutLink).not.toHaveAttribute(
      "aria-disabled",
      "true"
    );

    await checkoutLink.click();

    await expect(page).toHaveURL(
      /\/checkout$/,
      { timeout: 30000 }
    );

    console.log("CART: SUCCESS");
  });

  // ==========================================
  // 7. DEMO CHECKOUT
  // ==========================================

  await test.step("7. Complete Demo Purchase", async () => {
    await expect(
      page.getByRole("heading", {
        name: "Checkout",
        exact: true,
      })
    ).toBeVisible({
      timeout: 30000,
    });

    const confirmButton = page.getByRole("button", {
      name: "Confirm Demo Order",
    });

    await expect(confirmButton).toBeEnabled({
      timeout: 30000,
    });

    await confirmButton.click();

    await expect(page).toHaveURL(
      /\/checkout\/success\?orderId=/,
      { timeout: 45000 }
    );

    await expect(
      page.getByRole("heading", {
        name: "Demo Order Confirmed!",
      })
    ).toBeVisible();

    console.log("DEMO PURCHASE: SUCCESS");
  });

  // ==========================================
  // 8. MY EVENTS
  // ==========================================

  await test.step("8. My Events", async () => {
    await page.goto("/my-events");

    await expect(
      page.getByRole("heading", {
        name: "My Events",
        exact: true,
      })
    ).toBeVisible({
      timeout: 30000,
    });

    await expect(
      page.getByText(targetEvent).first()
    ).toBeVisible({
      timeout: 30000,
    });

    const ticketButton = page
      .getByRole("button", {
        name: /View Group Ticket/i,
      })
      .first();

    await expect(ticketButton).toBeVisible({
      timeout: 30000,
    });

    await ticketButton.click();

    await expect(
      page.getByRole("dialog")
    ).toBeVisible();

    console.log("MY EVENTS: SUCCESS");
  });

  // ==========================================
  // 9. VERIFY QR CODE
  // ==========================================

  await test.step("9. Verify QR Code", async () => {
    const dialog = page.getByRole("dialog");

    const qrImage = dialog.getByRole("img", {
      name: "Group ticket QR code",
    });

    await expect(qrImage).toBeVisible({
      timeout: 30000,
    });

    await expect(qrImage).toHaveAttribute(
      "src",
      /^data:image\/png;base64,/,
      { timeout: 30000 }
    );

    console.log("QR CODE: SUCCESS");

    await page.keyboard.press("Escape");

    await expect(dialog).not.toBeVisible();
  });

  // ==========================================
  // 10. LOGOUT
  // ==========================================

  await test.step("10. Logout", async () => {
    const logoutButton = page.getByRole("button", {
      name: "Logout",
      exact: true,
    });

    await expect(logoutButton.first()).toBeVisible({
      timeout: 30000,
    });

    await logoutButton.first().click();

    await expect(page).toHaveURL(
      /\/auth\/login(?:\?|$)/,
      { timeout: 30000 }
    );

    console.log("LOGOUT: SUCCESS");
  });

  // ==========================================
  // 11. VERIFY SECURITY AFTER LOGOUT
  // ==========================================

  await test.step("11. Verify Logout Security", async () => {
    await page.goto("/");

    await expect(page).toHaveURL(
      /\/auth\/login(?:\?|$)/,
      { timeout: 30000 }
    );

    console.log(
      "ALL EVENTGO E2E STEPS COMPLETED SUCCESSFULLY"
    );
  });
});
