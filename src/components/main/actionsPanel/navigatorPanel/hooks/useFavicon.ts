import { useEffect, useRef } from "react";

import { useDispatch, useSelector } from "react-redux";

import { RootNodeUid } from "@_constants/main";
import {
  currentFileUidSelector,
  projectSelector,
  setWorkspace,
  workspaceSelector,
} from "@_redux/main/fileTree";
import {
  selectNodeTreeNodes,
  validNodeTreeSelector,
  expandNodeTreeNodes,
} from "@_redux/main/nodeTree";

import { selectFirstNode, setWorkspaceFavicon } from "../helpers/";
import { AppState } from "@_redux/_root";

export const useFavicon = (
  setFaviconFallback: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const dispatch = useDispatch();

  const workspace = useSelector(workspaceSelector);
  const project = useSelector(projectSelector);
  const currentFileUid = useSelector(currentFileUidSelector);

  const validNodeTree = useSelector(validNodeTreeSelector);
  const { focusedItem, selectedItems } = useSelector(
    (state: AppState) => state.main.nodeTree.nodeTreeViewState,
  );

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

    if (currentFileUid !== "" && isFirst.current === true && !focusedItem) {
      selectFirstNode(
        validNodeTree,
        isFirst.current,
        selectNodeTreeNodes,
        expandNodeTreeNodes,
        dispatch,
      );
    }
  }, [validNodeTree]);
};
