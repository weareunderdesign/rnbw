import { useContext, useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";

import { LogAllow } from "@_constants/global";
import { TFileNode, TFileNodeData, writeFile } from "@_node/file";
import { TNode, TNodeTreeData } from "@_node/types";
import { AppState } from "@_redux/_root";
import { MainContext } from "@_redux/main";
import { focusFileTreeNode } from "@_redux/main/fileTree";
import { setNodeTree } from "@_redux/main/nodeTree";
import { setCurrentFileContent } from "@_redux/main/nodeTree/event";
import { setUpdateOptions } from "@_redux/main/processor";
import { setIframeSrc, setNeedToReloadIframe } from "@_redux/main/stageView";
import { TFileInfo } from "@_types/main";

import { getPreViewPath, handleFileUpdate } from "../helpers";

export const useProcessorUpdateOpt = () => {
  const dispatch = useDispatch();

  const {
    fileTree: { fileTree, currentFileUid },
    nodeTree: {
      nodeTreeViewState: { focusedItem },
      nodeTree,
    },
    nodeTreeEvent: {
      present: { currentFileContent },
    },
    processor: { updateOptions },
  } = useSelector((state: AppState) => state.main);
  const { osType } = useSelector((state: AppState) => state.global);
  const {
    // global action
    addRunningActions,
    removeRunningActions,
    // file tree view
    setFSPending,
    parseFileFlag,

    setNewFocusedNodeUid,

    monacoEditorRef,
  } = useContext(MainContext);
  // -------------------------------------------------------------- sync --------------------------------------------------------------

  useEffect(() => {
    const monacoEditor = monacoEditorRef.current;
    if (updateOptions?.parse === true) {
      let onlyRenderViewState = false;
      // parse file content
      let _nodeTree: TNodeTreeData = structuredClone(nodeTree);
      let _fileInfo: TFileInfo;
      let _needToReloadIFrame = false;
      let _newFocusedNodeUid = "";
      let tempFocusedItem = focusedItem;
      // origin state
      if (!fileTree[currentFileUid]) {
        return;
      }
      const _file = structuredClone(fileTree[currentFileUid]) as TFileNode;
      const fileData = _file.data as TFileNodeData;
      if (updateOptions.from === "file") {
        if (monacoEditor) {
          const { tree } = handleFileUpdate(fileData, _nodeTree, _file);

          _nodeTree = tree;

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
          setFSPending(true);
          try {
            const previewPath = getPreViewPath(fileTree, _file, fileData);
            await writeFile(previewPath, fileData.contentInApp as string);
            if (fileData.ext === "html") {
              dispatch(setIframeSrc(`rnbw${previewPath}`));
            }
          } catch (err) {}
          setFSPending(false);
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
      setNewFocusedNodeUid(_newFocusedNodeUid);
      dispatch(
        setUpdateOptions({
          parse: null,
          from: updateOptions.from !== "hms" ? null : updateOptions.from,
        }),
      );
    } else if (updateOptions?.parse === false) {
      // serialize node tree data
      const _nodeTree: TNodeTreeData = JSON.parse(JSON.stringify(nodeTree));
      const _file = JSON.parse(
        JSON.stringify(fileTree[currentFileUid]),
      ) as TNode;
      const fileData = currentFileContent;

      // update idb
      (async () => {
        setFSPending(true);
        try {
          // TODO
          // await writeFile(fileData.path, fileData.contentInApp as string);
        } catch (err) {}
        setFSPending(false);
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
