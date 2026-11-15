import type { UiMapEntry } from '../../types/uiMapTypes';
import { PilotMoodleHomeUiMap } from './pilotMoodleHome.map';

export const AppLevelControlsUiMap: Record<string, UiMapEntry> = {
  pilot_moodle_home_userMenuButton: PilotMoodleHomeUiMap.pilot_moodle_home_userMenuButton,
  pilot_moodle_home_logOutLink: PilotMoodleHomeUiMap.pilot_moodle_home_logOutLink,
  pilot_moodle_appLevel_logInLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    name: 'Log in',
    exact: true
  }
};
