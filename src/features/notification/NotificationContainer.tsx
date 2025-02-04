import React, { useState, useEffect } from "react";
import Notification from "./Notification";
import eventEmitter from "@_services/eventEmitter";
import { NotificationEvent } from "@src/types";
import { nanoid } from "nanoid";
import "./notification.css";

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
    <div className="notification-container">
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
