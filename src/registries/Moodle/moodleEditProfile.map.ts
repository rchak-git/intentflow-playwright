import type { UiMapEntry } from '../../types/uiMapTypes';

export const MoodleEditProfileUiMap: Record<string, UiMapEntry> = {
  moodle_editProfile_descriptionRichText: {
    widgetType: 'RICH_TEXT',
    strategy: 'css',
    selector: 'body[contenteditable="true"]',
    frameSelector: 'div.fitem:has(> div label:text-is("Description")) iframe',
  },
};
