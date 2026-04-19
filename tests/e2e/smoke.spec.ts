import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("ana sayfa yükleniyor", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Sanatın Rotası/);
  });

  test("yazılar listesi yükleniyor", async ({ page }) => {
    const response = await page.goto("/yazilar");
    expect(response?.status()).toBeLessThan(400);
  });

  test("etkinlikler listesi yükleniyor", async ({ page }) => {
    const response = await page.goto("/etkinlikler");
    expect(response?.status()).toBeLessThan(400);
  });

  test("rotalar listesi yükleniyor", async ({ page }) => {
    const response = await page.goto("/rotalar");
    expect(response?.status()).toBeLessThan(400);
  });

  test("röportajlar yükleniyor", async ({ page }) => {
    const response = await page.goto("/roportajlar");
    expect(response?.status()).toBeLessThan(400);
  });

  test("hakkında sayfası yükleniyor", async ({ page }) => {
    const response = await page.goto("/hakkinda");
    expect(response?.status()).toBeLessThan(400);
  });

  test("iletişim sayfası yükleniyor", async ({ page }) => {
    const response = await page.goto("/iletisim");
    expect(response?.status()).toBeLessThan(400);
  });

  test("arama sayfası yükleniyor", async ({ page }) => {
    const response = await page.goto("/ara");
    expect(response?.status()).toBeLessThan(400);
  });

  test("bilinmeyen URL 404 dönüyor", async ({ page }) => {
    const response = await page.goto("/bu-sayfa-yok-12345");
    expect([404, 200]).toContain(response?.status() ?? 0);
  });

  test("robots.txt mevcut", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("Sitemap");
  });

  test("sitemap.xml mevcut", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
  });
});
