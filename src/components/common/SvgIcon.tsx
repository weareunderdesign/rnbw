import React, { useMemo, ReactNode } from "react";

export type SvgIconProps = {
  children?: ReactNode[] | ReactNode;
  [propName: string]: any;
};

const createSVGIcon = (props: SvgIconProps) => {
  const SVGIcon = useMemo<keyof JSX.IntrinsicElements>(() => {
    return "svg-icon" as keyof JSX.IntrinsicElements;
  }, []);
  return <SVGIcon {...props}></SVGIcon>;
};

export const SVGIcon = createSVGIcon;
export const SVGIconI = createSVGIcon;
export const SVGIconII = createSVGIcon;
export const SVGIconIII = createSVGIcon;

export const SVGIconIV = ({ src, ...rest }: { src: string } & SvgIconProps) => {
  const SVGIcon = useMemo<keyof JSX.IntrinsicElements>(() => {
    return "svg-icon" as keyof JSX.IntrinsicElements;
  }, []);
  return <SVGIcon src={src} {...rest} />;
};