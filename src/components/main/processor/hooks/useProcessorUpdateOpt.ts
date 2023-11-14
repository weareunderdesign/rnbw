import { useContext, useEffect } from "react";

import { useDispatch } from "react-redux";

import { LogAllow } from "@_constants/global";
import { TFileNode, TFileNodeData, writeFile } from "@_node/file";
import { TNode, TNodeTreeData } from "@_node/types";
import { MainContext } from "@_redux/main";
import { focusFileTreeNode, setDoingFileAction } from "@_redux/main/fileTree";
import {
  focusNodeTreeNode,
  selectNodeTreeNodes,
  setNewFocusedNodeUid,
  setNodeTree,
} from "@_redux/main/nodeTree";
import { setCurrentFileContent } from "@_redux/main/nodeTree/event";
import { setIframeSrc, setNeedToReloadIframe } from "@_redux/main/stageView";
import { useAppState } from "@_redux/useAppState";
import { TFileInfo } from "@_types/main";

import { getPreViewPath, handleFileUpdate } from "../helpers";

export const useProcessorUpdateOpt = () => {
  const dispatch = useDispatch();
  const {
    fileTree,
    currentFileUid,
    prevFileUid,
    currentFileContent,

    nodeTree,
    nFocusedItem,
  } = useAppState();
  const {
    // global action
    addRunningActions,
    removeRunningActions,
    // file tree view
    parseFileFlag,

    monacoEditorRef,
  } = useContext(MainContext);
  // -------------------------------------------------------------- sync --------------------------------------------------------------
  useEffect(() => {
    const file = structuredClone(fileTree[currentFileUid]);
    if (!file) return;
    const fileData = file.data;

    console.log({ file, currentFileUid, currentFileContent });

    const monacoEditor = monacoEditorRef.current;
    if (!monacoEditor) return;

    const { nodeTree } = handleFileUpdate(fileData);
    dispatch(setNodeTree(nodeTree));
    addRunningActions(["processor-nodeTree"]);

    // update idb
    (async () => {
      dispatch(setDoingFileAction(true));
      try {
        const previewPath = getPreViewPath(fileTree, file, fileData);
        await writeFile(previewPath, fileData.contentInApp as string);
        if (fileData.ext === "html") {
          dispatch(setIframeSrc(`rnbw${previewPath}`));
        }
      } catch (err) {}
      dispatch(setDoingFileAction(false));
    })();

    if (prevFileUid !== currentFileUid) {
      LogAllow && console.log("need to refresh iframe");
      dispatch(setNeedToReloadIframe(true));
    }
  }, [currentFileContent]);
};
