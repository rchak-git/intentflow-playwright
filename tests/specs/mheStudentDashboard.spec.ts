// tests/specs/mheStudentDashboard.spec.ts
import { test } from '@playwright/test';
import { CommandDispatcher } from '../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../src/engine/yamlLoader';

test.describe('MHE Student Dashboard - Search & User Management', () => {
  let dispatcher: CommandDispatcher;
  let suiteSpec: any;

  test.beforeAll(async () => {
    // 1. Load the shared login suite specification YAML
    const loginSuite = await loadYamlSuite('tests/suites/mheLoginSuite.yaml');

    // 2. Load the primary student dashboard suite specification YAML
    suiteSpec = await loadYamlSuite('tests/suites/mheStudentDashboard.yaml');

    // 3. Merge shared scenarios so 'studentLoginFlow' is available within the dashboard suite
    suiteSpec.sharedScenarios = {
      ...loginSuite.sharedScenarios,
      ...suiteSpec.sharedScenarios,
    };

    // 4. Initialize CommandDispatcher with the merged suite specification
    dispatcher = await CommandDispatcher.fromSuite(suiteSpec);
  });
/*
  test('TC_SEARCH_001 - Login, Perform Course Search and Verify Results', async ({ page, context }) => {
   
    const searchDispatcher = await CommandDispatcher.fromSuite(loginSuite);
    const assessmentsDispatcher = await CommandDispatcher.fromSuite(assessmentsSuite);

    // 1. Navigate to application landing page
    await page.goto('/');

    // 2. Execute existing search profile (Logs in & searches for course)
    await searchDispatcher.executeProfile(page, 'validCourseSearchProfile', searchSuite);

    // 3. Set up popup listener & click course card to launch 2nd window
    const popupPromise = context.waitForEvent('page');
    await page.locator('a[href*="lti/ui"]:has(img[alt="Theme_MHUBlue"])').click();

    // 4. Catch and switch context to 2nd window
    const coursePlayerPage = await popupPromise;
    await coursePlayerPage.waitForLoadState('domcontentloaded');

    // 5. Navigate to Assessments Tab in 2nd window
    await coursePlayerPage.locator('a[routerlink="/assessment"]').click();

    // 6. Execute Assessment Table Dispatcher on 2nd window instance
    await assessmentsDispatcher.executeProfile(coursePlayerPage, 'verifyAssessmentsTableProfile', assessmentsSuite);
    
    debugger;
  });
  */

  test('TC_ASSIGN_USER_001 - Assign User and Verify Persistence Across Modal Re-open', async ({ page }) => {
    // 5. Navigate to application landing page
    await page.goto('/');

    // 6. Execute assign user profile - handles search, assign checkbox, update save, and persistence verification
    await dispatcher.executeProfile(page, 'assignAndVerifyUserProfile', suiteSpec);
    debugger
  });
});