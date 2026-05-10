export type NotificationType = "success" | "error" | "info" | "warning";

export interface NotificationEvent {
  type: NotificationType;
  message: string;
  duration?: number; // Duration in milliseconds
}
