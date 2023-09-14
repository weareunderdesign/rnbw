import { useContext, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootNodeUid } from "@_constants/main";
import {
  ffSelector,
  MainContext,
  navigatorSelector,
  selectFNNode,
} from "@_redux/main";
import { setWorkspaceFavicon, selectFirstNode } from "../helpers";

export const useFavicon = (
  setFaviconFallback: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const dispatch = useDispatch();

  const { file } = useSelector(navigatorSelector);
  const { selectedItems } = useSelector(ffSelector);
  const {
    // navigator
    workspace,
    setWorkspace,
    project,
    // file tree view
    ffTree,
    // node tree view
    validNodeTree,
  } = useContext(MainContext);

  const isFirst = useRef(true);
  useEffect(() => {
    isFirst.current = true;
  }, [file.uid]);

  useEffect(() => {
    setFaviconFallback(false);

    if (file.uid === `${RootNodeUid}/index.html`) {
      setWorkspaceFavicon(validNodeTree, project, workspace, setWorkspace);
    }

    if (file.uid !== "" && isFirst.current === true) {
      selectFirstNode(validNodeTree, isFirst.current, selectFNNode, dispatch);
    }

    console.log({
      workspace,
      project,
      ffTree,
      file,
      validNodeTree,
      selectedItems,
    });
  }, [validNodeTree]);
};
