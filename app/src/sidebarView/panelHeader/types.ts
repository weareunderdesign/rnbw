import { ReactNode, MouseEventHandler } from "react";

export interface PanelHeaderProps {
  id?: string;
  height?: string;
  className?: string;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLElement>;
}
