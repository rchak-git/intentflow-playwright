import type { UiMapEntry } from '../../types/uiMapTypes';

export const MoodleAssignmentSettingsUiMap: Record<string, UiMapEntry> = {
  moodle_assignmentSettings_nameTextbox: {
    widgetType: 'TEXTBOX',
    strategy: 'role',
    role: 'textbox',
    name: 'Assignment name',
    exact: true,
  },
  moodle_assignmentSettings_allowSubmissionsFromCheckbox: {
    widgetType: 'CHECKBOX',
    strategy: 'css',
    selector: 'input[name="allowsubmissionsfromdate[enabled]"]',
  },
  moodle_assignmentSettings_cutoffDateCheckbox: {
    widgetType: 'CHECKBOX',
    strategy: 'css',
    selector: 'input[name="cutoffdate[enabled]"]',
  },
  moodle_assignmentSettings_onlineTextCheckbox: {
    widgetType: 'CHECKBOX',
    strategy: 'role',
    role: 'checkbox',
    name: 'Online text',
    exact: true,
  },
  moodle_assignmentSettings_fileSubmissionsCheckbox: {
    widgetType: 'CHECKBOX',
    strategy: 'role',
    role: 'checkbox',
    name: 'File submissions',
    exact: true,
  },
  moodle_assignmentSettings_submissionSettingsButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Submission settings',
    exact: true,
  },
  moodle_assignmentSettings_requireSubmitButtonSelect: {
    widgetType: 'SELECT',
    strategy: 'role',
    role: 'combobox',
    name: 'Require students to click the submit button',
    exact: true,
  },
  moodle_assignmentSettings_saveAndReturnButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Save and return to course',
    exact: true,
  },
};
