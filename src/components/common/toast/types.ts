import { Message } from '@_redux/main';

export type ToastProps = {
  messages: Message[],
}

export type ToastItemProps = {
  index: number,
  title: string,
  description: string,
}