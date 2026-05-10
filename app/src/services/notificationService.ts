import { ParserError } from "parse5";
import eventEmitter from "./eventEmitter";
import { InfoNotificationCategory, NotificationEvent } from "@src/types";

const emitNotification = (event: NotificationEvent) => {
  eventEmitter.emit("notification", event);
};

const notify = (notification: NotificationEvent) => {
  const { type, data, duration } = notification;
  if (type === "info") {
    emitNotification({ type, data: { ...data, category: "info" }, duration });
  } else if (type === "error") {
    emitNotification({
      type,
      data: { ...data, type: "parse" },
      duration,
    });
  } else {
    emitNotification({ type, data, duration });
  }
};

notify.info = (category: InfoNotificationCategory, message: string) => {
  emitNotification({
    type: "info",
    data: {
      message,
      category,
    },
  });
};

notify.error = (type: "parse", message: string, error: ParserError) => {
  emitNotification({
    type: "error",
    data: {
      message,
      type,
      error,
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
