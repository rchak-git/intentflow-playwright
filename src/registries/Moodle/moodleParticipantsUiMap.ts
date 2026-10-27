import { UiMapEntry } from '../../types/uiMapTypes';

export const moodleParticipantsUiMap: Record<string, UiMapEntry> = {
  participantsTable: {
    widgetType: 'WEB_TABLE',
    strategy: 'css',
    selector: 'table.userenrolment, table#participants',
  },
};