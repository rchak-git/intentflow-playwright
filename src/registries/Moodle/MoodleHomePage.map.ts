import type { UiMapEntry } from '../../types/uiMapTypes';

export const MoodleHomePageUiMap: Record<string, UiMapEntry> = {
  moodle_hmpage_homeNavPillLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    text: 'Home',
    exact: true
  },
  moodle_hmpage_dashboardNavPillLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    text: 'Dashboard',
    exact: true
  },
  moodle_hmpage_myCoursesNavPillLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'menuitem',
    text: 'My courses',
    exact: true
  },
  moodle_hmpage_toggleSearchButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    text: 'Toggle search input',
    exact: true
  },
  moodle_hmpage_siteSearchTextbox: {
    widgetType: 'TEXTBOX',
    strategy: 'placeholder',
    text: 'Search',
    exact: true
  },
  moodle_hmpage_performSearchButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    text: 'Perform search',
    exact: true
  },
  moodle_hmpage_notificationsButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    text: 'Show notification window with no new notifications',
    exact: true
  },
  moodle_hmpage_toggleMessagingDrawerButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    text: 'Toggle messaging drawer',
    exact: true
  },
  moodle_hmpage_userMenuButton: {
  widgetType: 'BUTTON',
  strategy: 'css',
  selector: '#user-menu-toggle span.userbutton'
},
  moodle_hmpage_userProfileLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    text: 'Profile',
    exact: true
  },
  moodle_hmpage_userGradesLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'menuitem',
    text: 'Grades',
    exact: false
  },
  moodle_hmpage_userCalendarLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    text: 'Calendar',
    exact: true
  },
  moodle_hmpage_userMessagesLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    text: 'Messages',
    exact: true
  },
  moodle_hmpage_userPrivateFilesLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    text: 'Private files',
    exact: true
  },
  moodle_hmpage_userReportsLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    text: 'Reports',
    exact: true
  },
  moodle_hmpage_userPreferencesLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    text: 'Preferences',
    exact: true
  },
  moodle_hmpage_userLogOutLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'menuitem',
    text: 'Log out',
    exact: true
  },
  moodle_hmpage_sidePanelTogglerButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    text: 'Side panel',
    exact: true
  },
  moodle_hmpage_drawerHomeLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    text: 'Home',
    exact: true
  },
  moodle_hmpage_drawerDashboardLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    text: 'Dashboard',
    exact: true
  },
  moodle_hmpage_drawerMyCoursesLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'menuitem',
    text: 'My courses',
    exact: true
  },
  moodle_hmpage_contactSiteSupportLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    text: 'Contact site support',
    exact: true
  }
};