import { useCallback, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { LogAllow } from "@_constants/main";
import {
  parseFile,
  serializeFile,
  TFileNodeData,
  writeFile,
} from "@_node/file";
import {
  parseHtmlCodePart,
  serializeHtml,
  THtmlNodeData,
  THtmlPageSettings,
} from "@_node/html";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/types";
import {
  fnSelector,
  MainContext,
  navigatorSelector,
  setCurrentFileContent,
} from "@_redux/main";
import { TFileInfo, TFileType } from "@_types/main";
import {
  addNewNode,
  detectSeedNodeChanges,
  generateFileInfo,
  getChangedUids,
  getHtmlPageSettings,
  getPreViewPath,
  refreshIframeIfSeedNodeChanges,
  removeOrgNode,
  replaceElementInIframe,
} from "../helpers";

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
    setNeedToReloadIFrame,
    // code view
    setCodeEditing,
    codeChanges,
    setNewFocusedNodeUid,
    // processor
    updateOpt,
    setUpdateOpt,
    // references
    htmlReferenceData,
    // other
    osType,
  } = useContext(MainContext);
  // -------------------------------------------------------------- sync --------------------------------------------------------------

  // service - get reference data for current file type
  const getReferenceData = useCallback(
    (fileType: TFileType) => {
      return fileType === "html" ? htmlReferenceData : htmlReferenceData;
    },
    [htmlReferenceData],
  );

  useEffect(() => {
    if (updateOpt.parse === true) {
      let onlyRenderViewState = false;
      // parse file content
      let _nodeTree: TNodeTreeData = JSON.parse(JSON.stringify(nodeTree));
      let _nodeMaxUid = nodeMaxUid;
      let _fileInfo: TFileInfo;
      let _needToReloadIFrame = false;
      let _newFocusedNodeUid = "";
      let tempFocusedItem = focusedItem;

      // origin state
      if (!ffTree[file.uid]) {
        return;
      }

      const _file = JSON.parse(JSON.stringify(ffTree[file.uid])) as TNode;
      const fileData = _file.data as TFileNodeData;
      if (updateOpt.from === "file") {
        const {
          formattedContent,
          contentInApp,
          tree,
          nodeMaxUid: newNodeMaxUid,
        } = parseFile(
          fileData.type,
          file.content,
          getReferenceData(fileData.type),
          osType,
        );
        _nodeTree = tree;
        _nodeMaxUid = Number(newNodeMaxUid);
        fileData.content = formattedContent;
        fileData.contentInApp = contentInApp;
        fileData.changed = fileData.content !== fileData.orgContent;
        // reload iframe
        _needToReloadIFrame = true;
      } else if (updateOpt.from === "code" || updateOpt.from === "stage") {
        if (fileData.type === "html") {
          // detect seed node changed
          const seedNodeChanged = detectSeedNodeChanges(_nodeTree, codeChanges);

          if (seedNodeChanged) {
            let fileContent = file.content;
            if (updateOpt.from === "stage") {
              for (const change of codeChanges) {
                const { uid, content } = change;
                const node = _nodeTree[uid];
                const nodeData = node.data as THtmlNodeData;
                nodeData.html = content;
              }
              // rebuild from new tree
              const { html: formattedContent } = serializeHtml(
                _nodeTree,
                htmlReferenceData,
                osType,
              );
              fileContent = formattedContent;
            }
            const {
              contentInApp,
              tree,
              nodeMaxUid: newNodeMaxUid,
            } = parseFile(
              fileData.type,
              fileContent,
              htmlReferenceData,
              osType,
              null,
              String(_nodeMaxUid) as TNodeUid,
            );
            _nodeTree = tree;
            _nodeMaxUid = Number(newNodeMaxUid);
            fileData.content = fileContent;
            fileData.contentInApp = contentInApp;
            fileData.changed = fileData.content !== fileData.orgContent;
            // reload iframe
            _needToReloadIFrame = true;
          } else {
            // side effects
            codeChanges.map((codeChange) => {
              // ---------------------- node tree side effect ----------------------
              // parse code part
              // remove org nodes
              const o_node = _nodeTree[codeChange.uid]; //original node (the node which was previously focused)
              const {
                formattedContent,
                tree,
                nodeMaxUid: newNodeMaxUid,
              } = parseHtmlCodePart(
                codeChange.content,
                htmlReferenceData,
                osType,
                String(_nodeMaxUid) as TNodeUid,
              );

              if (formattedContent == "") {
                return;
              }
              _nodeMaxUid = Number(newNodeMaxUid);
              if (o_node === undefined) return;
              const o_parentNode = _nodeTree[o_node.parentUid as TNodeUid];
              removeOrgNode(o_parentNode, codeChange, tree, _nodeTree);

              let { nodeUids, _newFocusedNodeUid: newFocusedNode } = addNewNode(
                tree,
                o_parentNode,
                _nodeTree,
              );

              if (newFocusedNode !== "") {
                _newFocusedNodeUid = newFocusedNode;
              }

              // ---------------------- iframe side effect ----------------------
              // build element to replace
              replaceElementInIframe(
                o_node,
                formattedContent,
                nodeUids,
                codeChange,
                tree,
              );
            });

            // rebuild from new tree
            const { htmlInApp: contentInApp } = serializeHtml(
              _nodeTree,
              htmlReferenceData,
              osType,
            );
            fileData.content = file.content;
            fileData.contentInApp = contentInApp;
            fileData.changed = fileData.content !== fileData.orgContent;
          }
        }

        updateOpt.from === "code" && setCodeEditing(false);
      } else if (updateOpt.from === "hms") {
        const _currentFile = ffTree[currentFileUid];
        const _currentFileData = _currentFile.data as TFileNodeData;
        if (
          file.uid === currentFileUid &&
          file.content === _currentFileData.contentInApp
        ) {
          LogAllow && console.log("view state changed by hms");
          // no need to build new node tree
          onlyRenderViewState = true;
        } else {
          LogAllow && console.log("file content changed by hms");
          // parse hms content keeping node uids
          const {
            formattedContent,
            contentInApp,
            tree,
            nodeMaxUid: newNodeMaxUid,
          } = parseFile(
            fileData.type,
            file.content,
            getReferenceData(fileData.type),
            osType,
            true,
            String(_nodeMaxUid) as TNodeUid,
          );

          _nodeTree = tree;
          _nodeMaxUid = Number(newNodeMaxUid);
          fileData.content = formattedContent;
          fileData.contentInApp = contentInApp;
          fileData.changed = fileData.content !== fileData.orgContent;

          while (!_nodeTree[tempFocusedItem]) {
            if (_nodeTree[tempFocusedItem] == undefined) break;
            tempFocusedItem = _nodeTree[tempFocusedItem].parentUid as TNodeUid;
          }
          if (file.uid !== currentFileUid) {
            _needToReloadIFrame = true;
          } else {
            // refresh iframe if it has seed node changes
            const o_uids = refreshIframeIfSeedNodeChanges(
              nodeTree,
              _nodeTree,
              _needToReloadIFrame,
            );

            // --------------------------- iframe side effects ---------------------------
            if (!_needToReloadIFrame) {
              getChangedUids(nodeTree, _nodeTree, o_uids);
            }
          }
        }
        if (tempFocusedItem !== focusedItem) {
          _newFocusedNodeUid = tempFocusedItem;
        } else {
          _newFocusedNodeUid = focusedItem;
        }
      }

      // get file info from node tree
      if (fileData.type === "html") {
        _fileInfo = {
          title: "",
          scripts: [],
          favicon: [],
        } as THtmlPageSettings;

        getHtmlPageSettings(_nodeTree, _fileInfo);

        // compare new file info with org file info
        if (!_needToReloadIFrame && fileInfo) {
          const { curScripts, orgScripts, orgScriptObj } = generateFileInfo(
            _fileInfo,
            fileInfo,
          );

          if (curScripts.length !== orgScripts.length) {
            _needToReloadIFrame = true;
          } else {
            for (const script of curScripts) {
              if (!orgScriptObj[script]) {
                _needToReloadIFrame = true;
                break;
              }
            }
          }
        }
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
        setNeedToReloadIFrame(_needToReloadIFrame);
        // update redux
        updateOpt.from !== "hms" &&
          dispatch(setCurrentFileContent(fileData.contentInApp as string));
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
      const fileData = _file.data as TFileNodeData;

      if (updateOpt.from === "node") {
        const serializedRes = serializeFile(
          fileData.type,
          nodeTree,
          getReferenceData(fileData.type),
          osType,
        );
        if (fileData.type === "html") {
          const { html, htmlInApp } = serializedRes as THtmlNodeData;
          // update ffTree
          fileData.content = html;
          fileData.contentInApp = htmlInApp;
          fileData.changed = fileData.content !== fileData.orgContent;
        }
      }
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
      dispatch(setCurrentFileContent(fileData.contentInApp as string));
      setUpdateOpt({ parse: null, from: updateOpt.from });
    }

    removeRunningActions(["processor-updateOpt"]);
  }, [updateOpt, parseFileFlag]);
};
