const { test, expect } = require('@playwright/test');
const path = require('path');

test('preview account opens the app dashboard', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  page.on('dialog', (dialog) => dialog.accept());

  await page.goto('http://127.0.0.1:8090');
  await page.getByText('Preview Account').click();
  await expect(page.getByText("Today's shortlist")).toBeVisible();
  await expect(page.getByText('Quick Actions')).toBeVisible();

  await page.getByText('Discover jobs').click();
  await expect(page.getByText('Your job deck')).toBeVisible();
  await expect(page.getByText('Product Designer').first()).toBeVisible();
  await page.getByLabel('Save job').click();
  await expect(page.getByText('Frontend Engineer').first()).toBeVisible();
  await page.getByLabel('Apply job').click();
  await expect(page.getByText('Senior Product Manager').first()).toBeVisible();

  await page.getByRole('tab', { name: 'Home' }).click();
  await expect(page.getByText('4 roles are ready for review')).toBeVisible();

  await page.getByText('Improve resume').click();
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByText('Select Resume').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(path.join(__dirname, 'fixtures', 'ada-resume.txt'));
  await expect(page.getByText('Parsed Information')).toBeVisible();
  await expect(page.getByText('Ada Lovelace')).toBeVisible();
  await expect(page.getByText('ada@example.com')).toBeVisible();
  await expect(page.getByText('React Native', { exact: true })).toBeVisible();
  await page.getByText('Save Resume').click();
  await expect(page.getByText("Today's shortlist")).toBeVisible();

  await page.getByRole('tab', { name: 'Profile' }).click();
  await expect(page.getByText('preview@swipeconnect.app')).toBeVisible();
  await expect(page.getByText('Upload & manage your resume')).toBeVisible();
});
