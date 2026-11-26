import { expect, type Page } from "@playwright/test";

export const DEMO = {
  admin: { email: "admin@wadialghubaitah.test", password: "Admin@12345" },
  staff: { email: "staff@wadialghubaitah.test", password: "Staff@12345" },
  customer: { email: "customer@wadialghubaitah.test", password: "Customer@12345" },
};

export async function login(page: Page, who: { email: string; password: string }, locale = "en") {
  await page.goto(`/${locale}/login`);
  await page.getByLabel(locale === "ar" ? "البريد الإلكتروني" : "Email address").fill(who.email);
  await page.locator('main input[name="password"]').fill(who.password);
  await Promise.all([page.waitForURL((u) => !u.pathname.endsWith("/login")), page.locator("main").getByRole("button", { name: locale === "ar" ? "تسجيل الدخول" : "Sign in" }).click()]);
}

/** Adds a product from its detail page, optionally with a quantity. */
export async function addToCart(page: Page, slug: string, quantity = 1) {
  await page.goto(`/en/product/${slug}`);
  if (quantity > 1) await page.locator("main").getByLabel("Quantity", { exact: true }).fill(String(quantity));
  await page.locator("main").getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText(/added to your cart/)).toBeVisible();
}

export async function payWithCard(page: Page, number: string) {
  await page.getByLabel("Card number").fill(number);
  await page.getByLabel("Name on card").fill("AISHA AL BALUSHI");
  await page.getByLabel("Expiry (MM/YY)").fill("1230");
  await page.getByLabel("Security code (CVC)").fill("123");
  await page.locator("main").getByRole("button", { name: /^Pay OMR/ }).click();
}
