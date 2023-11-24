import { useContext, useEffect } from "react";

import { useDispatch } from "react-redux";

import { LogAllow } from "@_constants/global";
import { writeFile } from "@_node/file";
import { MainContext } from "@_redux/main";
import { setDoingFileAction, setFileTreeNode } from "@_redux/main/fileTree";
import {
  focusNodeTreeNode,
  selectNodeTreeNodes,
  setNodeTree,
} from "@_redux/main/nodeTree";
import { setIframeSrc, setNeedToReloadIframe } from "@_redux/main/stageView";
import { useAppState } from "@_redux/useAppState";

import { getPreViewPath, handleFileUpdate } from "../helpers";
import { setDidRedo, setDidUndo } from "@_redux/main/processor";
import { useEditor } from "@_components/main/codeView/hooks";

export const useProcessorUpdate = () => {
  const dispatch = useDispatch();
  const {
    fileAction,

    fileTree,
    currentFileUid,
    prevRenderableFileUid,

    currentFileContent,
    selectedNodeUids,

    didUndo,
    didRedo,
  } = useAppState();

  const { handleEditorChange } = useEditor();
  const { addRunningActions, removeRunningActions, monacoEditorRef } =
    useContext(MainContext);

  // file tree event
  useEffect(() => {}, [fileAction]);

  // node tree event
  useEffect(() => {
    if (didRedo || didUndo) {
      dispatch(selectNodeTreeNodes(selectedNodeUids));
      dispatch(
        focusNodeTreeNode(
          selectedNodeUids.length > 0
            ? selectedNodeUids[selectedNodeUids.length - 1]
            : "",
        ),
      );
    } else {
    }
  }, [selectedNodeUids]);

  useEffect(() => {
    const monacoEditor = monacoEditorRef.current;
    if (!fileTree[currentFileUid] || !monacoEditor) return;

    addRunningActions(["processor-update"]);

    const file = structuredClone(fileTree[currentFileUid]);
    const fileData = file.data;
    fileData.content = currentFileContent;
    const { nodeTree, htmlDom } = handleFileUpdate(fileData);
    if (fileData.ext === "html") {
      if (htmlDom) {
        handleEditorChange({ value: currentFileContent, htmlDom, nodeTree });
      }
    }
    dispatch(setFileTreeNode(file));
    dispatch(setNodeTree(nodeTree));

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

    if (prevRenderableFileUid !== currentFileUid) {
      LogAllow && console.log("need to refresh iframe");
      dispatch(setNeedToReloadIframe(true));
    }

    removeRunningActions(["processor-update"]);
  }, [currentFileContent]);

  // hms
  useEffect(() => {
    didUndo && dispatch(setDidUndo(false));
    didRedo && dispatch(setDidRedo(false));
  }, [didUndo, didRedo]);
};
