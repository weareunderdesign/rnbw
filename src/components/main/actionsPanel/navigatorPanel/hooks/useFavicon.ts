import { useEffect, useRef } from "react";

import { useDispatch } from "react-redux";

import { RootNodeUid } from "@_constants/main";
import { setWorkspace } from "@_redux/main/fileTree";
import {
  selectNodeTreeNodes,
  expandNodeTreeNodes,
} from "@_redux/main/nodeTree";

import { selectFirstNode, setWorkspaceFavicon } from "../helpers/";
import { AppState } from "@_redux/_root";
import { useAppState } from "@_redux/useAppState";

export const useFavicon = (
  setFaviconFallback: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const dispatch = useDispatch();

  const {
    workspace,
    project,
    currentFileUid,
    validNodeTree,
    nFocusedItem: focusedItem,
    nSelectedItems: selectedItems,
  } = useAppState();

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
      const firstNode = selectFirstNode(
        validNodeTree,
        selectNodeTreeNodes,
        expandNodeTreeNodes,
        dispatch,
      );
      if (firstNode) {
        isFirst.current = firstNode;
      }
    }
  }, [validNodeTree]);
};
