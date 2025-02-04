import React, { useState, useEffect } from "react";
import NotificationComponent from "./NotificationComponent";
import eventEmitter from "@_services/eventEmitter";
import { NotificationEvent } from "@_types/global";
import "./notification.css";
import { nanoid } from "nanoid";

interface NotificationData extends NotificationEvent {
  id: string;
}

export const NotificationContainer: React.FC = () => {
  console.log("NotificationContainer mounted");
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    const addNotification = (event: NotificationEvent) => {
      console.log("Received notification:", event);
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
        <NotificationComponent
          key={notif.id}
          {...notif}
          duration={notif.duration || 5000}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
};
