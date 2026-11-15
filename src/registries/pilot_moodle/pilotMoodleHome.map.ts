import type { UiMapEntry } from '../../types/uiMapTypes';

export const PilotMoodleHomeUiMap: Record<string, UiMapEntry> = {
  pilot_moodle_home_userMenuButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'User menu',
    exact: true
  },
  pilot_moodle_home_logOutLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'menuitem',
    name: 'Log out',
    exact: true
  },
  pilot_moodle_home_myCoursesLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'menuitem',
    name: 'My courses',
    exact: true
  },
  pilot_moodle_home_firstCourseLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    name: 'My first course',
    exact: true
  },
  pilot_moodle_courses_headingLabel: {
    widgetType: 'LABEL',
    strategy: 'role',
    role: 'heading',
    name: 'My courses',
    exact: true
  }
};
