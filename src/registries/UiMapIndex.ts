// src/registries/uiMapIndex.ts
import { GLOBAL_UI_MAP as MOODLE_UI_MAP } from './Moodle/globalUiMap';
import { mheLoginUiMap } from './mheLoginUiMap';
import { studentDashboardUiMap } from './studentDashboardUiMap';
import { assessmentsUiMap } from './assessmentsUiMap'; // 👈 Import new map
import type { UiMapEntry } from '../types/uiMapTypes';

// Consolidated McGraw Hill AUT Map
export const MHE_UI_MAP: Record<string, UiMapEntry> = {
  ...mheLoginUiMap,
  ...studentDashboardUiMap,
  ...assessmentsUiMap, // 👈 Spread here
};

// Unified Global Map
export const GLOBAL_UI_MAP: Record<string, UiMapEntry> = {
  ...MOODLE_UI_MAP,
  ...MHE_UI_MAP,
};

export const UI_MAP_REGISTRY: Record<string, Record<string, UiMapEntry>> = {
  globalUiMap: MOODLE_UI_MAP,
  mheUiMap: MHE_UI_MAP,
  studentDashboardUiMap,
  mheLoginUiMap,
  assessmentsUiMap,
};