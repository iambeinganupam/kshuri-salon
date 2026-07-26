import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

export interface PushRegistration {
  expoPushToken: string;
  deviceName?: string;
  platform: "ios" | "android" | "web" | "macos" | "windows";
}

/**
 * Request notification permission and obtain an Expo push token. The caller
 * is responsible for POSTing the result to the backend (endpoint TBD in a
 * future plan — `POST /api/v1/devices/register`).
 *
 * Returns `null` if the user denied permission or the device cannot receive
 * push notifications (simulators on iOS).
 */
export async function registerForPush(): Promise<PushRegistration | null> {
  if (!Device.isDevice) {
    return null; // Simulators don't support push.
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync();
  return {
    expoPushToken: tokenResult.data,
    deviceName: Device.deviceName ?? undefined,
    platform: Platform.OS as PushRegistration["platform"],
  };
}
