import { NotificationEvent } from "@src/types";
import { notify } from "./notificationService";

// Define the bridge interface
interface Rnbw {
  notify: (notification: NotificationEvent) => void;
}

// Create the bridge object
const rnbw: Rnbw = {
  notify,
};

declare global {
  interface Window {
    rnbw: Rnbw;
  }
}

// Initialize the bridge
export const initRnbwServices = () => {
  // Expose bridge to window
  window.rnbw = rnbw;
};
