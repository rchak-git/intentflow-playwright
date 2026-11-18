import type { UiMapEntry } from '../../types/uiMapTypes';

export const MoodleAssignmentSubmissionUiMap: Record<string, UiMapEntry> = {
  moodle_assignmentSubmission_addButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Add submission',
    exact: true,
  },
  moodle_assignmentSubmission_statusLabel: {
    widgetType: 'LABEL',
    strategy: 'css',
    selector: 'tr:has(> th:text-is("Submission status")) > td',
  },
  moodle_assignmentSubmission_savedTextLabel: {
    widgetType: 'LABEL',
    strategy: 'css',
    selector: 'tr:has(> th:text-is("Online text")) > td',
  },
  moodle_assignmentSubmission_onlineTextRichText: {
    widgetType: 'RICH_TEXT',
    strategy: 'css',
    selector: 'body[contenteditable="true"]',
    frameSelector: 'iframe[class~="tox-edit-area__iframe"]',
  },
  moodle_assignmentSubmission_saveButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Save changes',
    exact: true,
  },
  moodle_assignmentSubmission_removeButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Remove submission',
    exact: true,
  },
  moodle_assignmentSubmission_confirmRemovalButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Continue',
    exact: true,
  },
};
