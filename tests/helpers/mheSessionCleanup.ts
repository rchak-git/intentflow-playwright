// tests/helpers/mheSessionCleanup.ts
import { Page } from '@playwright/test';

export async function logoutMheIfLoggedIn(page: Page): Promise<void> {
  const pages = page.context().pages();

  // Close any secondary LTI tabs opened during the test
  for (let i = pages.length - 1; i > 0; i--) {
    await pages[i].close().catch(() => {});
  }

  const mainPage = pages[0] ?? page;
  if (mainPage.url().includes('/login')) {
    return;
  }

  try {
    const userMenuButton = mainPage.locator('button.profile-avatar[aria-label="User menu"]');
    await userMenuButton.waitFor({ state: 'visible', timeout: 3000 });
    await userMenuButton.click();

    const logoutMenuItem = mainPage.locator('a.dropdown-item[role="menuitem"]', { hasText: 'Logout' });
    await logoutMenuItem.waitFor({ state: 'visible', timeout: 3000 });
    await logoutMenuItem.click();

    await mainPage.waitForURL('**/login**', { timeout: 5000 });
  } catch {
    // Ignore if session already expired or environment went offline
  }
}