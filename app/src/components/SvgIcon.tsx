import React, { memo } from "react";

export type SvgIconProps = {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  src?: string;
  onClick?: () => void;
};

export const SVGIcon = memo((props: SvgIconProps) => {
  const { name, className, style, src, onClick } = props;

  return (
    <svg-icon class={className} name={name} style={style} src={src} onClick={onClick} />
  );
});
SVGIcon.displayName = "SVGIcon";

export default SVGIcon;
