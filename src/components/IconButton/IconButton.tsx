import React, { useState } from "react";
import { SVGIconI } from "../svgIcon";

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
        <SVGIconI {...{ class: "icon-xs bg-secondary" }}>{iconName}</SVGIconI>
      </div>
    );
  };
  
  

export default IconButton