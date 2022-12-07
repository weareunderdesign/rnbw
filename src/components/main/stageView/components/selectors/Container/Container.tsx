import React from 'react';

import { Resizer } from '../Resizer';
import { ContainerProps } from './types';

const defaultProps = {
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  fillSpace: 'no',
  background: { r: 255, g: 255, b: 255, a: 1 },
  color: { r: 0, g: 0, b: 0, a: 1 },
  margin: ['0', '0', '0', '0'],
  padding: ['0', '0', '0', '0'],
  shadow: 0,
  radius: 0,
  width: '100%',
  height: 'auto',
}

export const Container = (props: Partial<ContainerProps>) => {
  props = {
    ...defaultProps,
    ...props,
  }
  const {
    flexDirection,
    alignItems,
    justifyContent,
    fillSpace,
    background,
    color,
    margin,
    padding,
    shadow,
    radius,
    children,
  } = props


  return (
    <Resizer
      propKey={{ width: 'width', height: 'height' }}
      style={{
        justifyContent,
        flexDirection,
        alignItems,
        background: `rgba(${Object.values(background as Record<'r' | 'g' | 'b' | 'a', number>)})`,
        color: `rgba(${Object.values(color as Record<'r' | 'g' | 'b' | 'a', number>)})`,
        padding: `${padding?.at(0)}px ${padding?.at(1)}px ${padding?.at(2)}px ${padding?.at(3)}px`,
        margin: `${margin?.at(0)}px ${margin?.at(1)}px ${margin?.at(2)}px ${margin?.at(3)}px`,
        boxShadow: shadow === 0 ? 'none' : `0px 3px 100px ${shadow}px rgba(0, 0, 0, 0.13)`,
        borderRadius: `${radius}px`,
        flex: fillSpace === 'yes' ? 1 : 'unset',
      }}
    >
      {children}
    </Resizer>
  )
}