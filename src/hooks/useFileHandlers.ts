import { useState } from "react";

import { TFileHandlerCollection } from "@_node/index";

export const useFileHandlers = () => {
  const [fileHandlers, setFileHandlers] = useState<TFileHandlerCollection>({});

  return {
    fileHandlers,
    setFileHandlers,
  };
};
