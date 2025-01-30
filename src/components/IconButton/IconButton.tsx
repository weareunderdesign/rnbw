import React, { useState } from "react";
import SVGIcon from "../SvgIcon";

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
        <SVGIcon
        name={iconName}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="icon-xs bg-secondary"
       />
          
      </div>
    );
  };
  
export default IconButton;