import { ReactNode } from "react";

export enum Direction {
  Top = "top",
  TopLeft = "top-left",
  TopRight = "top-right",
  Right = "right",
  Bottom = "bottom",
  BottomLeft = "bottom-left",
  BottomRight = "bottom-right",
  Left = "left",
}

export type ResizeProps = { children: ReactNode; scale: number };
