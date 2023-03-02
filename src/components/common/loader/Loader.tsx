import React, {
  useEffect,
  useMemo,
} from 'react';

import { LoaderProps } from './types';

export const Loader = (props: LoaderProps) => {
  const animationName = useMemo(() => `loading-bar-animation`, [])
  const keyframesStyle = useMemo(() => `
    @keyframes ${animationName} {
      0% {
        left: 0%;
        right: 100%;
        width: 0%;
      }
    
      10% {
        left: 0%;
        right: 75%;
        width: 10%;
      }
    
      90% {
        right: 0%;
        left: 75%;
        width: 10%;
      }
    
      100% {
        left: 100%;
        right: 0%;
        width: 0%;
      }
    }
  `, [animationName])

  useEffect(() => {
    const styleElement = document.createElement('style')
    let styleSheet = null

    document.head.appendChild(styleElement)

    styleSheet = styleElement.sheet

    styleSheet?.insertRule(keyframesStyle, styleSheet?.cssRules.length)
  }, [])

  return <>
    {props.show && <div style={{
      zIndex: "1",
      position: 'absolute',
      height: '2px',
      background: 'var(--color-tertiary-foreground)',
      animation: `${animationName} 5s linear infinite`,
    }} />}
  </>
}