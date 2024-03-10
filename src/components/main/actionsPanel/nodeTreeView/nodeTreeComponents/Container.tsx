/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import React, { FC } from "react";

interface ContainerProps {
  children: React.ReactNode;
  containerProps: React.HTMLProps<any>;
}

export const Container: FC<ContainerProps> = React.memo(
  ({ containerProps, children }) => {
    return <ul {...containerProps}>{children}</ul>;
  },
);
