import { test, expect } from '@playwright/test';

test('Explore Moodle Course & Participants page', async ({ page }) => {
  // 1. Log in
  await page.goto('https://sandbox.moodledemo.net/login/index.php');
  await page.fill('#username', 'admin');
  await page.fill('#password', 'sandbox24');
  await page.click('#loginbtn');

  // 2. Navigate to Site Home
  await page.click('a:has-text("Home")');
  await page.waitForLoadState('networkidle');

  // 3. Click on the first available course card/link in public catalog
  const firstCourse = page.locator('.coursename a, .coursebox .title a').first();
  await firstCourse.click();
  await page.waitForLoadState('networkidle');

  // 4. Locate and click the Participants tab
  const participantsTab = page.locator('.moremenu .nav-link:has-text("Participants"), a[href*="user/index.php"]');
  await participantsTab.click();
  await page.waitForLoadState('networkidle');

  // 5. Verify Participants table visibility and specific users
  const participantsTable = page.locator('table#participants, .userenrolment');
  await expect(participantsTable).toBeVisible();
  await expect(participantsTable).toContainText('Sam Student');
  await expect(participantsTable).toContainText('Terri Teacher');

  console.log('Successfully reached and verified Participants page! URL:', page.url());
});