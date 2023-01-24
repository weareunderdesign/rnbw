import { ReactNode } from 'react';

export type IFrameProps = {
  children: ReactNode | ReactNode[],
  [propName: string]: any,
}