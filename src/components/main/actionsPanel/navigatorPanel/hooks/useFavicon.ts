import { useEffect, useRef } from "react";

import { useDispatch } from "react-redux";

import { RootNodeUid } from "@_constants/main";
import { setWorkspace } from "@_redux/main/fileTree";
import { useAppState } from "@_redux/useAppState";

import { setWorkspaceFavicon } from "../helpers/";

export const useFavicon = (
  setFaviconFallback: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const dispatch = useDispatch();

  const { workspace, project, currentFileUid, validNodeTree } = useAppState();

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
  }, [validNodeTree]);
};
