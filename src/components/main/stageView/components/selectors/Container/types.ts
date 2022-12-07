import { ReactNode } from 'react';

export type ContainerProps = {
  background: Record<'r' | 'g' | 'b' | 'a', number>,
  color: Record<'r' | 'g' | 'b' | 'a', number>,
  flexDirection: string,
  alignItems: string,
  justifyContent: string,
  fillSpace: string,
  width: string,
  height: string,
  padding: string[],
  margin: string[],
  marginTop: number,
  marginLeft: number,
  marginBottom: number,
  marginRight: number,
  shadow: number,
  children: ReactNode[] | ReactNode,
  radius: number,
}