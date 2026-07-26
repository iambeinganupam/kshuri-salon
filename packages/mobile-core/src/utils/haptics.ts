import * as Haptics from "expo-haptics";

/**
 * Named haptic helpers. Keep call sites short and intent-revealing:
 *
 *   import { haptics } from '@kshuri/mobile-core';
 *   haptics.tap();         // light tap — buttons
 *   haptics.success();     // confirmation — booking confirmed, payment OK
 *   haptics.warning();     // soft warning — form validation
 *   haptics.error();       // hard error — request failed
 *
 * All calls are best-effort — silent failure on platforms without haptics.
 */
export const haptics = {
  tap(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  selection(): void {
    Haptics.selectionAsync().catch(() => {});
  },
  success(): void {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
  },
  warning(): void {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );
  },
  error(): void {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
      () => {},
    );
  },
};
