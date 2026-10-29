import { test } from '@playwright/test';
import * as path from 'path';
import { CommandDispatcher } from '../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../src/engine/yamlLoader';

test.describe('McGraw Hill AUT - Assessments Table Verification Flow', () => {
  const dashboardSuitePath = path.resolve(process.cwd(), 'tests/suites/mheStudentDashboard.yaml');
  const assessmentsSuitePath = path.resolve(process.cwd(), 'tests/suites/mheAssessmentsPage.yaml');

  test('TC_ASSESSMENTS_001 - Search Course, Open Course Player Popup, and Verify Assessments Table', async ({ page, context }) => {
    const dashboardSuite = loadYamlSuite(dashboardSuitePath);
    const assessmentsSuite = loadYamlSuite(assessmentsSuitePath);

    const dashboardDispatcher = await CommandDispatcher.fromSuite(dashboardSuite);
    const assessmentsDispatcher = await CommandDispatcher.fromSuite(assessmentsSuite);

    // 1. Navigate to application landing page
    await page.goto('/');

    // 2. Prepare popup listener for opening the Course Card window
    const popupPromise = context.waitForEvent('page');

    // 3. Execute Dashboard profile (Logs in, searches course, clicks course card link)
    await dashboardDispatcher.executeProfile(page, 'openCoursePlayerProfile', dashboardSuite);

    // 4. Catch the newly opened course player window
    const coursePlayerPage = await popupPromise;
    await coursePlayerPage.waitForLoadState('domcontentloaded');

    // 5. Execute Assessment Table Profile on the 2nd window page context
    await assessmentsDispatcher.executeProfile(coursePlayerPage, 'verifyAssessmentsProfile', assessmentsSuite);

    debugger;
  });
});