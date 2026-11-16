import type { UiMapEntry } from '../../types/uiMapTypes';

export const MheSelectAssignmentTypeUiMap: Record<string, UiMapEntry> = {
  mhe_sat_backToAssignmentsBtn: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'button.assignment-type-back-btn',
    frameSelector: 'iframe#course-player',
  },

  mhe_sat_pageTitle: {
    widgetType: 'LABEL',
    strategy: 'css',
    selector: 'h4.assignment-title',
    frameSelector: 'iframe#course-player',
  },

  mhe_sat_onlineQuestionsBtn: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'button.online-qs[aria-label="Online Questions"]',
    frameSelector: 'iframe#course-player',
  },

  mhe_sat_instructionsBtn: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'button.online-qs[aria-label="Instructions"]',
    frameSelector: 'iframe#course-player',
  },

  mhe_sat_submissionBtn: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'button.online-qs[aria-label="Submission"]',
    frameSelector: 'iframe#course-player',
  },
};