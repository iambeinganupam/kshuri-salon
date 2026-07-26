// Per-app i18n boot. Provider wired in main.tsx. Per-string adoption
// happens as individual pages are touched. See @kshuri/i18n README.

import { createI18n } from '@kshuri/i18n';
import enIN from './locales/en-IN.json';

export const { Provider: I18nProvider, useTranslation, i18n } = createI18n({
  defaultLocale: 'en-IN',
  resources: {
    'en-IN': { common: enIN },
  },
});
