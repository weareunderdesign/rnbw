import { useContext, useEffect, useRef } from "react";

import morphdom from "morphdom";
import { useDispatch } from "react-redux";

import { getNodeUidByCodeSelection } from "@_components/main/codeView";
import { markSelectedElements } from "@_components/main/stageView/iFrame/helpers";
import { LogAllow } from "@_constants/global";
import { _writeIDBFile, PreserveRnbwNode, StageNodeIdAttr } from "@_node/file";

import { TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import { setCurrentCommand } from "@_redux/main/cmdk";
import {
  setCodeErrors,
  setEditingNodeUidInCodeView,
} from "@_redux/main/codeView";
import {
  setDoingFileAction,
  setFileTreeNodes,
  setInitialFileUidToOpen,
  setPrevFileUid,
} from "@_redux/main/fileTree";
import {
  expandNodeTreeNodes,
  focusNodeTreeNode,
  selectNodeTreeNodes,
  setExpandedNodeTreeNodes,
  setNeedToSelectCode,
  setNeedToSelectNodeUids,
  setNodeTree,
  setSelectedNodeUids,
} from "@_redux/main/nodeTree";
import { setIframeSrc } from "@_redux/main/stageView";
import { useAppState } from "@_redux/useAppState";

import {
  getNeedToExpandNodeUids,
  getNodeUidToBeSelectedAtFirst,
  getPreviewPath,
  getValidNodeTree,
  markChangedFolders,
} from "../helpers";
import {
  addRunningAction,
  removeRunningAction,
  setLoadingFalse,
  setLoadingTrue,
} from "@_redux/main/processor";
import { toast } from "react-toastify";
import { getObjKeys } from "@_pages/main/helper";
import { getFileExtension } from "@_components/main/actionsPanel/navigatorPanel/helpers";
import { useElementHelper } from "@_services/useElementsHelper";

export const useNodeTreeEvent = () => {
  const dispatch = useDispatch();
  const {
    currentCommand,

    fileTree,
    initialFileUidToOpen,
    currentFileUid,
    prevFileUid,

    currentFileContent,
    selectedNodeUids,

    validNodeTree,
    needToSelectCode,
    nExpandedItemsObj,
    syncConfigs,
    nodeEventPast,
    didUndo,
    didRedo,
    activePanel,
  } = useAppState();
  const { parseHtml } = useElementHelper();
  const { iframeRefRef, setMaxNodeUidRef } = useContext(MainContext);

  const isSelectedNodeUidsChanged = useRef(false);
  const isCurrentFileContentChanged = useRef(false);
  const isCodeErrorsExist = useRef(false);
  const existingSelectedNodeUids = useRef<TNodeUid[]>([]);

  useEffect(() => {
    isSelectedNodeUidsChanged.current = false;
    isCurrentFileContentChanged.current = false;

    if (selectedNodeUids.length > 0) {
      existingSelectedNodeUids.current = selectedNodeUids;
    }
  }, [selectedNodeUids, currentFileContent]);

  useEffect(() => {
    isSelectedNodeUidsChanged.current = true;

    const focusedItem = selectedNodeUids.length > 0 ? selectedNodeUids[0] : "";
    // focus node
    dispatch(focusNodeTreeNode(focusedItem as TNodeUid));
    // select nodes
    dispatch(selectNodeTreeNodes(selectedNodeUids));
  }, [selectedNodeUids]);

  useEffect(() => {
    isCurrentFileContentChanged.current = true;
    // validate
    if (!fileTree[currentFileUid]) return;

    dispatch(addRunningAction());

    async function updateFileContent() {
      const file = structuredClone(fileTree[currentFileUid]);
      const fileData = file.data;
      const ext = fileData.ext;

      if (!currentFileContent) return;
      const {
        contentInApp,
        nodeTree,
        selectedNodeUids: selectedNodeUidsAfterActions,
      } = ext === "html"
        ? await parseHtml(currentFileContent, setMaxNodeUidRef)
        : { contentInApp: "", nodeTree: {}, selectedNodeUids: [] };

      fileData.content = currentFileContent;

      fileData.contentInApp = contentInApp;

      fileData.changed = fileData.content !== fileData.orgContent;

      if (file.parentUid) {
        markChangedFolders(fileTree, file, dispatch, fileData.changed);
      }

      // when "Save" while text-editing, we need to call "Save" command after file-content updated.
      // after fileTree has been updated exactly. so when "Save" while text-editing, we should call "SaveForce" first.
      if (currentCommand?.action === "SaveForce") {
        dispatch(setCurrentCommand({ action: "Save" }));
      }

      // sync file-tree
      dispatch(setFileTreeNodes([file]));

      // update idb

      try {
        const previewPath = getPreviewPath(fileTree, file);
        try {
          dispatch(setDoingFileAction(true));
          await _writeIDBFile(previewPath, fileData.contentInApp as string);
        } catch (err) {
          console.log(err);
        } finally {
          dispatch(setDoingFileAction(false));
        }
        if (fileData.ext === "html") {
          dispatch(setIframeSrc(`rnbw${previewPath}`));
        }
      } catch (err) {
        toast.error("An error occurred while updating the file content");
        LogAllow && console.error(err);
      }

      // ---
      // code-view is already synced
      // ---

      // sync stage-view
      if (prevFileUid === currentFileUid) {
        // dom-diff using morph
        if (fileData.ext === "html") {
          const iframe: HTMLIFrameElement | null = document.getElementById(
            "iframeId",
          ) as HTMLIFrameElement;
          if (iframe) {
            const iframeDoc = iframe.contentDocument;
            if (!iframeDoc) return;
            const iframeHtml = iframeDoc.getElementsByTagName("html")[0];
            const updatedHtml = contentInApp;
            if (!iframeHtml || !updatedHtml) {
              dispatch(removeRunningAction());
              return;
            }
            try {
              morphdom(iframeHtml, updatedHtml, {
                getNodeKey: (node: Node) => {
                  // Use data-rnbw-stage-node-id attribute as the key instead id
                  if (node instanceof HTMLElement && node?.hasAttribute("id")) {
                    return node?.getAttribute(StageNodeIdAttr);
                  }
                  return null;
                },
                onBeforeElUpdated: function (fromEl, toEl) {
                  //check if the node is script or style
                  if (
                    fromEl.nodeName === "SCRIPT" ||
                    fromEl.nodeName === "LINK" ||
                    fromEl.nodeName === "STYLE"
                  ) {
                    return false;
                  }
                  const fromElRnbwId = fromEl.getAttribute(StageNodeIdAttr);

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
                  // script and style should not be discarded
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
              isCodeErrorsExist.current = false;
            } catch (err) {
              isCodeErrorsExist.current = true;

              toast("Some changes in the code are incorrect", {
                type: "error",
                toastId: "Some changes in the code are incorrect",
              });
              console.error(err, "error");
            }
          }
        }
      }

      dispatch(setCodeErrors(isCodeErrorsExist.current));
      if (isCodeErrorsExist.current) {
        dispatch(removeRunningAction());
        return;
      }

      // sync node-tree
      await dispatch(setNodeTree(nodeTree));
      const _validNodeTree = getValidNodeTree(nodeTree);

      const uid = getNodeUidToBeSelectedAtFirst(_validNodeTree);
      if (initialFileUidToOpen !== "" && fileTree[initialFileUidToOpen]) {
        LogAllow && console.log("it's a new project");
        dispatch(setInitialFileUidToOpen(""));
        dispatch(setSelectedNodeUids([uid]));

        dispatch(
          setExpandedNodeTreeNodes(
            getNeedToExpandNodeUids(_validNodeTree, [uid]),
          ),
        );
      } else if (prevFileUid !== currentFileUid) {
        if (fileData.ext === "html") {
          dispatch(setLoadingTrue());
        }
        LogAllow && console.log("it's a new file");

        const fileHistory = nodeEventPast.filter(
          (historyState) => historyState.currentFileUid == currentFileUid,
        );
        const lastCurrentFileHistoryState = fileHistory[fileHistory.length - 1];

        !(didUndo || didRedo) &&
          dispatch(
            setNeedToSelectNodeUids(
              activePanel === "stage" ||
                getFileExtension(fileTree[currentFileUid]) !== "html"
                ? selectedNodeUids
                : fileHistory.length
                  ? lastCurrentFileHistoryState?.selectedNodeUids
                  : [uid],
            ),
          );
        dispatch(
          setExpandedNodeTreeNodes(
            getNeedToExpandNodeUids(_validNodeTree, [uid]),
          ),
        );
      } else {
        const nodesToBeMarkedAsSelected =
          selectedNodeUidsAfterActions.length > 0
            ? selectedNodeUidsAfterActions
            : existingSelectedNodeUids.current;
        markSelectedElements(
          iframeRefRef.current,
          nodesToBeMarkedAsSelected,
          nodeTree,
        );
        const validExpandedItems = getObjKeys(nExpandedItemsObj).filter(
          (uid) =>
            _validNodeTree[uid] && _validNodeTree[uid].isEntity === false,
        );
        const needToExpandItems: TNodeUid[] = isSelectedNodeUidsChanged.current
          ? getNeedToExpandNodeUids(_validNodeTree, selectedNodeUids)
          : [];
        dispatch(
          setExpandedNodeTreeNodes([
            ...validExpandedItems,
            ...needToExpandItems,
          ]),
        );

        if (!isSelectedNodeUidsChanged.current) {
          // this change is from 'node actions' or 'typing in code-view'

          const _selectedNodeUids: TNodeUid[] = [];

          if (needToSelectCode) {
            LogAllow && console.log("it's a rnbw-change from code-view");
            // it's a typing change in code-view and we need to select currently `cursored node` in code-view.
            // in the case, `NodeActions -> setCurrentFileContent` and `setNeedToSelectNodeUids` dispatch actions are considered as an one event in the node-event-history.
            const needToSelectNodeUid = getNodeUidByCodeSelection(
              needToSelectCode,
              nodeTree,
              _validNodeTree,
            );
            dispatch(setEditingNodeUidInCodeView(needToSelectNodeUid));
            needToSelectNodeUid &&
              _selectedNodeUids.push(needToSelectNodeUid) &&
              dispatch(setNeedToSelectNodeUids([needToSelectNodeUid]));
            dispatch(setNeedToSelectCode(null));
          }

          // remark selected elements on stage-view
          // it is removed through dom-diff
          // this part is for when the selectedNodeUids is not changed cuz of the same code-format

          markSelectedElements(
            iframeRefRef.current,
            _selectedNodeUids,
            nodeTree,
          );
        }
      }

      // update prevFileUid
      if (prevFileUid !== currentFileUid) {
        dispatch(setPrevFileUid(currentFileUid));
      }
      if (fileData.ext === "html") {
        dispatch(setLoadingFalse());
      }

      dispatch(removeRunningAction());
    }
    updateFileContent();
  }, [currentFileContent, currentFileUid]);

  // expand nodes that need to be expanded when it's just select-event
  useEffect(() => {
    if (!isCurrentFileContentChanged.current) {
      const needToExpandItems = getNeedToExpandNodeUids(
        validNodeTree,
        selectedNodeUids,
      );
      dispatch(expandNodeTreeNodes(needToExpandItems));
    }
  }, [selectedNodeUids]);
};
