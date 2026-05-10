import React, { useState } from "react";
import { SVGIcon } from "@src/components";

const IconButton = ({
  iconName,
  onClick,
}: {
  iconName: string;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}) => {
  const [isHover, setIsHovered] = useState(false);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <div
      className={`padding-xs radius-xs ${isHover ? "background-secondary" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SVGIcon className="icon-xs bg-secondary" name={iconName} />
    </div>
  );
};

export default IconButton;
