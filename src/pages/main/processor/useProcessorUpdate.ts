import { useContext, useEffect } from "react";

import { useDispatch } from "react-redux";

import { LogAllow } from "@_constants/global";
import {
  PreserveRnbwNode,
  StageNodeIdAttr,
  parseFile,
  writeFile,
} from "@_node/file";
import { MainContext } from "@_redux/main";
import { setDoingFileAction, setFileTreeNode } from "@_redux/main/fileTree";
import {
  expandNodeTreeNodes,
  focusNodeTreeNode,
  selectNodeTreeNodes,
  setNodeTree,
  setValidNodeTree,
} from "@_redux/main/nodeTree";
import { setIframeSrc, setNeedToReloadIframe } from "@_redux/main/stageView";
import { useAppState } from "@_redux/useAppState";

import { getPreViewPath } from "./helpers";
import { setDidRedo, setDidUndo } from "@_redux/main/processor";
import morphdom from "morphdom";
import { TNodeTreeData } from "@_node/types";
import { getSubNodeUidsByBfs } from "@_node/helpers";
import { RootNodeUid } from "@_constants/main";

export const useProcessorUpdate = () => {
  const dispatch = useDispatch();
  const {
    fileAction,

    fileTree,
    currentFileUid,
    prevRenderableFileUid,

    currentFileContent,
    selectedNodeUids,

    syncConfigs,

    didUndo,
    didRedo,
  } = useAppState();

  const { addRunningActions, removeRunningActions, monacoEditorRef } =
    useContext(MainContext);

  // file tree event
  useEffect(() => {}, [fileAction]);

  // node tree event
  useEffect(() => {
    console.log("useProcessorUpdate", { selectedNodeUids });

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
    console.log("useProcessorUpdate", { selectedNodeUids, currentFileContent });

    // validate
    const monacoEditor = monacoEditorRef.current;
    if (!fileTree[currentFileUid] || !monacoEditor) return;

    addRunningActions(["processor-update"]);

    // parse new file content
    const file = structuredClone(fileTree[currentFileUid]);
    const fileData = file.data;
    const { contentInApp, nodeTree } = parseFile(
      fileData.ext,
      currentFileContent,
    );
    fileData.content = currentFileContent;
    fileData.contentInApp = contentInApp;
    fileData.changed = fileData.content !== fileData.orgContent;

    // ---
    // code-view is already synced
    // ---

    // sync node-tree
    (() => {
      dispatch(setNodeTree(nodeTree));

      // build valid-node-tree
      const _nodeTree = structuredClone(nodeTree);
      const _validNodeTree: TNodeTreeData = {};

      const uids = getSubNodeUidsByBfs(RootNodeUid, _nodeTree);
      uids.reverse();
      uids.map((uid) => {
        const node = _nodeTree[uid];
        if (!node.data.valid) return;

        node.children = node.children.filter(
          (c_uid) => _nodeTree[c_uid].data.valid,
        );
        node.isEntity = node.children.length === 0;
        _validNodeTree[uid] = node;
      });

      dispatch(setValidNodeTree(_validNodeTree));

      // when open a new file, expand items in node tree
      if (prevRenderableFileUid !== currentFileUid) {
        const uids = Object.keys(_validNodeTree);
        dispatch(expandNodeTreeNodes(true ? uids.slice(0, 50) : uids));
      }
    })();

    // sync file-tree
    dispatch(setFileTreeNode(file));
    (async () => {
      // update idb
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

    // sync stage-view
    if (prevRenderableFileUid !== currentFileUid) {
      // reload if it's a new file.
      LogAllow && console.log("need to refresh iframe");
      dispatch(setNeedToReloadIframe(true));
    } else {
      if (fileData.ext === "html") {
        const iframe: any = document.getElementById("iframeId");
        if (iframe) {
          const iframeDoc = iframe.contentDocument;
          const iframeHtml = iframeDoc.getElementsByTagName("html")[0];
          const updatedHtml = contentInApp;
          if (!iframeHtml || !updatedHtml) return;

          let nodeUidToFocus = "";
          morphdom(iframeHtml, updatedHtml, {
            onBeforeElUpdated: function (fromEl, toEl) {
              //check if the node is script or style
              if (
                fromEl.nodeName === "SCRIPT" ||
                fromEl.nodeName === "LINK" ||
                fromEl.nodeName === "STYLE"
              ) {
                if (fromEl.outerHTML === toEl.outerHTML) {
                  return false;
                } else {
                  let fromOuter = fromEl.outerHTML;
                  let toOuter = toEl.outerHTML;
                  return false;
                }
              }
              const fromElRnbwId = fromEl.getAttribute(StageNodeIdAttr);
              nodeUidToFocus = syncConfigs?.matchIds?.[0] || "";
              if (toEl.nodeName.includes("-")) return false;
              if (
                syncConfigs?.matchIds &&
                !!fromElRnbwId &&
                syncConfigs.matchIds.includes(fromElRnbwId)
              ) {
                return true;
              } else if (fromEl.isEqualNode(toEl)) {
                return false;
              } else if (toEl.nodeName === "HTML") {
                //copy the attributes
                for (let i = 0; i < fromEl.attributes.length; i++) {
                  toEl.setAttribute(
                    fromEl.attributes[i].name,
                    fromEl.attributes[i].value,
                  );
                }
                if (fromEl.isEqualNode(toEl)) return false;
              }
              return true;
            },
            onElUpdated: function (el) {
              if (el.nodeName === "HTML") {
                //copy the attributes
                for (let i = 0; i < el.attributes.length; i++) {
                  iframeHtml.setAttribute(
                    el.attributes[i].name,
                    el.attributes[i].value,
                  );
                }
              }
            },
            onBeforeNodeDiscarded: function (node: Node) {
              const elementNode = node as Element;
              const ifPreserveNode = elementNode.getAttribute
                ? elementNode.getAttribute(PreserveRnbwNode)
                : false;
              if (ifPreserveNode) {
                return false;
              }
              //script and style should not be discarded
              if (
                elementNode.nodeName === "SCRIPT" ||
                elementNode.nodeName === "LINK" ||
                elementNode.nodeName === "STYLE"
              ) {
                return false;
              }

              return true;
            },
          });
        }
      }
    }

    removeRunningActions(["processor-update"]);
  }, [currentFileContent]);

  // hms
  useEffect(() => {
    didUndo && dispatch(setDidUndo(false));
    didRedo && dispatch(setDidRedo(false));
  }, [didUndo, didRedo]);
};
