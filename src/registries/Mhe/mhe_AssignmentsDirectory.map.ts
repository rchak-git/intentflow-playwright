import type { UiMapEntry } from '../../types/uiMapTypes';

export const MheAssignmentsDirectoryUiMap: Record<string, UiMapEntry> = {
  // Primary Action
  mhe_asg_createAssignmentBtn: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'button.assignmentBtn',
    frameSelector: 'iframe#course-player',
  },

  // Search Input
  mhe_asg_searchInput: {
    widgetType: 'TEXTBOX',
    strategy: 'css',
    selector: 'input[formcontrolname="search"][placeholder="Search By Assignment Name"]',
    frameSelector: 'iframe#course-player',
  },

  // Left Filter Panel Controls
  mhe_asg_startDateInput: {
    widgetType: 'TEXTBOX',
    strategy: 'css',
    selector: 'input[aria-label="Start Date"]',
    frameSelector: 'iframe#course-player',
  },

  mhe_asg_endDateInput: {
    widgetType: 'TEXTBOX',
    strategy: 'css',
    selector: 'input[aria-label="End Date"]',
    frameSelector: 'iframe#course-player',
  },

  mhe_asg_typeFilterBtn: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'button[aria-label="Type"]',
    frameSelector: 'iframe#course-player',
  },

  mhe_asg_gradebookFilterBtn: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'button[aria-label="Gradebook Category"]',
    frameSelector: 'iframe#course-player',
  },

  mhe_asg_statusFilterBtn: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'button[aria-label="Status"]',
    frameSelector: 'iframe#course-player',
  },

  mhe_asg_gradingFilterBtn: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'button[aria-label="Grading"]',
    frameSelector: 'iframe#course-player',
  },

  mhe_asg_lateSubmissionFilterBtn: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'button[aria-label="Late Submission"]',
    frameSelector: 'iframe#course-player',
  },
};