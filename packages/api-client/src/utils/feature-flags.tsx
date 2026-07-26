import * as React from 'react';

/**
 * Typed feature-flag factory.
 *
 * Each app calls `createFeatureFlags()` with its own flag set; the factory
 * returns a `Provider` (so flags can be overridden in tests / preview
 * branches) and two hooks that are statically typed against the app's flag
 * names. No string typos — TypeScript catches them.
 *
 * Usage in an app:
 *
 *   // app/feature-flags.ts
 *   import { createFeatureFlags } from '@kshuri/api-client';
 *   export const {
 *     FeatureFlagsProvider,
 *     useFeatureFlag,
 *     useFeatureFlags,
 *   } = createFeatureFlags({
 *     newBookingFlow: true,
 *     mobileApp:      false,
 *     inventory:      false,
 *   });
 *
 *   // app/App.tsx
 *   <FeatureFlagsProvider>...</FeatureFlagsProvider>
 *
 *   // anywhere
 *   const newBookingFlow = useFeatureFlag('newBookingFlow');
 *   if (!newBookingFlow) return notFound();
 *
 * Override pattern (preview / test):
 *
 *   <FeatureFlagsProvider value={{ ...defaultFlags, mobileApp: true }}>
 *     <App />
 *   </FeatureFlagsProvider>
 */
export function createFeatureFlags<TFlags extends Record<string, boolean>>(
  defaults: TFlags,
): {
  FeatureFlagsProvider: React.FC<{
    value?: Partial<TFlags>;
    children: React.ReactNode;
  }>;
  useFeatureFlag: <K extends keyof TFlags>(name: K) => TFlags[K];
  useFeatureFlags: () => TFlags;
} {
  const Context = React.createContext<TFlags>(defaults);

  const FeatureFlagsProvider: React.FC<{
    value?: Partial<TFlags>;
    children: React.ReactNode;
  }> = ({ value, children }) => {
    const merged = React.useMemo<TFlags>(
      () => ({ ...defaults, ...(value ?? {}) }),
      [value],
    );
    return React.createElement(Context.Provider, { value: merged }, children);
  };

  function useFeatureFlag<K extends keyof TFlags>(name: K): TFlags[K] {
    return React.useContext(Context)[name];
  }

  function useFeatureFlags(): TFlags {
    return React.useContext(Context);
  }

  return { FeatureFlagsProvider, useFeatureFlag, useFeatureFlags };
}
