import React, { memo } from "react";

export type SvgIconProps = {
  name?: "page" | "folder" | string;
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  src?: string;
  onClick?: () => void;
};

export const SVGIcon = memo((props: SvgIconProps) => {
  const { name, className, prefix = "raincons", style, src, onClick } = props;

  return (
    <svg-icon class={className} style={style} src={src} onClick={onClick}>
      {name ? `${prefix}/${name}` : ""}
    </svg-icon>
  );
});
SVGIcon.displayName = "SVGIcon";

export default SVGIcon;
