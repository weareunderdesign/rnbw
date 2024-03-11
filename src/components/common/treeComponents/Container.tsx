/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import React, { FC } from "react";
import { ContainerProps } from "./types";

export const Container: FC<ContainerProps> = ({ containerProps, children }) => {
  return <ul {...containerProps}>{children}</ul>;
};
