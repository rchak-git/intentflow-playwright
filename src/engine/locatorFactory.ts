// src/engine/locatorFactory.ts
import type { Page, Locator, FrameLocator } from '@playwright/test';
import type { UiMapEntry, WebTableUiMapEntry, StandardUiMapEntry, CustomSelectUiMapEntry } from '../types/uiMapTypes';
import type { StepParams } from '../types/intentSchema';

export function resolveUiEntryLocator(
  page: Page,
  uiEntry: UiMapEntry,
  subKey?: string,
  params?: StepParams
): Locator {
  // 1. Resolve frame context: FrameLocator if frameSelector is defined, otherwise Page
  const context: Page | FrameLocator = uiEntry.frameSelector
    ? page.frameLocator(uiEntry.frameSelector)
    : page;

  const entryAsAny = uiEntry as Record<string, any>;
  let selector = uiEntry.selector || entryAsAny.text || entryAsAny.name || '';
  let activeStrategy = uiEntry.strategy;

  // 2. Resolve sub-key or table sub-selector mapping
  const subSelectableEntry = uiEntry as WebTableUiMapEntry | CustomSelectUiMapEntry;
  if (subKey && subSelectableEntry.subSelectors && subKey in subSelectableEntry.subSelectors) {
    selector = subSelectableEntry.subSelectors[subKey] || '';
    // Sub-selectors (like overlayPanel or option) are CSS/XPath selectors, not labels
    activeStrategy = selector.startsWith('/') || selector.startsWith('xpath=') ? 'xpath' : 'css';
  } else if (subKey) {
    const tableEntry = uiEntry as WebTableUiMapEntry;
    if (tableEntry.columns && subKey in tableEntry.columns) {
      const col = tableEntry.columns[subKey];
      if (typeof col === 'object' && 'subSelector' in col && col.subSelector) {
        selector = col.subSelector;
        activeStrategy = selector.startsWith('/') || selector.startsWith('xpath=') ? 'xpath' : 'css';
      }
    } else {
      selector = subKey;
      activeStrategy = selector.startsWith('/') || selector.startsWith('xpath=') ? 'xpath' : 'css';
    }
  }

  // 3. Inject dynamic parameters into template placeholders (e.g., {text}, {id}, {value})
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, val]) => {
      if (typeof val === 'string' || typeof val === 'number') {
        selector = selector.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
      }
    });
  }

  // 4. Assemble locator based on strategy from the resolved context
  let baseLocator: Locator;

  switch (activeStrategy) {
    case 'label':
      baseLocator = context.getByLabel(selector, { exact: !!uiEntry.exact });
      break;

    case 'role': {
      const roleName = (uiEntry as StandardUiMapEntry).role || 'button';
      baseLocator = context.getByRole(roleName as any, {
        name: selector,
        exact: !!uiEntry.exact,
      });
      break;
    }

    case 'text':
      baseLocator = context.getByText(selector, { exact: !!uiEntry.exact });
      break;

    case 'placeholder':
      baseLocator = context.getByPlaceholder(selector, { exact: !!uiEntry.exact });
      break;

    case 'testId':
      baseLocator = context.getByTestId(selector);
      break;

    case 'xpath':
      baseLocator = context.locator(`xpath=${selector}`);
      break;

    case 'css':
    default:
      baseLocator = context.locator(selector);
      break;
  }

  return baseLocator;
}