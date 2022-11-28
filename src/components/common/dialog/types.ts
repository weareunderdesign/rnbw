import { ReactNode } from 'react';

export type DialogProps = {
  children: ReactNode[] | ReactNode,
  open: boolean,
  onClose: () => void,
}