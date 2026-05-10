import { ParserError } from "parse5";

export type NotificationType = "info" | "error" | "suggestion";
export type InfoNotificationCategory = "success" | "error" | "info" | "warning";

// Define the specific data types for each notification type
export interface InfoNotificationData {
  message: string;
  category: InfoNotificationCategory;
}

export interface ErrorNotificationData {
  message: string;
  type: "parse";
  error: ParserError;
}

export interface SuggestionNotificationData {
  message: string;
}

// Map notification types to their corresponding data types
type NotificationDataMap = {
  info: InfoNotificationData;
  error: ErrorNotificationData;
  suggestion: SuggestionNotificationData;
};

// Generic NotificationEvent interface
export interface NotificationEvent<
  T extends NotificationType = NotificationType,
> {
  type: T;
  data: NotificationDataMap[T];
  action?: () => void;
  duration?: number; // Duration in milliseconds
}
