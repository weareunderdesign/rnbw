import {
  useContext,
  useEffect,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { LogAllow } from '@_constants/main';
import {
  TFileNodeData,
  writeFile,
} from '@_node/file';
import {
  TNode,
  TNodeTreeData,
} from '@_node/types';
import {
  fnSelector,
  MainContext,
  navigatorSelector,
  setCurrentFileContent,
} from '@_redux/main';
import { TFileInfo } from '@_types/main';

import {
  getFileData,
  getPreViewPath,
  handleFileUpdate,
  handleHmsChange,
  updateFileInfoFromNodeTree,
} from '../helpers';

export const useProcessorUpdateOpt = () => {
  const dispatch = useDispatch();
  const { file } = useSelector(navigatorSelector);
  const { focusedItem } = useSelector(fnSelector);
  const {
    // global action
    addRunningActions,
    removeRunningActions,
    // file tree view
    setFSPending,
    ffTree,
    setFFNode,
    parseFileFlag,
    currentFileUid,
    // node tree view
    nodeTree,
    setNodeTree,
    nodeMaxUid,
    setNodeMaxUid,
    // stage view
    setIFrameSrc,
    fileInfo,
    setFileInfo,
    setNeedToReloadIframe,
    setNewFocusedNodeUid,
    // processor
    updateOpt,
    setUpdateOpt,
    // other
    osType,
    monacoEditorRef,
  } = useContext(MainContext);
  // -------------------------------------------------------------- sync --------------------------------------------------------------

  useEffect(() => {
    const monacoEditor = monacoEditorRef.current;
    if (updateOpt.parse === true) {
      let onlyRenderViewState = false;
      // parse file content
      let _nodeTree: TNodeTreeData = structuredClone(nodeTree);
      let _nodeMaxUid = nodeMaxUid;
      let _fileInfo: TFileInfo;
      let _needToReloadIFrame = false;
      let _newFocusedNodeUid = "";
      let tempFocusedItem = focusedItem;
      // origin state
      if (!ffTree[file.uid]) {
        return;
      }
      const _file = structuredClone(ffTree[file.uid]) as TNode;
      const fileData = _file.data as TFileNodeData;
      if (updateOpt.from === "file") {
        if (monacoEditor) {
          const { tree, newNodeMaxUid } = handleFileUpdate(
            fileData,
            _nodeTree,
            _nodeMaxUid,
            file,
            monacoEditor,
          );

          _nodeTree = tree;
          _nodeMaxUid = Number(newNodeMaxUid);

          // reload iframe
          _needToReloadIFrame = true;
        }
      } else if (updateOpt.from === "hms") {
        if (monacoEditor) {
          const result = handleHmsChange(
            fileData,
            { file, focusedItem },
            {
              ffTree,
              nodeTree,
              osType,
              currentFileUid,
            },
            {
              _nodeTree,
              _nodeMaxUid,
              _needToReloadIFrame,
              _newFocusedNodeUid,
              onlyRenderViewState,
              tempFocusedItem,
            },
            monacoEditor,
          );

          onlyRenderViewState = result.onlyRenderViewState;
          _nodeTree = result._nodeTree;
          _nodeMaxUid = result._nodeMaxUid;
          _newFocusedNodeUid = result._newFocusedNodeUid;
        }
      }
      // get file info from node tree

      if (fileData.type === "html") {
        const result = updateFileInfoFromNodeTree(
          _fileInfo,
          fileInfo,
          _nodeTree,
          _needToReloadIFrame,
        );
        _needToReloadIFrame = result._needToReloadIFrame;
      }
      LogAllow && _needToReloadIFrame && console.log("need to refresh iframe");
      if (!onlyRenderViewState) {
        // update idb
        (async () => {
          setFSPending(true);
          try {
            const previewPath = getPreViewPath(ffTree, _file, fileData);
            await writeFile(previewPath, fileData.contentInApp as string);
            if (fileData.type === "html") {
              setIFrameSrc(`rnbw${previewPath}`);
            }
          } catch (err) {}
          setFSPending(false);
        })();
        // update context
        setFFNode(_file);
        addRunningActions(["processor-nodeTree"]);
        setNodeTree(_nodeTree);
        setNodeMaxUid(_nodeMaxUid);
        setFileInfo(_fileInfo);
        setNeedToReloadIframe(_needToReloadIFrame);
        // update redux
        updateOpt.from !== "hms" &&
          dispatch(setCurrentFileContent(fileData.content as string));
      }

      // select new focused node in code view
      setNewFocusedNodeUid(_newFocusedNodeUid);
      setUpdateOpt({
        parse: null,
        from: updateOpt.from !== "hms" ? null : updateOpt.from,
      });
    } else if (updateOpt.parse === false) {
      // serialize node tree data
      const _nodeTree: TNodeTreeData = JSON.parse(JSON.stringify(nodeTree));
      const _file = JSON.parse(JSON.stringify(ffTree[file.uid])) as TNode;
      const fileData = getFileData(_file, updateOpt, nodeTree);

      // update idb
      (async () => {
        setFSPending(true);
        try {
          await writeFile(fileData.path, fileData.contentInApp as string);
        } catch (err) {}
        setFSPending(false);
      })();
      // update context
      setFFNode(_file);
      addRunningActions(["processor-nodeTree"]);
      setNodeTree(_nodeTree);
      // update redux
      dispatch(setCurrentFileContent(fileData.content as string));
      setUpdateOpt({ parse: null, from: updateOpt.from });
    }

    removeRunningActions(["processor-updateOpt"]);
  }, [updateOpt, parseFileFlag]);
};
