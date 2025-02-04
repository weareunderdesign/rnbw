import { NotificationEvent } from "@src/types";
import { ParsingError } from "@src/features/codeView/ParsingErrorsPanel";

type EventMap = {
  notification: [NotificationEvent];
  parseError: [ParsingError[]];
  [key: string]: unknown[];
};

type Listener<T extends unknown[]> = (...args: T) => void;

class EventEmitter {
  private events: { [K in keyof EventMap]?: Listener<EventMap[K]>[] } = {};

  on<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>,
  ): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event]?.push(listener);
  }

  off<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>,
  ): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event]?.filter((l) => l !== listener);
  }

  emit<K extends keyof EventMap>(event: K, ...args: EventMap[K]): void {
    console.log("EventEmitter emit:", event, args);
    if (!this.events[event]) return;
    this.events[event]?.forEach((listener) => {
      try {
        listener(...args);
      } catch (error) {
        console.error("Error in event listener:", error);
      }
    });
  }
}

export default new EventEmitter();
