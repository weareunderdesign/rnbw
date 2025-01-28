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
        className={`
          padding-xs 
          radius-xs 
          flex 
          items-center 
          justify-center 
          ${isHover ? "background-secondary" : ""}
        `}
        onClick={(e) => {
          e.stopPropagation();
          onClick(e); 
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SVGIconI 
          {...{ 
            class: "icon-xs bg-secondary",
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }
          }}
        >
          {iconName}
        </SVGIconI>
      </div>
    );
  };
  
export default IconButton;