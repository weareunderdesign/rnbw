import React, { FC } from "react";
import { PanelHeaderProps } from "./types";

export const PanelHeader: FC<PanelHeaderProps> = ({
  children,
  onClick,
  id,
  className,
  height = "20px",
}) => {
  return (
    <div
      id={id}
      className={`flex justify-stretch align-center ${className}`}
      style={{ height, boxSizing: "content-box" }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
