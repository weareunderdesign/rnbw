import { useCallback, useState } from "react";

import { TNodeUid } from "@_node/types";

/* 
we should not allow several file actions on the same file nodes at a time, since it could cause file errors.
so when begin doing file actions, we should add those uids to `invalidFileNodes` and remove them after file actions done.
 */
export const useInvalidFileNodes = () => {
  const [invalidFileNodes, _setInvalidFileNodes] = useState<{
    [uid: TNodeUid]: true;
  }>({});
  const addInvalidFileNodes = useCallback(
    (...uids: TNodeUid[]) => {
      const _invalidFileNodes = { ...invalidFileNodes };
      uids.map((uid) => (_invalidFileNodes[uid] = true));
      _setInvalidFileNodes(_invalidFileNodes);
    },
    [invalidFileNodes],
  );
  const removeInvalidFileNodes = useCallback(
    (...uids: TNodeUid[]) => {
      const _invalidFileNodes = { ...invalidFileNodes };
      uids.map((uid) => delete _invalidFileNodes[uid]);
      _setInvalidFileNodes(_invalidFileNodes);
    },
    [invalidFileNodes],
  );

  return { invalidFileNodes, addInvalidFileNodes, removeInvalidFileNodes };
};
