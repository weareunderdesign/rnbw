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
