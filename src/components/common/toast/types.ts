import { Message } from '@_redux/main';

export type ToastProps = {
  messages: Message[],
  /* children: ReactNode[] | ReactNode,
  open: boolean,
  onClose: () => void, */
}

export type ToastItemProps = {
  key: number,
  title: string,
  description: string,
}