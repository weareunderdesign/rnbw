import { TToast } from '@_types/global';

export type ToastProps = {
  messages: TToast[],
}

export type ToastItemProps = {
  index: number,
  title: string,
  description: string,
}