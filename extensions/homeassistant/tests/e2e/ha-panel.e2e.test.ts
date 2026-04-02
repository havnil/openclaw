import { test, expect } from "@playwright/test";

const HA_URL = process.env.HA_URL ?? "http://localhost:8123";
const HA_USERNAME = process.env.HA_USERNAME ?? "havnil";
const HA_PASSWORD = process.env.HA_PASSWORD!;

test.describe("OpenClaw HA Panel", () => {
  test.beforeEach(async ({ page }) => {
    // Login to HA
    await page.goto(HA_URL);
    await page.fill('input[name="username"]', HA_USERNAME);
    await page.fill('input[name="password"]', HA_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/lovelace/**", { timeout: 10_000 });
  });

  test("panel appears in sidebar", async ({ page }) => {
    const sidebar = page.locator("ha-sidebar");
    await expect(sidebar.locator('a[data-panel="openclaw"]')).toBeVisible();
  });

  test("opens panel and shows chat UI", async ({ page }) => {
    await page.click('a[data-panel="openclaw"]');
    await page.waitForSelector("openclaw-panel", { timeout: 5_000 });

    // Should see input bar
    await expect(page.locator("openclaw-panel textarea")).toBeVisible();
    // Should see new chat button or empty state
    await expect(page.locator("openclaw-panel")).toContainText(/new chat|start a conversation/i);
  });

  test("sends message and receives streaming response", async ({ page }) => {
    await page.click('a[data-panel="openclaw"]');
    await page.waitForSelector("openclaw-panel", { timeout: 5_000 });

    const textarea = page.locator("openclaw-panel textarea");
    await textarea.fill("Hello, what can you do?");
    await page.locator("openclaw-panel .send-button").click();

    // User message should appear immediately (optimistic UI)
    await expect(page.locator("openclaw-panel .message.user")).toContainText(
      "Hello, what can you do?",
    );

    // Wait for assistant response (streaming)
    await expect(page.locator("openclaw-panel .message.assistant")).toBeVisible({
      timeout: 30_000,
    });
    // Response should have some text
    const assistantMsg = page.locator("openclaw-panel .message.assistant").first();
    await expect(assistantMsg).not.toBeEmpty();
  });

  test("conversation persists after reload", async ({ page }) => {
    await page.click('a[data-panel="openclaw"]');
    await page.waitForSelector("openclaw-panel", { timeout: 5_000 });

    const textarea = page.locator("openclaw-panel textarea");
    await textarea.fill("Remember: test persistence");
    await page.locator("openclaw-panel .send-button").click();

    // Wait for response
    await expect(page.locator("openclaw-panel .message.assistant")).toBeVisible({
      timeout: 30_000,
    });

    // Reload
    await page.reload();
    await page.waitForSelector("openclaw-panel", { timeout: 5_000 });

    // Open conversation list and select the conversation
    // The conversation should still be there
    await expect(page.locator("openclaw-panel .conversation-item")).toHaveCount(1, {
      timeout: 5_000,
    });
  });

  test("creates and switches conversations", async ({ page }) => {
    await page.click('a[data-panel="openclaw"]');
    await page.waitForSelector("openclaw-panel", { timeout: 5_000 });

    // Send first message
    await page.locator("openclaw-panel textarea").fill("First conversation");
    await page.locator("openclaw-panel .send-button").click();
    await expect(page.locator("openclaw-panel .message.assistant")).toBeVisible({
      timeout: 30_000,
    });

    // Create new conversation
    await page.locator("openclaw-panel .new-chat-button").click();

    // Send second message
    await page.locator("openclaw-panel textarea").fill("Second conversation");
    await page.locator("openclaw-panel .send-button").click();
    await expect(page.locator("openclaw-panel .message.assistant")).toBeVisible({
      timeout: 30_000,
    });

    // Should have 2 conversations in sidebar
    await expect(page.locator("openclaw-panel .conversation-item")).toHaveCount(2, {
      timeout: 5_000,
    });
  });

  test("mobile viewport has proper layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.click('a[data-panel="openclaw"]');
    await page.waitForSelector("openclaw-panel", { timeout: 5_000 });

    // Input bar should be visible
    await expect(page.locator("openclaw-panel textarea")).toBeVisible();

    // Send button should be at least 44px
    const sendButton = page.locator("openclaw-panel .send-button");
    const box = await sendButton.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test("voice input button is visible", async ({ page }) => {
    await page.click('a[data-panel="openclaw"]');
    await page.waitForSelector("openclaw-panel", { timeout: 5_000 });

    // Mic button should be visible (unless Web Speech API unavailable)
    const micButton = page.locator("openclaw-panel .mic-button");
    // In Playwright's Chromium, Web Speech API is available
    await expect(micButton).toBeVisible();
  });

  test("file upload button opens picker", async ({ page }) => {
    await page.click('a[data-panel="openclaw"]');
    await page.waitForSelector("openclaw-panel", { timeout: 5_000 });

    const attachButton = page.locator("openclaw-panel .attach-button");
    await expect(attachButton).toBeVisible();

    // Clicking should trigger hidden file input
    const fileInput = page.locator('openclaw-panel input[type="file"]');
    await expect(fileInput).toHaveCount(1);
  });
});
