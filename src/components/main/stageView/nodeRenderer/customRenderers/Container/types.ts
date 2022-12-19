import { ReactNode } from 'react';

export type ContainerProps = {
  children: ReactNode | ReactNode[],
  [attrName: string]: any,
}