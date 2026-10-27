import { UiMapEntry } from '../../types/uiMapTypes';

export const moodleHomeUiMap: Record<string, UiMapEntry> = {
  homeHeader: {
    widgetType: 'LABEL',
    strategy: 'role',
    role: 'heading',
    name: 'Available courses',
    exact: true,
  },
  
  // Dynamic Link: Accepts params.text (e.g., "My first course")
  courseLink: {
    widgetType: 'LINK',
    strategy: 'css',
    selector: 'a:has-text("{text}")',
  },
};