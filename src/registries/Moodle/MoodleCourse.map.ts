import type { UiMapEntry } from '../../types/uiMapTypes';

export const MoodleCourseUiMap: Record<string, UiMapEntry> = {
  // Course card container on the "My courses" page
  moodle_course_card: {
    widgetType: 'CARD',
    strategy: 'css',
    selector: '.card.course-card',
    subSelectors: {
      imageLink: 'a:has(.card-img-top)',
      titleLink: 'a.coursename .multiline',
      categoryText: '.categoryname',
      menuButton: 'button.coursemenubtn',
      starCourseItem: 'a[data-action="add-favourite"]'
    }
  },

  // Participants tab link on the Course navigation bar
  moodle_course_participantsTab: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'menuitem',
    text: 'Participants',
    exact: true
  }
};