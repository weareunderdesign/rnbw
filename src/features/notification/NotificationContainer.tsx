import React, { useState, useEffect, CSSProperties } from "react";
import Notification from "./Notification";
import eventEmitter from "@_services/eventEmitter";
import { NotificationEvent } from "@src/types";
import { nanoid } from "nanoid";

const notificationContainerStyle: CSSProperties = {
  position: "fixed",
  top: "20px",
  right: "20px",
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};
interface NotificationData extends NotificationEvent {
  id: string;
}

export const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    const addNotification = (event: NotificationEvent) => {
      const id = nanoid();
      setNotifications((prev) => [...prev, { ...event, id }]);
    };

    eventEmitter.on("notification", addNotification);

    // Cleanup listener on unmount
    return () => {
      eventEmitter.off("notification", addNotification);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  return (
    <div style={notificationContainerStyle}>
      {notifications.map((notif) => (
        <Notification
          key={notif.id}
          {...notif}
          duration={notif.duration || 5000}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
