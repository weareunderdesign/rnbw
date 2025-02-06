import { SVGIcon } from "@src/components";
import React, { useEffect, useState, useRef } from "react";

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
  const [progress, setProgress] = useState(100);
  const [mounted, setMounted] = useState(false);
  const progressTimerRef = useRef<NodeJS.Timeout>();
  const mountTimerRef = useRef<number>();

  const getToastColor = () => {
    switch (type) {
      case "success":
        return "#4CAF50";
      case "error":
        return "#F44336";
      case "warning":
        return "#FFA726";
      default:
        return "#2196F3";
    }
  };

  const getToastIcon = () => {
    switch (type) {
      case "success":
        return "checkbox";
      case "error":
        return "cross";
      case "warning":
        return "triangle";
      default:
        return "help";
    }
  };

  useEffect(() => {
    mountTimerRef.current = requestAnimationFrame(() => {
      setMounted(true);
    });

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
          }
          // Schedule close for next tick to avoid state updates during render
          setTimeout(() => onClose(id), 0);
          return 0;
        }
        return prev - 100 / (duration / 100);
      });
    }, 100);

    return () => {
      if (mountTimerRef.current) {
        cancelAnimationFrame(mountTimerRef.current);
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, [duration, id, onClose]);

  return (
    <div
      className="panel border radius-s"
      style={{
        minWidth: "250px",
        width: "100%",
        transform: `translateY(${mounted ? 0 : "100%"})`,
        opacity: mounted ? 1 : 0,
        transition: "transform 0.4s ease-out, opacity 0.4s ease-out",
      }}
    >
      <div
        className="background-secondary padding-m gap-s align-center"
        style={{
          border: `1px solid ${getToastColor()}20`,
        }}
      >
        <div style={{ color: getToastColor() }}>
          <SVGIcon name={getToastIcon()} prefix="raincons" className="icon-s" />
        </div>
        <p>{message}</p>

        <span onClick={() => onClose(id)}>&times;</span>
        <div
          className="radius-s"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: "3px",
            width: `${progress}%`,
            backgroundColor: getToastColor(),
            transition: "width 0.1s linear",
          }}
        />
      </div>
    </div>
  );
};

export default Notification;
