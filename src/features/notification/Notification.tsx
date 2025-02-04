import React, { useEffect } from "react";
import "./notification.css";

interface NotificationProps {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration: number;
  onClose: (id: string) => void;
}

export const Notification: React.FC<NotificationProps> = ({
  id,
  type,
  message,
  duration,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div className={`notification ${type}`}>
      <div className="notification-content">
        <span className={`icon ${type}`}></span>
        <p>{message}</p>
      </div>
      <button className="close-btn" onClick={() => onClose(id)}>
        &times;
      </button>
    </div>
  );
};

export default Notification;
