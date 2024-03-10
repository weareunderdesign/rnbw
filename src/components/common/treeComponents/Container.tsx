import React, { FC } from "react";
import { ContainerProps } from "./types";

export const Container: FC<ContainerProps> = ({ containerProps, children }) => {
  return <ul {...containerProps}>{children}</ul>;
};
