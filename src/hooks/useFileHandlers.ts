import { useState } from "react";

import { TFileHandlerCollection } from "@_api/index";

export const useFileHandlers = () => {
  const [fileHandlers, setFileHandlers] = useState<TFileHandlerCollection>({});

  return {
    fileHandlers,
    setFileHandlers,
  };
};
