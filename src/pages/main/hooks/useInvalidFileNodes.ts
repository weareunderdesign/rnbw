import { useCallback, useState } from "react";

import { TNodeUid } from "@_node/types";

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
