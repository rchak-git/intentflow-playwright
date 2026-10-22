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
                exact: def.exact,
            });
        case 'label':
            return page.getByLabel(def.text, {
                exact: def.exact, // <-- Forward exact flag to Playwright
            });
        case 'text':
            return page.getByText(def.text, {
                exact: def.exact, // <-- Forward exact flag to Playwright
            });
        case 'placeholder':
            return page.getByPlaceholder(def.text, {
                exact: def.exact, // <-- Forward exact flag to Playwright
            });
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