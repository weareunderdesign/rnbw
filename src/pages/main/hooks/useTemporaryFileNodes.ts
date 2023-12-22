import { useCallback, useState } from "react";

import { TNodeUid } from "@_node/types";

export const useTemporaryFileNodes = () => {
  const [temporaryFileNodes, _setTemporaryFileNodes] = useState<{
    [uid: TNodeUid]: true;
  }>({});
  const addTemporaryFileNodes = useCallback(
    (...uids: TNodeUid[]) => {
      const _temporaryFileNodes = { ...temporaryFileNodes };
      uids.map((uid) => (_temporaryFileNodes[uid] = true));
      _setTemporaryFileNodes(_temporaryFileNodes);
    },
    [temporaryFileNodes],
  );
  const removeTemporaryFileNodes = useCallback(
    (...uids: TNodeUid[]) => {
      const _temporaryFileNodes = { ...temporaryFileNodes };
      uids.map((uid) => delete _temporaryFileNodes[uid]);
      _setTemporaryFileNodes(_temporaryFileNodes);
    },
    [temporaryFileNodes],
  );

  return {
    temporaryFileNodes,
    addTemporaryFileNodes,
    removeTemporaryFileNodes,
  };
};
