import React, { FC, ReactNode } from "react";

interface PanelHeaderProps {
  children: ReactNode;
  onClick?: any;
  id?: string;
  className?: string;
}

export const PanelHeader: FC<PanelHeaderProps> = ({
  children,
  onClick,
  id,
  className,
}) => {
  return (
    <div
      id={id}
      className={`flex justify-stretch align-center ${className}`}
      style={{ height: "20px", boxSizing: "content-box" }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
