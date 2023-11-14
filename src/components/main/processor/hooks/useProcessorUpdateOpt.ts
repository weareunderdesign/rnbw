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
import { setUpdateOptions } from "@_redux/main/processor";
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
    updateOptions,
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

  useEffect(() => {
    if (!updateOptions) return;

    console.log("ORIGINAL PROCESSOR UPDATE");

    const monacoEditor = monacoEditorRef.current;

    if (updateOptions.parse === true) {
      let onlyRenderViewState = false;
      // parse file content
      let _nodeTree: TNodeTreeData = structuredClone(nodeTree);
      let _fileInfo: TFileInfo;
      let _needToReloadIFrame = false;
      let _newFocusedNodeUid = "";
      let tempFocusedItem = nFocusedItem;
      // origin state
      if (!fileTree[currentFileUid]) {
        return;
      }
      const _file = structuredClone(fileTree[currentFileUid]) as TFileNode;
      const fileData = _file.data as TFileNodeData;
      fileData.content = currentFileContent;
      if (updateOptions.from === "file") {
        if (monacoEditor) {
          const { nodeTree } = handleFileUpdate(fileData);
          dispatch(focusNodeTreeNode(""));
          dispatch(selectNodeTreeNodes([]));
          _nodeTree = nodeTree;

          // reload iframe
          _needToReloadIFrame = true;
        }
      } else if (updateOptions.from === "hms") {
        if (monacoEditor) {
          // TODO
          /* const result = handleHmsChange(
            fileData,
            { file: _file, focusedItem },
            {
              fileTree,
              nodeTree,
              osType,
              currentFileUid,
            },
            {
              _nodeTree,
              _needToReloadIFrame,
              _newFocusedNodeUid,
              onlyRenderViewState,
              tempFocusedItem,
            },
          );

          onlyRenderViewState = result.onlyRenderViewState;
          _nodeTree = result._nodeTree;
          _newFocusedNodeUid = result._newFocusedNodeUid; */
        }
      }
      // get file info from node tree

      if (fileData.ext === "html") {
        // TODO
        /* const result = updateFileInfoFromNodeTree(
          _fileInfo,
          fileInfo,
          _nodeTree,
          _needToReloadIFrame,
        );
        _needToReloadIFrame = result._needToReloadIFrame; */
      }
      LogAllow && _needToReloadIFrame && console.log("need to refresh iframe");

      if (!onlyRenderViewState) {
        // update idb
        (async () => {
          dispatch(setDoingFileAction(true));
          try {
            const previewPath = getPreViewPath(fileTree, _file, fileData);
            await writeFile(previewPath, fileData.contentInApp as string);
            if (fileData.ext === "html") {
              dispatch(setIframeSrc(`rnbw${previewPath}`));
            }
          } catch (err) {}
          dispatch(setDoingFileAction(false));
        })();
        // update context

        dispatch(focusFileTreeNode(_file.uid));
        addRunningActions(["processor-nodeTree"]);
        dispatch(setNodeTree(_nodeTree));
        // setFileInfo(_fileInfo); TODO: setFileInfo
        dispatch(setNeedToReloadIframe(_needToReloadIFrame));
        // update redux
        updateOptions.from !== "hms" &&
          dispatch(setCurrentFileContent(fileData.content as string));
      }

      // select new focused node in code view
      dispatch(setNewFocusedNodeUid(_newFocusedNodeUid));
      dispatch(
        setUpdateOptions({
          parse: null,
          from: updateOptions.from !== "hms" ? "none" : updateOptions.from,
        }),
      );
    } else if (updateOptions.parse === false) {
      // serialize node tree data
      const _nodeTree: TNodeTreeData = JSON.parse(JSON.stringify(nodeTree));
      const _file = JSON.parse(
        JSON.stringify(fileTree[currentFileUid]),
      ) as TNode;
      const fileData = currentFileContent;

      // update idb
      (async () => {
        dispatch(setDoingFileAction(true));
        try {
          // TODO
          // await writeFile(fileData.path, fileData.contentInApp as string);
        } catch (err) {}
        dispatch(setDoingFileAction(false));
      })();
      // update context

      dispatch(focusFileTreeNode(_file.uid));
      addRunningActions(["processor-nodeTree"]);
      dispatch(setNodeTree(_nodeTree));
      // update redux
      dispatch(setCurrentFileContent(currentFileContent as string));
      dispatch(setUpdateOptions({ parse: null, from: updateOptions.from }));
    }

    removeRunningActions(["processor-updateOpt"]);
  }, [updateOptions, parseFileFlag]);
};
