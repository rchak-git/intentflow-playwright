// src/registries/Mhe/Mhe_HomePage.map.ts
import type { UiMapEntry } from '../../types/uiMapTypes';

export const MheHomePageUiMap: Record<string, UiMapEntry> = {
  mhe_hm_searchInput: {
    widgetType: 'SEARCH',
    strategy: 'css',
    selector: 'input.search-input[type="search"]'
  },
  mhe_hm_clearSearchButton: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'button.search-clear-btn'
  },
  mhe_hm_gridViewButton: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'button[aria-label="Grid view"]'
  },
  mhe_hm_listViewButton: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'button[aria-label="List view"]'
  },
  mhe_hm_courseCard: {
    widgetType: 'CARD',
    strategy: 'css',
    selector: 'article.course-card',
    subSelectors: {
      imageLink: 'a[target="_blank"]',
      image: 'img.card-image',
      typeBadge: '.course-type-badge',
      title: '.course-title',
      updatedInfo: '.course-updated',
      teachersTag: '.tag--teachers',
      studentsTag: '.tag--students',
      manageUsersButton: 'button.assign-btn'
    }
  }
};