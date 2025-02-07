import { NotificationType } from "@src/types";
import { notify } from "./notificationService";

// Define the bridge interface
interface Rnbw {
  notify: (type: NotificationType, message: string, duration?: number) => void;
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
