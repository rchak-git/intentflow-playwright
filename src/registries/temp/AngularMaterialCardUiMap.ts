import type { UiMapEntry } from '../../types/uiMapTypes';

export const AngularMaterialCardUiMap: Record<string, UiMapEntry> = {
  ng_material_shibaCard: {
    widgetType: 'CARD',
    strategy: 'css',
    selector: 'mat-card.example-card',
    subSelectors: {
      avatar: '.mat-mdc-card-avatar',
      title: 'mat-card-title',
      subtitle: 'mat-card-subtitle',
      image: 'img[mat-card-image]',
      content: 'mat-card-content p',
      likeButton: 'mat-card-actions button:has-text("LIKE")',
      shareButton: 'mat-card-actions button:has-text("SHARE")'
    }
  }
};