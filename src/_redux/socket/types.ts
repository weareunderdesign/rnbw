import { Message } from '@_types/global';

// Main State
export type SocketState = {
  connected: boolean, // connected before inited
  inited: boolean,
  pending: boolean,
  pendingRequest?: Message | null,
}