import type { UiMapEntry } from '../../types/uiMapTypes';

export const MheCourseDashboardUiMap: Record<string, UiMapEntry> = {
  // --- Course Header & Primary Navigation Bar (inside iframe#course-player) ---
  mhe_courseDashboard_courseTitleLabel: {
    widgetType: 'LABEL',
    strategy: 'css',
    frameSelector: 'iframe#course-player',
    selector: 'app-header h4.course-title'
  },

  mhe_courseDashboard_dashboardTabLink: {
    widgetType: 'LINK',
    strategy: 'css',
    frameSelector: 'iframe#course-player',
    selector: 'nav[aria-label="Dashboard"] a[href="/course-player/ui/"]'
  },

  mhe_courseDashboard_plannerTabLink: {
    widgetType: 'LINK',
    strategy: 'css',
    frameSelector: 'iframe#course-player',
    selector: 'nav[aria-label="Dashboard"] a[routerlink="/planner"]'
  },

  mhe_courseDashboard_assessmentsTabLink: {
    widgetType: 'LINK',
    strategy: 'css',
    frameSelector: 'iframe#course-player',
    selector: 'nav[aria-label="Dashboard"] a[routerlink="/assessment"]'
  },

  mhe_courseDashboard_assignmentsTabLink: {
    widgetType: 'LINK',
    strategy: 'css',
    frameSelector: 'iframe#course-player',
    selector: 'nav[aria-label="Dashboard"] a[routerlink="/assignments"]'
  },

  mhe_courseDashboard_gradebookTabLink: {
    widgetType: 'LINK',
    strategy: 'css',
    frameSelector: 'iframe#course-player',
    selector: 'nav[aria-label="Dashboard"] a[routerlink="/gradebook"]'
  },

  mhe_courseDashboard_reportsTabLink: {
    widgetType: 'LINK',
    strategy: 'css',
    frameSelector: 'iframe#course-player',
    selector: 'nav[aria-label="Dashboard"] a[routerlink="/reports"]'
  },

  // --- Dashboard Action & Schedule Widgets ---
  mhe_courseDashboard_launchPresentationButton: {
    widgetType: 'BUTTON',
    strategy: 'css',
    frameSelector: 'iframe#course-player',
    selector: 'button[aria-label="Launch Presentation"]'
  },

  mhe_courseDashboard_createScheduleEventButton: {
    widgetType: 'BUTTON',
    strategy: 'css',
    frameSelector: 'iframe#course-player',
    selector: '.schedule-card span[aria-label="Create a new event"]'
  },

  mhe_courseDashboard_viewAllScheduleLink: {
    widgetType: 'LINK',
    strategy: 'css',
    frameSelector: 'iframe#course-player',
    selector: '.schedule-card a.view-all-link'
  },

  mhe_courseDashboard_scheduleDateLabel: {
    widgetType: 'LABEL',
    strategy: 'css',
    frameSelector: 'iframe#course-player',
    selector: '.schedule-card .date-next'
  },

  mhe_courseDashboard_previousDateButton: {
    widgetType: 'BUTTON',
    strategy: 'css',
    frameSelector: 'iframe#course-player',
    selector: '.schedule-card button[aria-label=" Previous Date"]'
  },

  mhe_courseDashboard_nextDateButton: {
    widgetType: 'BUTTON',
    strategy: 'css',
    frameSelector: 'iframe#course-player',
    selector: '.schedule-card button[aria-label=" Next Date"]'
  },

  mhe_courseDashboard_scheduleListContainer: {
    widgetType: 'CONTAINER',
    strategy: 'css',
    frameSelector: 'iframe#course-player',
    selector: '.schedule-card .card-body'
  },

  // --- Assignments to Grade Widget ---
  mhe_courseDashboard_assignmentsToGradeContainer: {
    widgetType: 'CONTAINER',
    strategy: 'css',
    frameSelector: 'iframe#course-player',
    selector: 'div[aria-labelledby="heading-assignments"] .list-group'
  },

  mhe_courseDashboard_viewMoreAssignmentsLink: {
    widgetType: 'LINK',
    strategy: 'css',
    frameSelector: 'iframe#course-player',
    selector: 'span[aria-label="View More Assignments to Grade"]'
  }
};