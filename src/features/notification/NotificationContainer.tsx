import React, { useState, useEffect, CSSProperties } from "react";
import Notification from "./Notification";
import eventEmitter from "@_services/eventEmitter";
import { NotificationEvent } from "@src/types";
import { nanoid } from "nanoid";

interface NotificationPosition {
  vertical: "top" | "bottom";
  horizontal: "left" | "right";
}

interface NotificationContainerProps {
  position?: NotificationPosition;
}

const getPositionStyle = (position?: NotificationPosition): CSSProperties => ({
  position: "fixed",
  bottom: position?.vertical === "top" ? undefined : "20px",
  top: position?.vertical === "top" ? "20px" : undefined,
  left: position?.horizontal === "right" ? undefined : "50%",
  right: position?.horizontal === "right" ? "20px" : undefined,
  transform: position?.horizontal === "right" ? undefined : "translateX(-50%)",
  zIndex: 1000,
  display: "flex",
  flexDirection: "column-reverse",
  gap: "10px",
});

interface NotificationData extends NotificationEvent {
  id: string;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  position,
}) => {
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
    <div style={getPositionStyle(position)}>
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
