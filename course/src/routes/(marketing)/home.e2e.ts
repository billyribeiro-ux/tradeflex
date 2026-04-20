import { expect, test } from '@playwright/test';

test('marketing home renders hero and primary CTA', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(
		page
			.locator('a')
			.filter({ hasText: /start|trial|pricing|join/i })
			.first()
	).toBeVisible();
});

test('contact form renders', async ({ page }) => {
	await page.goto('/contact');
	await expect(page.locator('input[name="email"]')).toBeVisible();
	await expect(page.locator('textarea[name="message"]')).toBeVisible();
});
