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
  },

  moodle_course_editModeCheckbox: {
    widgetType: 'CHECKBOX',
    strategy: 'role',
    role: 'switch',
    name: 'Edit mode',
    exact: true
  },
  moodle_course_generalInsertContentButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: "Insert content in section 'General'",
    exact: true
  },
  moodle_course_activityOrResourceButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Activity or resource',
    exact: true
  },
  moodle_course_assignmentChooserLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    name: 'Assignment',
    exact: true
  },
  moodle_course_activityCard: {
    widgetType: 'CARD',
    strategy: 'css',
    selector: '.activity-grid',
    subSelectors: {
      editButton: 'a[role="button"][aria-label="Edit"]',
      deleteItem: 'a[role="menuitem"][data-action="cmDelete"]'
    }
  },
  moodle_course_studentAssignmentLink: {
    widgetType: 'LINK',
    strategy: 'css',
    selector: ':is(main, [role="main"]) a[href*="/mod/assign/view.php"]'
  }
};