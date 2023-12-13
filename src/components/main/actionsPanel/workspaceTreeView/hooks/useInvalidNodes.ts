import { useCallback, useState } from "react";

import { TNodeUid } from "@_node/types";

export const useInvalidNodes = () => {
  const [invalidNodes, _addInvalidNodes] = useState<{
    [uid: TNodeUid]: true;
  }>({});
  const addInvalidNodes = useCallback(
    (...uids: TNodeUid[]) => {
      const _invalidNodes = { ...invalidNodes };
      uids.map((uid) => (_invalidNodes[uid] = true));
      _addInvalidNodes(_invalidNodes);
    },
    [invalidNodes],
  );
  const removeInvalidNodes = useCallback(
    (...uids: TNodeUid[]) => {
      const _invalidNodes = { ...invalidNodes };
      uids.map((uid) => delete _invalidNodes[uid]);
      _addInvalidNodes(_invalidNodes);
    },
    [invalidNodes],
  );

  return { invalidNodes, addInvalidNodes, removeInvalidNodes };
};
