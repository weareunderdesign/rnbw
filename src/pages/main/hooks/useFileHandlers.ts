import { useState } from "react";

import { TFileHandlerCollection } from "@_node/index";

export const useFileHandlers = () => {
  const [projectHandlers, setProjectHandlers] =
    useState<TFileHandlerCollection>({});
  const [currentProjectFileHandle, setCurrentProjectFileHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [fileHandlers, setFileHandlers] = useState<TFileHandlerCollection>({});

  return {
    projectHandlers,
    setProjectHandlers,
    currentProjectFileHandle,
    setCurrentProjectFileHandle,
    fileHandlers,
    setFileHandlers,
  };
};
