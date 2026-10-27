import { UiMapEntry } from '../../types/uiMapTypes';

export const moodleCourseUiMap: Record<string, UiMapEntry> = {
  participantsTab: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'menuitem',
    name: 'Participants',
  },
};