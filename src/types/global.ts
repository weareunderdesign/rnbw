export type TToastType = "success" | "warning" | "info" | "error";
export type TToast = {
  type: TToastType;
  title?: string;
  content: string;
};

export type NotificationType = "success" | "error" | "info" | "warning";

export interface NotificationEvent {
  type: NotificationType;
  message: string;
  duration?: number; // Duration in milliseconds
}
