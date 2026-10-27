import type { Page, Locator } from '@playwright/test';
import type { UiMapEntry } from '../types/uiMapTypes';

export function resolveUiEntryLocator(
  page: Page,
  uiEntry: UiMapEntry,
  subKey?: string,
  params?: Record<string, any>
): Locator {
  // 1. Resolve raw selector or text property
  let selector = uiEntry.selector || uiEntry.text || uiEntry.name || '';

  // Inject sub-key locator if applicable
  if (subKey && uiEntry.columns && subKey in uiEntry.columns) {
    const col = uiEntry.columns[subKey];
    if (typeof col === 'object' && 'subSelector' in col && col.subSelector) {
      selector = col.subSelector;
    }
  }

  // 2. Inject dynamic parameters into template placeholders (e.g. {text}, {id})
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, val]) => {
      if (typeof val === 'string' || typeof val === 'number') {
        selector = selector.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
      }
    });
  }

  // 3. Assemble locator based on strategy
  switch (uiEntry.strategy) {
    case 'label':
      return page.getByLabel(selector, { exact: !!uiEntry.exact });

    case 'role':
      return page.getByRole((uiEntry.role as any) || 'button', {
        name: selector,
        exact: !!uiEntry.exact,
      });

    case 'text':
      return page.getByText(selector, { exact: !!uiEntry.exact });

    case 'xpath':
      return page.locator(`xpath=${selector}`);

    case 'css':
    default:
      return page.locator(selector);
  }
}