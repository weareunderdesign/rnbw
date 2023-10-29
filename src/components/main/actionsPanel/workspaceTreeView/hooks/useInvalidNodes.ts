import {
  useCallback,
  useState,
} from 'react';

import { TNodeUid } from '@_node/types';

export const useInvalidNodes = () => {
  const [invalidNodes, _setInvalidNodes] = useState<{
    [uid: TNodeUid]: boolean;
  }>({});

  const setInvalidNodes = useCallback(
    (...uids: TNodeUid[]) => {
      const _invalidNodes = { ...invalidNodes };
      uids.map((uid) => (_invalidNodes[uid] = true));
      _setInvalidNodes(_invalidNodes);
    },
    [invalidNodes],
  );

  const removeInvalidNodes = useCallback(
    (...uids: TNodeUid[]) => {
      const _invalidNodes = { ...invalidNodes };
      uids.map((uid) => delete _invalidNodes[uid]);
      _setInvalidNodes(_invalidNodes);
    },
    [invalidNodes],
  );

  return {
    setInvalidNodes,
    removeInvalidNodes,
    invalidNodes,
  };
};
