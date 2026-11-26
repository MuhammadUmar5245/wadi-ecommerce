import { expect, test } from "@playwright/test";
import { addToCart, payWithCard } from "./helpers";

/**
 * The core customer journey from the brief:
 * register → add to cart → checkout with the test card → order appears in tracking.
 */
test("a new customer can register, buy with the test card and track the order", async ({ page }) => {
  const email = `e2e.${Date.now()}@example.test`;

  // 1. Register (lands signed in on the account dashboard)
  await page.goto("/en/register");
  await page.getByLabel("Full name").fill("Salma Al Hinai");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Mobile number").fill("9234 5678");
  await page.locator('main input[name="password"]').fill("Secure@2026");
  await page.locator('main input[name="confirmPassword"]').fill("Secure@2026");
  await page.getByLabel(/I agree to the/).check();
  await page.locator("main").getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/en\/account\?welcome=1/);
  await expect(page.getByText("Welcome to Wadi Al Ghubaitah!")).toBeVisible();

  // 2. Add products to the cart
  await addToCart(page, "led-panel-60x60-40w", 2);
  await addToCart(page, "electric-kettle-1-7l");
  await expect(page.locator("header").getByRole("button", { name: "Shopping cart (3)" })).toBeVisible();

  // 3. Checkout: new address, standard delivery, card payment, coupon
  await page.goto("/en/checkout");
  await expect(page.getByRole("heading", { name: "Your order" })).toBeVisible();
  await page.getByLabel("Governorate").selectOption("batinah-north");
  await page.getByLabel("Wilayat").selectOption("Sohar");
  await page.getByLabel("Area / district").fill("Al Hambar");
  await page.getByLabel("Street").fill("Street 12");
  await page.getByLabel("Building / villa no.").fill("Villa 8");
  await page.getByLabel("Coupon code").fill("WELCOME10");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("Coupon WELCOME10 applied.")).toBeVisible();
  await page.getByRole("button", { name: "Continue to payment" }).click();

  // 4. Simulated payment with the success test card
  await expect(page).toHaveURL(/\/checkout\/payment\/WG-\d{5}$/);
  await expect(page.getByText("Test Payment — Demo Mode")).toBeVisible();
  const orderNumber = page.url().match(/WG-\d{5}/)![0];
  await payWithCard(page, "4242 4242 4242 4242");

  await expect(page).toHaveURL(new RegExp(`/checkout/confirmation/${orderNumber}$`));
  await expect(page.getByRole("heading", { name: "Thank you for your order!" })).toBeVisible();
  await expect(page.getByTestId("order-number")).toHaveText(orderNumber);
  await expect(page.getByText("Paid — thank you")).toBeVisible();

  // 5. The order appears in My orders and its tracking timeline
  await page.goto("/en/account/orders");
  await expect(page.getByRole("link", { name: new RegExp(orderNumber) })).toBeVisible();
  await page.getByRole("link", { name: new RegExp(orderNumber) }).click();
  const timeline = page.getByRole("list", { name: "Order progress" });
  await expect(timeline).toBeVisible();
  await expect(timeline.locator('li[aria-current="step"]')).toContainText("Confirmed");
  await expect(page.getByText("•••• 4242")).toBeVisible();
});

test("a declined test card leaves the order unpaid and offers cash on delivery", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email address").fill("customer@wadialghubaitah.test");
  await page.locator('main input[name="password"]').fill("Customer@12345");
  await page.locator("main").getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/account/);

  await addToCart(page, "measuring-tape-8m", 2);
  await page.goto("/en/checkout");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page).toHaveURL(/\/checkout\/payment\/WG-\d{5}$/);
  await payWithCard(page, "4000 0000 0000 0002");
  await expect(page.getByText(/Your card was declined/)).toBeVisible();

  await page.getByRole("button", { name: "Pay with cash on delivery instead" }).click();
  await expect(page.getByText(/due on delivery/)).toBeVisible();
});
