import eventEmitter from "./eventEmitter";
import {
  InfoNotificationCategory,
  NotificationEvent,
  NotificationType,
} from "@src/types";

const emitNotification = (event: NotificationEvent) => {
  eventEmitter.emit("notification", event);
};

interface NotifyFunction {
  (type: NotificationType, message: string, duration?: number): void;
  info: (category: InfoNotificationCategory, message: string) => void;
  error: (type: "parse", message: string) => void;
  suggestion: (message: string) => void;
}

const notify = ((
  type: NotificationType,
  message: string,
  duration?: number,
) => {
  if (type === "info") {
    emitNotification({ type, data: { message, category: "info" }, duration });
  } else if (type === "error") {
    emitNotification({ type, data: { message, type: "parse" }, duration });
  } else {
    emitNotification({ type, data: { message }, duration });
  }
}) as NotifyFunction;

notify.info = (category: InfoNotificationCategory, message: string) => {
  emitNotification({
    type: "info",
    data: {
      message,
      category,
    },
  });
};

notify.error = (type: "parse", message: string) => {
  emitNotification({
    type: "error",
    data: {
      message,
      type,
    },
  });
};

notify.suggestion = (message: string) => {
  emitNotification({
    type: "suggestion",
    data: { message },
  });
};

export { notify };
