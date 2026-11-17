import { expect, test, type Page } from '@playwright/test';
import { resolveLoginData } from '../../../src/config/runtimeConfig';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

async function reopenPrivateFiles(page: Page): Promise<void> {
  const listing = page.waitForResponse(response => {
    const url = new URL(response.url());
    return url.pathname === '/repository/draftfiles_ajax.php' && url.searchParams.get('action') === 'list';
  });
  await page.goto('/user/files.php', { waitUntil: 'domcontentloaded' });
  const response = await listing;
  expect(response.ok(), 'Private files listing request failed').toBeTruthy();
  await expect(page.locator('.filemanager.fm-loaded:has(.fp-path-folder-name)')).toBeVisible();
}

test('Student uploads a private file and verifies it persists', async ({ page }) => {
  const { username, password } = resolveLoginData('student');
  const suite = loadYamlSuite('tests/suites/pilot_moodle/studentPrivateFilesSteps.yaml');
  const precondition = suite.profiles?.td_studentUploadPrivateFile?.preconditions?.[0];
  if (!precondition || precondition.refProfile !== 'td_studentLogin') {
    throw new Error('The student login precondition is missing.');
  }
  precondition.data = { ...precondition.data, username, password };

  let uploadAttempted = false;
  let scenarioPassed = false;
  page.on('request', request => {
    const url = new URL(request.url());
    if (request.method() === 'POST' && url.pathname === '/repository/repository_ajax.php' &&
        url.searchParams.get('action') === 'upload') {
      uploadAttempted = true;
    }
  });

  try {
    await (await CommandDispatcher.fromSuite(suite)).executeProfile(page, 'td_studentUploadPrivateFile');
    scenarioPassed = true;
    expect(uploadAttempted, 'The fixture upload request was not observed').toBeTruthy();
  } finally {
    if (uploadAttempted || scenarioPassed) {
      await reopenPrivateFiles(page);
      const file = page.locator('.filemanager.fm-loaded .fp-filename').filter({ hasText: /^TempFile\.txt$/ });
      if (scenarioPassed) await expect(file).toBeVisible();
      const count = await file.count();
      if (count > 1) throw new Error('Cleanup stopped: multiple files named TempFile.txt were found.');
      if (count === 1) {
        await file.click();
        await page.getByRole('button', { name: 'Delete', exact: true }).click();
        const [deletion] = await Promise.all([
          page.waitForResponse(response => {
            const url = new URL(response.url());
            return url.pathname === '/repository/draftfiles_ajax.php' && url.searchParams.get('action') === 'delete';
          }),
          page.getByRole('dialog', { name: 'Confirm' }).getByRole('button', { name: 'Yes', exact: true }).click(),
        ]);
        expect(deletion.ok(), 'Deleting the test file failed').toBeTruthy();
        await expect(file).toBeHidden();
        await page.getByRole('button', { name: 'Save changes', exact: true }).click();
        await reopenPrivateFiles(page);
        await expect(page.locator('.filemanager.fm-loaded .fp-filename').filter({ hasText: /^TempFile\.txt$/ })).toHaveCount(0);
      }
    }
  }
});
