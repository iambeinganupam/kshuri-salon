import i18next, { type i18n as I18n, type InitOptions, type Resource } from 'i18next';
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next';
import * as React from 'react';

export interface CreateI18nOptions {
  /** Default locale ('en', 'en-IN', 'hi', etc.). Default: 'en-IN'. */
  defaultLocale?: string;
  /** Fallback locale used when a key is missing. Default: 'en'. */
  fallbackLocale?: string | string[];
  /** Translation resources, keyed by locale → namespace → key → string. */
  resources: Resource;
  /** Additional i18next options merged on top of the Kshuri defaults. */
  init?: Partial<InitOptions>;
}

export interface KshuriI18n {
  i18n: I18n;
  Provider: React.FC<{ children: React.ReactNode }>;
  /** Re-export of react-i18next's useTranslation, kept here for one-stop import. */
  useTranslation: typeof useTranslation;
}

/**
 * Initialise i18next + react-i18next with Kshuri defaults and return a typed
 * `Provider` + `useTranslation` pair. Call ONCE per app at boot.
 *
 *   // app/i18n.ts
 *   import { createI18n } from '@kshuri/i18n';
 *   import enIN from './locales/en-IN.json';
 *   import hi   from './locales/hi.json';
 *
 *   export const { Provider, useTranslation } = createI18n({
 *     defaultLocale: 'en-IN',
 *     resources: {
 *       'en-IN': { common: enIN },
 *       'hi':    { common: hi },
 *     },
 *   });
 *
 *   // app/App.tsx
 *   <Provider>...</Provider>
 *
 *   // anywhere
 *   const { t } = useTranslation();
 *   <h1>{t('common:welcome')}</h1>
 *
 * Production-grade defaults:
 *   - Suspense disabled (returns the key as the placeholder while loading)
 *     so a missing translation never throws a boundary.
 *   - `interpolation.escapeValue: false` (React already escapes).
 *   - `returnEmptyString: false` so missing values fall back to the key.
 *
 * NOTE: This is the scaffold half of item #16. Wrapping every UI string in
 * `t()` is a long-running adoption pass tracked separately.
 */
export function createI18n(opts: CreateI18nOptions): KshuriI18n {
  const instance = i18next.createInstance();

  void instance
    .use(initReactI18next)
    .init({
      lng: opts.defaultLocale ?? 'en-IN',
      fallbackLng: opts.fallbackLocale ?? 'en',
      resources: opts.resources,
      defaultNS: 'common',
      ns: Object.keys(opts.resources[opts.defaultLocale ?? 'en-IN'] ?? { common: {} }),
      interpolation: { escapeValue: false },
      returnEmptyString: false,
      react: { useSuspense: false },
      ...opts.init,
    });

  const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(I18nextProvider, { i18n: instance }, children);

  return { i18n: instance, Provider, useTranslation };
}
