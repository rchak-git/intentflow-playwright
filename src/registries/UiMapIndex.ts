import { mheLoginUiMap } from './mheLoginUiMap';
import { moodleLoginUiMap } from './Moodle/moodleLoginUiMap';
import type { UiMapEntry } from '../types/uiMapTypes';

/**
 * Master UI Map Registry mapping YAML suite paths to compiled TypeScript map objects.
 * Scale this file or split into separate indices as your project grows.
 */
export const UI_MAP_REGISTRY: Record<string, Record<string, UiMapEntry>> = {
    'src/registries/mheLoginUiMap.ts': mheLoginUiMap,
    'src/registries/Moodle/moodleLoginUiMap.ts': moodleLoginUiMap,
};