import { useState } from "react";

import { TProjectContext } from "@_redux/main/fileTree";

export const useRecentProjects = () => {
  const [recentProjectContexts, setRecentProjectContexts] = useState<
    TProjectContext[]
  >([]);
  const [recentProjectNames, setRecentProjectNames] = useState<string[]>([]);
  const [recentProjectHandlers, setRecentProjectHandlers] = useState<
    (FileSystemDirectoryHandle | null)[]
  >([]);

  return {
    recentProjectContexts,
    recentProjectNames,
    recentProjectHandlers,
    setRecentProjectContexts,
    setRecentProjectNames,
    setRecentProjectHandlers,
  };
};
