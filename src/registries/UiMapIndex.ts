import { mheLoginUiMap } from './mheLoginUiMap';
import { moodleLoginUiMap } from './Moodle/moodleLoginUiMap';
import { studentDashboardUiMap } from './studentDashboardUiMap';
import type { UiMapEntry } from '../types/uiMapTypes';
import  {moodleHomeUiMap} from  './Moodle/moodleHomeUiMap';
import { moodleCourseUiMap } from './Moodle//moodleCourseUiMap';
import { moodleParticipantsUiMap } from './Moodle//moodleParticipantsUiMap';

export const UI_MAP_REGISTRY: Record<string, Record<string, UiMapEntry>> = {
  studentDashboardUiMap,
  mheLoginUiMap,
  moodleLoginUiMap,
  moodleHomeUiMap,
  moodleCourseUiMap,
  moodleParticipantsUiMap,
};