import { useCallback, useState } from "react";

import { TNodeUid } from "@_node/types";

export const useTemporaryNodes = () => {
  const [temporaryNodes, _addTemporaryNodes] = useState<{
    [uid: TNodeUid]: true;
  }>({});
  const addTemporaryNodes = useCallback(
    (...uids: TNodeUid[]) => {
      const _temporaryNodes = { ...temporaryNodes };
      uids.map((uid) => (_temporaryNodes[uid] = true));
      _addTemporaryNodes(_temporaryNodes);
    },
    [temporaryNodes],
  );
  const removeTemporaryNodes = useCallback(
    (...uids: TNodeUid[]) => {
      const _temporaryNodes = { ...temporaryNodes };
      uids.map((uid) => delete _temporaryNodes[uid]);
      _addTemporaryNodes(_temporaryNodes);
    },
    [temporaryNodes],
  );

  return { temporaryNodes, addTemporaryNodes, removeTemporaryNodes };
};
