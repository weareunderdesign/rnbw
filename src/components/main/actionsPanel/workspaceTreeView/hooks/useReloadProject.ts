import { useState, useEffect, useRef, useContext } from "react";
import { useDispatch } from "react-redux";

import {
  MainContext,
  removeCurrentFile,
  updateFFTreeViewState,
} from "@_redux/main";
import { TNodeTreeData, TNodeUid } from "@_node/types";
import {
  loadIDBProject,
  loadLocalProject,
  processHandlerObj,
} from "../helpers";

export const useReloadProject = () => {
  const {
    // navigator
    ffTree,
    project,
    // file tree view
    setFFTree,
    setFFHandlers,
    setCurrentFileUid,
    // node tree view
    setNodeTree,
    setValidNodeTree,
    // stage view
    setIFrameSrc,
    ffHandlers,
    osType,
  } = useContext(MainContext);

  const ffTreeRef = useRef<TNodeTreeData>({});
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();

  async function reloadProject(_uid?: TNodeUid) {
    setIsLoading(true);
    let handlerObj = {};
    let _deletedUids: TNodeUid[] = [];

    if (project.context === "local") {
      const result = await loadLocalProject(ffTree, ffHandlers, osType);
      handlerObj = result.handlerObj;
      _deletedUids = result.deletedUids;
    } else if (project.context === "idb") {
      const result = await loadIDBProject(ffTree);
      handlerObj = result.handlerObj;
      _deletedUids = result.deletedUids;
    }

    const { treeViewData, ffHandlerObj } = processHandlerObj(
      handlerObj,
      ffTree,
    );

    dispatch(updateFFTreeViewState({ deletedUids: _deletedUids }));
    if (_uid && !treeViewData[_uid]) {
      setIFrameSrc(null);
      setNodeTree({});
      setValidNodeTree({});
      setCurrentFileUid("");
      dispatch(removeCurrentFile());
    }
    ffTreeRef.current = treeViewData;
    setFFTree(treeViewData);
    setFFHandlers(ffHandlerObj);

    setIsLoading(false);
  }

  useEffect(() => {
    if (project.context === "local" || project.context === "idb") {
      reloadProject();
    }
  }, [project.context]);

  return { cb_reloadProject: reloadProject };
};
