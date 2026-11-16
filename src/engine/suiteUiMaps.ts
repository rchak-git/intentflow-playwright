import type { SuiteSpec } from '../types/intentSchema';
import type { UiMapEntry } from '../types/uiMapTypes';
import { GLOBAL_UI_MAP, UI_MAP_REGISTRY } from '../registries/UiMapIndex';

export function resolveSuiteUiMaps(suite: SuiteSpec): {
  uiMap: Record<string, UiMapEntry>;
  missingMaps: string[];
} {
  const paths = suite.uiMap ? (Array.isArray(suite.uiMap) ? suite.uiMap : [suite.uiMap]) : [];
  let uiMap = { ...GLOBAL_UI_MAP };
  const missingMaps: string[] = [];

  for (const rawPath of paths) {
    if (!rawPath) continue;
    const key = rawPath.replace(/^.*[\\/]/, '').replace(/\.(ts|js|json|map)$/, '');
    const map = UI_MAP_REGISTRY[rawPath] || UI_MAP_REGISTRY[key];
    if (map) uiMap = { ...uiMap, ...map };
    else missingMaps.push(rawPath);
  }
  return { uiMap, missingMaps };
}
