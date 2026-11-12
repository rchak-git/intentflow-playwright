// src/registries/UiMapIndex.ts
import type { UiMapEntry } from '../types/uiMapTypes';

// --- Moodle Domain Imports ---
import { MoodleLoginPageUiMap } from './Moodle/moodleLogin.map';
import { MoodleHomePageUiMap } from './Moodle/MoodleHomePage.map';
import { MoodleCourseUiMap } from './Moodle/MoodleCourse.map';
import { MoodleParticipantUiMap } from './Moodle/MoodleParticipants.map';
import { AgGridTableUiMap } from './temp/AgGridUiMap';
import { CustomSelectUiMap } from './temp/customSelect.map';

// --- MHE Domain Imports ---
import { MheLoginUiMap } from './Mhe/mheLogin.map';
import { MheHomePageUiMap } from './Mhe/mhe_HomePage.map';

// --- Temp / Experiment Domain Imports ---
import { AngularTableUiMap } from './temp/AngularTableUiMap';
import { ReactSelectUiMap }  from './temp/reactSelectUiMap';
import {RadioGroupUiMap} from './temp/radioGroupUiMap';
import {AngularRadioGroupUiMap} from './temp/AngularRadioGroupUiMap';
import {AngularMaterialCardUiMap} from './temp/AngularMaterialCardUiMap';
import {MuiAutocompleteUiMap} from './temp/MuiAutocompleteUiMap';


// Consolidated Moodle Domain Map
export const MOODLE_UI_MAP: Record<string, UiMapEntry> = {
  ...MoodleLoginPageUiMap,
  ...MoodleHomePageUiMap,
  ...MoodleCourseUiMap,
  ...MoodleParticipantUiMap,
};

// Consolidated McGraw Hill Domain Map
export const MHE_UI_MAP: Record<string, UiMapEntry> = {
  ...MheLoginUiMap,
  ...MheHomePageUiMap
};

// Consolidated Temp / Experiments Domain Map
export const TEMP_UI_MAP: Record<string, UiMapEntry> = {
  ...AngularTableUiMap,
  ...AgGridTableUiMap,
  ...CustomSelectUiMap,
  ...ReactSelectUiMap,
  ...RadioGroupUiMap,
  ...AngularRadioGroupUiMap,
  ...AngularMaterialCardUiMap,
  ...MuiAutocompleteUiMap,
};

// Unified Global Map
export const GLOBAL_UI_MAP: Record<string, UiMapEntry> = {
  ...MOODLE_UI_MAP,
  ...MHE_UI_MAP,
  ...TEMP_UI_MAP
};

// Registry Export (Clean 1-to-1 Mapping for Dynamic Lookup)
export const UI_MAP_REGISTRY: Record<string, Record<string, UiMapEntry>> = {
  globalUiMap: GLOBAL_UI_MAP,
  moodleUiMap: MOODLE_UI_MAP,
  mheUiMap: MHE_UI_MAP,
  tempUiMap: TEMP_UI_MAP,

  // Direct Page Maps - Moodle
  MoodleLoginPageUiMap: MoodleLoginPageUiMap as Record<string, UiMapEntry>,
  MoodleHomePageUiMap: MoodleHomePageUiMap as Record<string, UiMapEntry>,
  MoodleCourseUiMap: MoodleCourseUiMap as Record<string, UiMapEntry>,
  moodleParticipantsUiMap: MoodleParticipantUiMap as Record<string, UiMapEntry>,

  // Direct Page Maps - MHE
  MheLoginUiMap: MheLoginUiMap as Record<string, UiMapEntry>,
  mheLoginUiMap: MheLoginUiMap as Record<string, UiMapEntry>, // Alias safeguard
  MheHomePageUiMap: MheHomePageUiMap as Record<string, UiMapEntry>,

  // Direct Page Maps - Temp Experiments
  
  AngularTableUiMap: AngularTableUiMap as Record<string, UiMapEntry>,
  angularTableUiMap: AngularTableUiMap as Record<string, UiMapEntry>,
  AgGridTableUiMap: AgGridTableUiMap as Record<string, UiMapEntry>,
  agGridTableUiMap: AgGridTableUiMap as Record<string, UiMapEntry>,
  CustomSelectUiMap,
  customSelectUiMap: CustomSelectUiMap as Record<string, UiMapEntry>,
  ReactSelectUiMap: ReactSelectUiMap as Record<string,UiMapEntry>,
  RadioGroupUiMap: RadioGroupUiMap as Record<string,UiMapEntry>,
  AngularRadioGroupUiMap: AngularRadioGroupUiMap as Record<string,UiMapEntry>,
  AngularMaterialCardUiMap: AngularMaterialCardUiMap as Record<string,UiMapEntry>,
  MuiAutocompleteUiMap: MuiAutocompleteUiMap as Record<string,UiMapEntry>,

};