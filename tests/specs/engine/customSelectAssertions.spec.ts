import { expect, test } from '@playwright/test';
import { CustomSelectControl } from '../../../src/controls/customSelectControl';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import type { SuiteSpec } from '../../../src/types/intentSchema';
import type { UiMapEntry } from '../../../src/types/uiMapTypes';

const uiMap: Record<string, UiMapEntry> = {
  state: { widgetType: 'CUSTOM_SELECT', strategy: 'css', selector: '#state' },
};

test('custom-select equality checks the complete displayed value through the dispatcher', async ({ page }) => {
  await page.setContent('<div id="state"><span class="mat-mdc-select-value">Texas</span></div>');
  const suite: SuiteSpec = {
    uiMap: 'globalUiMap',
    profiles: {
      root: {
        steps: [
          { fieldKey: 'state', intent: 'verify', params: { subIntent: 'equals', value: 'Texas' } },
          { fieldKey: 'state', intent: 'verify', params: { subIntent: 'contains', value: 'Tex' } },
        ],
      },
    },
  };
  await new CommandDispatcher(uiMap, suite).executeProfile(page, 'root');
  const control = new CustomSelectControl(page, uiMap.state);
  await expect(control.verify('equals', 'Tex', { timeout: 500 })).rejects.toThrow();
});

test('custom-select equality uses the host when no value container exists', async ({ page }) => {
  await page.setContent('<div id="state">California</div>');
  const control = new CustomSelectControl(page, uiMap.state);
  await control.verify('equals', 'California');
  await control.verify('contains', 'Cal');
  await expect(control.verify('equals', 'Cal', { timeout: 500 })).rejects.toThrow();
});
