import type { UiMapEntry } from '../../types/uiMapTypes';



export const MoodleParticipantUiMap: Record<string, UiMapEntry> = {

  moodle_participant_matchSelect: {

    widgetType: 'SELECT',

    strategy: 'css',

    selector: 'div[data-filterregion="filtermatch"] select[data-filterfield="join"]'

  },

  moodle_participant_filterMatchSelect: {

    widgetType: 'SELECT',

    strategy: 'css',

    selector: 'div[data-filterregion="filter"] select[data-filterfield="join"]'

  },

  moodle_participant_filterTypeSelect: {

    widgetType: 'SELECT',

    strategy: 'css',

    selector: 'div[data-filterregion="filter"] select[data-filterfield="type"]'

  },

  moodle_participant_removeFilterButton: {

    widgetType: 'BUTTON',

    strategy: 'css',

    selector: 'button[data-filteraction="remove"]'

  },

  moodle_participant_addConditionButton: {

    widgetType: 'BUTTON',

    strategy: 'css',

    selector: 'button[data-filteraction="add"]'

  },

  moodle_participant_clearFiltersButton: {

    widgetType: 'BUTTON',

    strategy: 'css',

    selector: 'button[data-filteraction="reset"]'

  },

  moodle_participant_applyFiltersButton: {

    widgetType: 'BUTTON',

    strategy: 'css',

    selector: 'button[data-filteraction="apply"]'

  },

  moodle_participant_selectAllCheckbox: {

    widgetType: 'CHECKBOX',

    strategy: 'css',

    selector: 'input#select-all-participants'

  },
  moodle_participant_participantsTable: {
    widgetType: 'WEB_TABLE',
    strategy: 'css',
    selector: 'table#participants',
    rowSelector: 'tbody tr:not(.emptyrow)',
    columns: {
      select: { index: 1, controlType: 'CHECKBOX', subSelector: 'input.usercheckbox' },
      fullName: { index: 2, controlType: 'LINK', subSelector: 'th.cell.c1 a' },
      roles: { index: 3, controlType: 'TEXT', subSelector: 'td.cell.c2' },
      groups: { index: 4, controlType: 'TEXT', subSelector: 'td.cell.c3' },
      lastAccess: { index: 5, controlType: 'TEXT', subSelector: 'td.cell.c4' }
    }
  },
   
  moodle_participant_withSelectedUsersSelect: {

    widgetType: 'SELECT',

    strategy: 'css',

    selector: 'select#formactionid'

  }

}; 