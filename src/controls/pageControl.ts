import { expect, Page } from '@playwright/test';

export class PageControl {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  public async verifyPageLevel(assertion: string, expectedValue?: string): Promise<void> {
    switch (assertion) {
      case 'CONTAIN_TEXT':
      case 'CONTAINS_TEXT':
        if (!expectedValue) {
          throw new Error(`Assertion "${assertion}" requires an expected string value.`);
        }
        // Checks whether text exists anywhere within the entire page body
        await expect(this.page.locator('body')).toContainText(expectedValue);
        break;

      case 'EQUALS':
        if (!expectedValue) {
          throw new Error(`Assertion "${assertion}" requires an expected string value.`);
        }
        await expect(this.page).toHaveURL(expectedValue);
        break;

      default:
        throw new Error(`Unsupported page-level assertion "${assertion}".`);
    }
  }
}