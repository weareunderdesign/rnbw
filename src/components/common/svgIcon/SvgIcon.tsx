import React, { useMemo } from 'react';

import { SvgIconProps } from './types';

export const SVGIcon = (p: SvgIconProps) => {
  const SVGIcon = useMemo<keyof JSX.IntrinsicElements>(() => {
    return 'svg-icon' as keyof JSX.IntrinsicElements
  }, [])
  return <>
    <SVGIcon {...p}></SVGIcon>
  </>
}
export const SVGIconI = (p: SvgIconProps) => {
  const SVGIcon = useMemo<keyof JSX.IntrinsicElements>(() => {
    return 'svg-icon' as keyof JSX.IntrinsicElements
  }, [])
  return <>
    <SVGIcon {...p}></SVGIcon>
  </>
}
export const SVGIconII = (p: SvgIconProps) => {
  const SVGIcon = useMemo<keyof JSX.IntrinsicElements>(() => {
    return 'svg-icon' as keyof JSX.IntrinsicElements
  }, [])
  return <>
    <SVGIcon {...p}></SVGIcon>
  </>
}
export const SVGIconIII = (p: SvgIconProps) => {
  const SVGIcon = useMemo<keyof JSX.IntrinsicElements>(() => {
    return 'svg-icon' as keyof JSX.IntrinsicElements
  }, [])
  return <>
    <SVGIcon {...p}></SVGIcon>
  </>
}