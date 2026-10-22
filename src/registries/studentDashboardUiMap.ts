// src/registries/studentDashboardUiMap.ts
import type { UiMapEntry } from '../types/uiMapTypes';

export const studentDashboardUiMap: Record<string, UiMapEntry> = {
  // Uses SEARCH control type (defaults handled via controlDefaults.ts)
  courseSearchInput: {
    widgetType: 'SEARCH',
    strategy: 'placeholder',
    text: 'Search course',
    exact: false
  },

  // Container for target filtered cards
  courseCardContainer: {
    widgetType: 'COURSE_CARD',
    main: {
      strategy: 'css',
      selector: 'div.course-card, div.card, div[class*="course"]'
    }
  }
};