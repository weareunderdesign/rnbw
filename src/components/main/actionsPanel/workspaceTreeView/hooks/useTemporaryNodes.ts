import { useCallback, useState } from "react";

import { TNodeUid } from "@_node/types";

export const useTemporaryNodes = () => {
const [temporaryNodes, _setTemporaryNodes] = useState<{
    [uid: TNodeUid]: boolean;
  }>({});

  const setTemporaryNodes = useCallback(
    (...uids: TNodeUid[]) => {
      const _temporaryNodes = { ...temporaryNodes };
      uids.forEach((uid) => (_temporaryNodes[uid] = true));
      _setTemporaryNodes(_temporaryNodes);
    },
    [temporaryNodes],
  );

  const removeTemporaryNodes = useCallback(
    (...uids: TNodeUid[]) => {
      const _temporaryNodes = { ...temporaryNodes };
      uids.forEach((uid) => delete _temporaryNodes[uid]);
      _setTemporaryNodes(_temporaryNodes);
    },
    [temporaryNodes],
  );

  return { setTemporaryNodes, removeTemporaryNodes };
}