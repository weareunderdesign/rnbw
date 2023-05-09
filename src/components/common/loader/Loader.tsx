import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import LoadingBar from 'react-top-loading-bar';

import { MainContext } from '@_redux/main/context';

import { LoaderProps } from './types';

export const Loader = (props: LoaderProps) => {
  let paceTimer: NodeJS.Timer
  const [progress, setProgress] = useState(0)
  const animationName = useMemo(() => `loading-bar-animation`, [])

  const {
    theme,
  } = useContext(MainContext)

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
  useEffect(() => {
    console.log(props.show)
    if (props.show) {
      paceTimer = setInterval(() => {
        let temp = progress
        setProgress(temp + 3) 
      }, 20)
    }
    else{
      setProgress(0)
      clearInterval(paceTimer)
    }
    return () => clearInterval(paceTimer)
  }, [props.show, progress])
  useEffect(() => {
    if (progress > 97){
      clearInterval(paceTimer)
    }
  }, [progress])
  return <>
    {props.show && <LoadingBar color={theme === 'Light' ? '#111' : '#fff'} progress={progress} shadow={true} />}
  </>
}