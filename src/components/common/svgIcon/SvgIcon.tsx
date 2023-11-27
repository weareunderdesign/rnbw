import React, { useMemo } from "react";

import { SvgIconProps } from "./types";

export const SVGIcon = (props: SvgIconProps) => {
  const SVGIcon = useMemo<keyof JSX.IntrinsicElements>(() => {
    return "svg-icon" as keyof JSX.IntrinsicElements;
  }, []);
  return <SVGIcon {...props}></SVGIcon>;
};
export const SVGIconI = (props: SvgIconProps) => {
  const SVGIcon = useMemo<keyof JSX.IntrinsicElements>(() => {
    return "svg-icon" as keyof JSX.IntrinsicElements;
  }, []);
  return <SVGIcon {...props}></SVGIcon>;
};
export const SVGIconII = (props: SvgIconProps) => {
  const SVGIcon = useMemo<keyof JSX.IntrinsicElements>(() => {
    return "svg-icon" as keyof JSX.IntrinsicElements;
  }, []);
  return <SVGIcon {...props}></SVGIcon>;
};
export const SVGIconIII = (props: SvgIconProps) => {
  const SVGIcon = useMemo<keyof JSX.IntrinsicElements>(() => {
    return "svg-icon" as keyof JSX.IntrinsicElements;
  }, []);
  return <SVGIcon {...props}></SVGIcon>;
};
