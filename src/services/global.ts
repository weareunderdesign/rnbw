import { Message } from '@_types/socket';

// return JSON string from the message
export const createMessage = (message: Message): string => {
  return JSON.stringify(message)
}