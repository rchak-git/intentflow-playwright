import type { Page, Locator } from '@playwright/test';
import type { UiMapEntry,WebTableUiMapEntry} from '../types/uiMapTypes';

export function resolveUiEntryLocator(
  page: Page,
  uiEntry: UiMapEntry,
  subKey?: string,
  params?: Record<string, any>
): Locator {
  // 1. Resolve raw selector or text property
  const entryAsAny = uiEntry as Record<string, any>;
  let selector = uiEntry.selector || entryAsAny.text || entryAsAny.name || '';

  // Inject sub-key locator if applicable
 const tableEntry = uiEntry as WebTableUiMapEntry;

if (subKey && tableEntry.columns && subKey in tableEntry.columns) {
  const col = tableEntry.columns[subKey];
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