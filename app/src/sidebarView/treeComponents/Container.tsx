import React from "react";
import { ContainerProps } from "./types";

export const Container = ({ containerProps, children }: ContainerProps) => {
  return <ul {...containerProps}>{children}</ul>;
};
Container.displayName = "Container";
