import client from "./axiosClient";

type NotifResponse = {
  status: boolean;
  message: string;
  body?: {
    message?: string;
  };
};

type PayloadNotif = {
  title: string;
  body: string;
  icon: string;
  data?: {
    url: string;
    tag: string;
  };
  // message: string;
};

export const subscribeToPushNotifications = async (
  subscription: PushSubscription,
  userId: number
) => {
  try {
    console.log(subscription);
    const response = await client.post<NotifResponse>("/subscribe", {
      ...subscription.toJSON(),
      // keys: subscription.toJSON().keys,
      user_id: userId,
    });
    console.log("Subscription saved successfully:", response.data.message);
  } catch (error) {
    console.error("Error saving subscription:", error);
  }
};

export const enableNotifications = async (userId: number) => {
  if (!("serviceWorker" in navigator)) {
    console.error("Service workers are not supported in this browser.");
    return;
  }

  // Request Notification Permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.error("Notification permission denied.");
    return;
  }
  console.log("Notification permission granted.");

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_PUBLIC_VAPID_KEY!
      )!,
    });
    console.log("SUBSCRIPTION :", subscription);
    await subscribeToPushNotifications(subscription, userId);
  } catch (error) {
    console.error("Error enabline notifications:", error);
  }
};

// Helper function to convert VAPID key to Uint8Array
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export type PushChatNotification = {
  name: string;
  to_id: string;
  room_id: string;
  message: string;
};

export type PushFeedNotification = {
  name: string;
  user_id: string;
  content: string;
};
export async function sendNotificationChat(payload: PushChatNotification) {
  try {
    const response = await client.post("/sendChat", payload);
    console.log("Notification sent successfully", response.data);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

export async function sendNotificationFeed(payload: PushFeedNotification) {
  try {
    const response = await client.post("/sendFeed", payload);
    console.log("Notification sent successfully", response.data);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

export async function handleSendNotification(
  id: number,
  payload: PayloadNotif
) {
  try {
    const response = await client.post("/send", {
      user_id: id,
      payload: payload,
    });
    console.log("Notification sent successfully", response.data);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
