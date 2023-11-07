import {
  useEffect,
  useRef,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { RootNodeUid } from '@_constants/main';
import {
  currentFileUidSelector,
  projectSelector,
  selectFileTreeNodes,
  setWorkspace,
  workspaceSelector,
} from '@_redux/main/fileTree';
import { validNodeTreeSelector } from '@_redux/main/nodeTree';

import {
  selectFirstNode,
  setWorkspaceFavicon,
} from '../helpers/';

export const useFavicon = (
  setFaviconFallback: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const dispatch = useDispatch();

  const workspace = useSelector(workspaceSelector);
  const project = useSelector(projectSelector);
  const currentFileUid = useSelector(currentFileUidSelector);

  const validNodeTree = useSelector(validNodeTreeSelector);

  const isFirst = useRef(true);
  useEffect(() => {
    isFirst.current = true;
  }, [currentFileUid]);

  useEffect(() => {
    setFaviconFallback(false);

    if (currentFileUid === `${RootNodeUid}/index.html`) {
      setWorkspaceFavicon(validNodeTree, project, workspace, (workspace) => {
        dispatch(setWorkspace(workspace));
      });
    }

    if (currentFileUid !== "" && isFirst.current === true) {
      selectFirstNode(
        validNodeTree,
        isFirst.current,
        selectFileTreeNodes,
        dispatch,
      );
    }
  }, [validNodeTree]);
};
