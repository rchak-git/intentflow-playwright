import { UiMapEntry } from '../../types/uiMapTypes';

export const MultipleWindowsUiMap: Record<string, UiMapEntry> = {
  herokuapp_windows_pageHeader: {
    widgetType: 'LABEL',
    strategy: 'role',
    role: 'heading',
    name: 'Opening a new window',
    exact: true,
    description: 'Main heading on the Herokuapp Multiple Windows parent page',
  },
  herokuapp_windows_clickHereLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    name: 'Click Here',
    exact: true,
    description: 'Link that opens a new browser tab (/windows/new)',
  },
  herokuapp_newWindow_pageHeader: {
    widgetType: 'LABEL',
    strategy: 'role',
    role: 'heading',
    name: 'New Window',
    exact: true,
    description: 'Heading rendered inside the newly opened child browser tab',
  },
};