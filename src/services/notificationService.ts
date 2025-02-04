import eventEmitter from "./eventEmitter";
import { NotificationType, NotificationEvent } from "@src/types";

export const notify = (
  type: NotificationType,
  message: string,
  duration?: number,
) => {
  const event: NotificationEvent = {
    type,
    message,
    duration: duration || 5000, // Default duration of 5 seconds
  };
  console.log("Emitting notification:", event);
  eventEmitter.emit("notification", event);
};
