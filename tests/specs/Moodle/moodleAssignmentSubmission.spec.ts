import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { resolveLoginData, resolveRuntimeConfig } from '../../../src/config/runtimeConfig';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { globalContextStore } from '../../../src/engine/contextStore';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

const suitePath = 'tests/suites/Moodle/moodleAssignmentSubmissionSteps.yaml';
const submissionText = 'IntentFlow pilot test submission';
const emptyStatus = 'No submissions have been made yet';

test.describe('Moodle online-text assignment', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(180000);

  const assignmentName = `IntentFlow Pilot - ${randomUUID()}`;
  let teacherContext: BrowserContext;
  let studentContext: BrowserContext;
  let teacherPage: Page;
  let studentPage: Page;
  let courseUrl = '';
  let assignmentUrl = '';
  let assignmentId = '';
  let creationAttempted = false;

  test.beforeAll(async ({ browser }) => {
    const { baseURL } = resolveRuntimeConfig();
    teacherContext = await browser.newContext({ baseURL });
    studentContext = await browser.newContext({ baseURL });
    teacherPage = await teacherContext.newPage();
    studentPage = await studentContext.newPage();

    const student = resolveLoginData('student', ['student'], {
      env: { ...process.env, INTENTFLOW_LOGIN_PROFILE: 'student' },
    });
    const suite = loadYamlSuite(suitePath);
    const precondition = suite.profiles?.td_studentNavigateToMyCourses?.preconditions?.[0];
    if (!precondition || precondition.refProfile !== 'td_studentLogin') {
      throw new Error('The student login precondition is missing.');
    }
    precondition.data = { ...precondition.data, username: student.username, password: student.password };
    await (await CommandDispatcher.fromSuite(suite)).executeProfile(studentPage, 'td_studentNavigateToMyCourses');
    await studentPage.getByRole('link', { name: 'My first course', exact: true }).click();
    const url = new URL(studentPage.url());
    if (url.pathname !== '/course/view.php' || !url.searchParams.get('id')) {
      throw new Error('The student did not reach a Moodle course.');
    }
    courseUrl = url.href;
    globalContextStore.clear();
  });

  test('Teacher creates a temporary assignment', async () => {
    const teacher = resolveLoginData('teacher', ['teacher'], {
      env: { ...process.env, INTENTFLOW_LOGIN_PROFILE: 'teacher' },
    });
    const suite = loadYamlSuite(suitePath);
    const profile = suite.profiles?.td_teacherCreateAssignment;
    const precondition = profile?.preconditions?.[0];
    if (!profile || !precondition || precondition.refProfile !== 'td_studentNavigateToMyCourses') {
      throw new Error('The teacher course-navigation precondition is missing.');
    }
    precondition.data = { ...precondition.data, username: teacher.username, password: teacher.password };
    profile.data = { ...profile.data, assignmentName };
    creationAttempted = true;
    await (await CommandDispatcher.fromSuite(suite)).executeProfile(teacherPage, 'td_teacherCreateAssignment');

    const link = teacherPage.locator(':is(main, [role="main"]) a[href*="/mod/assign/view.php"]')
      .filter({ hasText: assignmentName });
    await expect(link).toHaveCount(1);
    const href = await link.getAttribute('href');
    if (!href) throw new Error('The created assignment has no link.');
    const url = new URL(href, teacherPage.url());
    const id = url.searchParams.get('id');
    if (url.pathname !== '/mod/assign/view.php' || !id || !/^\d+$/.test(id)) {
      throw new Error('The created assignment has an invalid identity.');
    }
    assignmentUrl = url.href;
    assignmentId = id;

    await studentPage.reload();
    const studentLink = studentPage.locator(':is(main, [role="main"]) a[href*="/mod/assign/view.php"]')
      .filter({ hasText: assignmentName });
    await expect(studentLink).toHaveCount(1);
    await expect(studentLink).toBeVisible();
    const studentHref = await studentLink.getAttribute('href');
    if (!studentHref || new URL(studentHref, studentPage.url()).searchParams.get('id') !== assignmentId) {
      throw new Error('The student assignment does not match the assignment created by the teacher.');
    }
  });

  test('Student submits and removes online text', async () => {
    if (!assignmentId) throw new Error('The teacher assignment was not identified.');
    const suite = loadYamlSuite(suitePath);
    const profile = suite.profiles?.td_studentSubmitAssignment;
    if (!profile) throw new Error('The student submission profile is missing.');
    profile.data = { ...profile.data, assignmentName };
    await (await CommandDispatcher.fromSuite(suite)).executeProfile(studentPage, 'td_studentSubmitAssignment');
  });

  test.afterAll(async () => {
    try {
      if (!creationAttempted) return;
      if (!courseUrl) throw new Error('Cannot verify cleanup without the course URL.');

      if (!assignmentId) {
        await teacherPage.goto(courseUrl);
        await expect(teacherPage).toHaveURL(courseUrl);
        const unverified = teacherPage.locator('.activity-grid').filter({ hasText: assignmentName });
        if (await unverified.count() !== 0) {
          throw new Error(`Assignment identity was not captured; manual cleanup is required for "${assignmentName}".`);
        }
        return;
      }

      await studentPage.goto(assignmentUrl);
      const status = studentPage.locator('tr:has(> th:text-is("Submission status")) > td');
      await expect(status).toHaveCount(1);
      const currentStatus = (await status.innerText()).trim();
      if (currentStatus !== emptyStatus) {
        const text = studentPage.locator('tr:has(> th:text-is("Online text")) > td');
        if (currentStatus !== 'Submitted for grading' || await text.count() !== 1 ||
            (await text.innerText()).trim() !== submissionText) {
          throw new Error('Cannot safely identify the pilot submission for cleanup.');
        }
        await studentPage.getByRole('button', { name: 'Remove submission', exact: true }).click();
        await expect(studentPage.getByText('Are you sure you want to remove your submission?', { exact: true })).toBeVisible();
        await studentPage.getByRole('button', { name: 'Continue', exact: true }).click();
        await expect(status).toHaveText(emptyStatus);
      }

      await teacherPage.goto(courseUrl);
      const editMode = teacherPage.getByRole('switch', { name: 'Edit mode', exact: true });
      await editMode.check();
      const card = teacherPage.locator('.activity-grid').filter({ hasText: assignmentName });
      await expect(card).toHaveCount(1);
      const link = card.getByRole('link').filter({ hasText: assignmentName });
      await expect(link).toHaveCount(1);
      const href = await link.getAttribute('href');
      if (!href || new URL(href, teacherPage.url()).searchParams.get('id') !== assignmentId) {
        throw new Error('Cannot safely identify the pilot assignment for cleanup.');
      }
      await card.locator('a[role="button"][aria-label="Edit"]').click();
      const deleteItem = card.locator('a[role="menuitem"][data-action="cmDelete"]');
      await expect(deleteItem).toHaveCount(1);
      if (await deleteItem.getAttribute('data-id') !== assignmentId) {
        throw new Error('The delete action does not match the pilot assignment.');
      }
      await deleteItem.click();
      const confirmation = teacherPage.locator(':is([role="dialog"], [role="alertdialog"]):visible')
        .filter({ hasText: assignmentName });
      await expect(confirmation).toHaveCount(1);
      await confirmation.getByRole('button', { name: 'Delete', exact: true }).click();
      const expectedCourse = new URL(courseUrl);
      await teacherPage.waitForURL(url =>
        url.pathname === expectedCourse.pathname && url.searchParams.get('id') === expectedCourse.searchParams.get('id')
      );
      await expect(card).toHaveCount(0);
    } finally {
      try {
        const originalEditMode = globalContextStore.get<string>('assignmentOriginalEditMode');
        if (teacherPage && courseUrl && originalEditMode === 'false') {
          await teacherPage.goto(courseUrl);
          await teacherPage.getByRole('switch', { name: 'Edit mode', exact: true }).uncheck();
        }
      } finally {
        if (teacherContext) await teacherContext.close();
        if (studentContext) await studentContext.close();
      }
    }
  });
});
