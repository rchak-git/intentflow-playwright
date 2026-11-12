import type { UiMapEntry } from '../../types/uiMapTypes';

export const MoodleCourseUiMap: Record<string, UiMapEntry> = {
  // Course card link on the "My courses" page (Image 8)
 moodle_course_cardLink: {
  widgetType: 'LINK',
  strategy: 'css',
  selector: 'a.coursename[href*="/course/view.php"] >> nth=0' // <--- Targets the 1st course card
},

  // Participants tab link on the Course navigation bar (Image 9)
  moodle_course_participantsTab: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'menuitem',
    text: 'Participants',
    exact: true
  },

   
};