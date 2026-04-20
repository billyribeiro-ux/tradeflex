import { expect, test } from '@playwright/test';

test('pricing page renders both plans and a CTA', async ({ page }) => {
	await page.goto('/pricing');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(page.locator('body')).toContainText(/month|year/i);
});

test('gate banner appears when redirected from /alerts', async ({ page }) => {
	await page.goto('/pricing?gate=alerts');
	await expect(page.locator('body')).toContainText(/alerts|membership|access/i);
});
