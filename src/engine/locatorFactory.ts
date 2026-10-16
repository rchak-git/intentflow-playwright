// src/engine/locatorFactory.ts
import type { Page, Locator } from '@playwright/test';
import type { UiMapEntry, LocatorDefinition, SemanticLocatorStrategy } from '../types/uiMapTypes';

export function resolveLocator(page: Page, def: LocatorDefinition): Locator {
    if (typeof def === 'string') {
        return page.locator(def);
    }

    switch (def.strategy) {
        case 'role':
            return page.getByRole(def.role, {
                name: def.name,
                exact: def.exact, // <-- Forward exact flag to Playwright
            });
        case 'label':
            return page.getByLabel(def.text);
        case 'text':
            return page.getByText(def.text);
        case 'placeholder':
            return page.getByPlaceholder(def.text);
        case 'css':
            return page.locator(def.selector);
        default:
            throw new Error(`Unsupported locator strategy configuration.`);
    }
}

export function resolveUiEntryLocator(page: Page, entry: UiMapEntry, key: string = 'main'): Locator {
    // Cast entry to a record so TypeScript allows dynamic string key lookup on union types
    const record = entry as Record<string, unknown>;

    if (key in record && record[key] !== undefined) {
        return resolveLocator(page, record[key] as LocatorDefinition);
    }

    return resolveLocator(page, entry as SemanticLocatorStrategy);
}