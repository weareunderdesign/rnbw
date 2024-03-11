import { ReactNode } from "react";
export type ResizablePanelsProps = {
  actionPanel: ReactNode;
  stageView: ReactNode;
  codeView: ReactNode;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => any;
