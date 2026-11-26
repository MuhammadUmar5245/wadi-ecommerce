import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { addToCart, DEMO, login } from "./helpers";

/**
 * Captures the documentation screenshots into docs/screenshots/.
 * Run with: npm run screenshots   (after `npm run seed` for consistent data)
 */
const DIR = "docs/screenshots";
mkdirSync(DIR, { recursive: true });

async function shot(page: Page, name: string, fullPage = true) {
  await page.waitForLoadState("networkidle");
  // Make lazy images load before a full-page capture.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage });
}

test.describe.configure({ mode: "serial" });

test("storefront", async ({ page }) => {
  await page.goto("/en");
  await shot(page, "01-home-en");
  await page.goto("/ar");
  await shot(page, "02-home-ar");
  await page.goto("/en/shop");
  await shot(page, "03-shop");
  await page.goto("/en/product/falaj-split-ac-1-5-ton");
  await shot(page, "04-product");
});

test("customer journey", async ({ page }) => {
  await login(page, DEMO.customer);
  await addToCart(page, "rain-shower-set");
  await addToCart(page, "led-panel-60x60-40w", 2);
  await page.goto("/en/cart");
  await expect(page.getByRole("heading", { name: "Order summary" })).toBeVisible();
  await shot(page, "05-cart");

  await page.goto("/en/checkout");
  await expect(page.getByRole("heading", { name: "Your order" })).toBeVisible();
  await shot(page, "06-checkout");

  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page.getByText("Test Payment — Demo Mode")).toBeVisible();
  await page.getByLabel("Card number").fill("4242 4242 4242 4242");
  await page.getByLabel("Name on card").fill("AISHA AL BALUSHI");
  await page.getByLabel("Expiry (MM/YY)").fill("12/30");
  await page.getByLabel("Security code (CVC)").fill("123");
  await shot(page, "07-payment");

  await page.locator("main").getByRole("button", { name: /^Pay OMR/ }).click();
  await expect(page.getByRole("heading", { name: "Thank you for your order!" })).toBeVisible();
  const orderNumber = (await page.getByTestId("order-number").textContent())!.trim();

  await page.goto(`/en/account/orders/${orderNumber}`);
  await shot(page, "08-order-tracking");
  await page.goto("/en/account");
  await shot(page, "09-customer-dashboard");
});

test("admin and reports", async ({ page }) => {
  await login(page, DEMO.admin);
  await page.goto("/en/admin");
  await shot(page, "10-admin-dashboard");
  const reports = ["sales", "inventory", "customer-orders", "payments", "delivery"];
  for (const [i, r] of reports.entries()) {
    await page.goto(`/en/admin/reports/${r}`);
    await shot(page, `${11 + i}-report-${r}`);
  }
});
