import type { UiMapEntry } from '../../types/uiMapTypes';

export const StudentMyCoursesUiMap: Record<string, UiMapEntry> = {
  moodle_studentMyCourses_firstCourseLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    name: 'My first course',
    exact: true,
  },
};
