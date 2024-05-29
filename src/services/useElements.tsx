import { LogAllow } from "@_constants/global";
import { RootNodeUid } from "@_constants/main";
import { StageNodeIdAttr } from "@_node/file";

import { getObjKeys } from "@_pages/main/helper";
import { MainContext } from "@_redux/main";
import {
  NodeTree_Event_RedoActionType,
  NodeTree_Event_UndoActionType,
  setCopiedNodeDisplayName,
  setNeedToSelectNodePaths,
  setSelectedNodeUids,
} from "@_redux/main/nodeTree";
import { setDidRedo, setDidUndo } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import {
  Iadd,
  Icopy,
  Iduplicate,
  Igroup,
  Imove,
  Ipaste,
  Iremove,
  Iungroup,
  IupdateEditableElement,
  IupdateSettings,
} from "@_types/elements.types";

import { Range } from "monaco-editor";
import { useCallback, useContext, useMemo } from "react";
import { useDispatch } from "react-redux";
import { PrettyCode, isValidNode, useElementHelper } from "./useElementsHelper";
import { toast } from "react-toastify";
import * as parse5 from "parse5";
import { setIsContentProgrammaticallyChanged } from "@_redux/main/reference";

export default function useElements() {
  const {
    nSelectedItemsObj,
    htmlReferenceData,
    validNodeTree,
    nFocusedItem,
    nodeEventPastLength,
    currentFileContent,
    nodeEventPast,
    selectedNodeUids,
    nodeEventFutureLength,
  } = useAppState();
  const { monacoEditorRef } = useContext(MainContext);
  const dispatch = useDispatch();
  const {
    getEditorModelWithCurrentCode,
    checkAllResourcesAvailable,
    copyAndCutNode,
    findNodeToSelectAfterAction,
    sortUidsAsc,
    sortUidsDsc,
  } = useElementHelper();

  const codeViewInstanceModel = monacoEditorRef.current?.getModel();
  const selectedItems = useMemo(
    () => getObjKeys(nSelectedItemsObj),
    [nSelectedItemsObj],
  );

  //Create
  const add = async (params: Iadd) => {
    const { tagName, skipUpdate } = params;
    if (!checkAllResourcesAvailable() || !codeViewInstanceModel) return;

    const helperModel = getEditorModelWithCurrentCode();

    const commentTag = "!--...--";
    const HTMLElement =
      htmlReferenceData.elements[tagName === commentTag ? "comment" : tagName];

    let openingTag = HTMLElement?.Tag || "";
    if (HTMLElement?.Attributes) {
      openingTag = openingTag.replace(">", ` ${HTMLElement.Attributes}>`);
    }
    const closingTag = `</${tagName}>`;

    const tagContent = HTMLElement?.Content || "";

    let codeViewText =
      tagName === commentTag
        ? tagContent
        : HTMLElement?.Contain === "None"
          ? openingTag
          : `${openingTag}${tagContent}${closingTag}`;

    const sortedUids = sortUidsAsc(selectedItems);
    if (sortedUids.length === 0) {
      toast.error("Please select a node to add the new element");
      return;
    }
    const uid = sortedUids[0];
    const node = validNodeTree[uid];
    let code = "";
    if (node) {
      const { endCol, endLine } = node.data.sourceCodeLocation;
      const text = `${codeViewText}`;
      codeViewText = await PrettyCode({ code: codeViewText });
      const edit = {
        range: new Range(endLine, endCol, endLine, endCol),
        text,
      };

      helperModel.applyEdits([edit]);
      code = helperModel.getValue();

      if (!skipUpdate) {
        findNodeToSelectAfterAction({
          nodeUids: [uid],
          action: {
            type: "add",
            tagNames: [tagName],
          },
        });
        await dispatch(setIsContentProgrammaticallyChanged(true));
        codeViewInstanceModel.setValue(code);
      }
    }

    return { code };
  };

  const duplicate = async (params: Iduplicate = {}) => {
    if (!checkAllResourcesAvailable() || !codeViewInstanceModel) return;
    const { skipUpdate } = params;

    const helperModel = getEditorModelWithCurrentCode();

    const sortedUids = sortUidsDsc(selectedItems);
    for (let i = 0; i < sortedUids.length; i++) {
      const uid = sortedUids[i];
      const node = validNodeTree[uid];
      if (node) {
        const { startCol, startLine, endCol, endLine } =
          node.data.sourceCodeLocation;
        let text = codeViewInstanceModel.getValueInRange(
          new Range(startLine, startCol, endLine, endCol),
        );

        text = await PrettyCode({ code: text });
        const edit = {
          range: new Range(endLine, endCol, endLine, endCol),
          text,
        };
        helperModel.applyEdits([edit]);
      }
    }
    const code = helperModel.getValue();
    if (!skipUpdate) {
      await findNodeToSelectAfterAction({
        nodeUids: selectedNodeUids,
        action: {
          type: "add",
        },
      });
      await dispatch(setIsContentProgrammaticallyChanged(true));
      codeViewInstanceModel.setValue(code);
    }

    return code;
  };

  //Read
  const getSelectedElements = () => {
    return selectedItems;
  };

  const getElement = (uid: string) => {
    return validNodeTree[uid];
  };

  const copy = async (params: Icopy = {}) => {
    const { uids, skipUpdate } = params;

    const selectedUids = uids || selectedItems;
    if (selectedUids.length === 0 || !codeViewInstanceModel) return;
    const sortedUids = sortUidsAsc(selectedUids);
    let copiedCode = "";

    sortedUids.forEach((uid) => {
      const node = validNodeTree[uid];
      if (node) {
        const { startLine, startCol, endLine, endCol } =
          node.data.sourceCodeLocation;
        const text =
          codeViewInstanceModel &&
          codeViewInstanceModel.getValueInRange(
            new Range(startLine, startCol, endLine, endCol),
          );
        copiedCode += text;
      }
    });

    if (!skipUpdate) {
      await window.navigator.clipboard.writeText(copiedCode);

      dispatch(
        setCopiedNodeDisplayName(
          selectedItems.map(
            (uid) => `Node-<${validNodeTree[uid].displayName}>`,
          ),
        ),
      );
    }
    return copiedCode;
  };

  const getElementSettings = (uid?: string) => {
    const focusedNode = validNodeTree[uid!] || validNodeTree[nFocusedItem];
    const { startTag } = focusedNode.data.sourceCodeLocation;
    if (!startTag) return {};
    const attributesKey = startTag.attrs ? Object.keys(startTag.attrs) : [];
    const existingAttributesObj: { [key: string]: string } = {};
    if (focusedNode.data.attribs) {
      attributesKey.forEach((key) => {
        existingAttributesObj[key] = focusedNode.data.attribs[key];
      });
    }
    return existingAttributesObj;
  };

  //Update
  const cut = async () => {
    if (!checkAllResourcesAvailable || !codeViewInstanceModel) return;

    const helperModel = getEditorModelWithCurrentCode();
    helperModel.setValue(codeViewInstanceModel.getValue());

    const { updatedCode, copiedCode, sortedUids } = await copyAndCutNode({
      sortDsc: true,
    });

    dispatch(
      setCopiedNodeDisplayName(
        selectedItems.map((uid) => `Node-<${validNodeTree[uid].displayName}>`),
      ),
    );

    codeViewInstanceModel.setValue(updatedCode);
    return {
      updatedCode,
      copiedCode,
      sortedUids,
    };
  };

  const paste = async (params: Ipaste = {}) => {
    const {
      content,
      skipUpdate,
      pastePosition = "after",
      targetNode,
      pasteContent,
    } = params;

    if (!codeViewInstanceModel) return;

    /* if targetUid is not provided, then the focused node will be the target node */
    const focusedNode = targetNode ? targetNode : validNodeTree[nFocusedItem];

    if (
      !focusedNode ||
      !focusedNode.data.sourceCodeLocation ||
      focusedNode?.parentUid === RootNodeUid
    ) {
      LogAllow &&
        console.error("Focused node or source code location is undefined");
      return;
    }

    const initialCode = content || codeViewInstanceModel.getValue();

    const helperModel = getEditorModelWithCurrentCode();
    helperModel.setValue(initialCode);

    let copiedCode =
      pasteContent || (await window.navigator.clipboard.readText());

    const { startLine, startCol, endLine, endCol } =
      focusedNode.data.sourceCodeLocation;

    /* can be used to paste the copied code before the focused node */
    let editRange;
    if (pastePosition === "before") {
      editRange = new Range(startLine, startCol, startLine, startCol);
    } else if (pastePosition === "after") {
      editRange = new Range(endLine, endCol, endLine, endCol);
    } else {
      const { startTag } = focusedNode.data.sourceCodeLocation;

      editRange = new Range(
        startTag.endLine,
        startTag.endCol,
        startTag.endLine,
        startTag.endCol,
      );
    }
    copiedCode = await PrettyCode({ code: copiedCode });
    let code = copiedCode;
    const edit = {
      range: editRange,
      text: code,
    };
    helperModel.applyEdits([edit]);

    code = helperModel.getValue();
    if (!skipUpdate) {
      const stringToHtml = parse5.parseFragment(copiedCode);

      const tagNames = stringToHtml.childNodes
        .filter((node) => {
          //@ts-expect-error - node.nodeName is not a string
          if (isValidNode(node)) {
            return true;
          }
        })
        .map((node) => node.nodeName.toLowerCase());
      await findNodeToSelectAfterAction({
        nodeUids: [focusedNode.uid],
        action: {
          type: "add",
          tagNames,
        },
      });
      codeViewInstanceModel.setValue(code);
    }

    return code;
  };

  const plainPaste = () => {};

  const group = async (params: Igroup = {}) => {
    if (!checkAllResourcesAvailable() || !codeViewInstanceModel) return;
    const { skipUpdate } = params;

    const helperModel = getEditorModelWithCurrentCode();
    helperModel.setValue(codeViewInstanceModel.getValue());

    const copiedCode = await copy();

    const sortedUids = sortUidsAsc(selectedItems);

    if (sortedUids.length === 0) return;
    const { startLine, startCol } =
      validNodeTree[sortedUids[0]].data.sourceCodeLocation;

    const updatedCode = await remove({
      content: helperModel.getValue(),
      skipUpdate: true,
    });
    if (!updatedCode) return;
    helperModel.setValue(updatedCode);

    let code = `<div>${copiedCode}</div>`;
    code = await PrettyCode({ code });

    const edit = {
      range: new Range(startLine, startCol, startLine, startCol),
      text: code,
    };

    findNodeToSelectAfterAction({
      nodeUids: [sortedUids[0]],
      action: {
        type: "replace",
        tagNames: ["div"],
      },
    });

    helperModel.applyEdits([edit]);
    const finalCode = helperModel.getValue();
    if (!skipUpdate) {
      codeViewInstanceModel.setValue(finalCode);
    }
    return finalCode;
  };

  const ungroup = async (params: Iungroup = {}) => {
    if (!checkAllResourcesAvailable() || !codeViewInstanceModel) return;

    const { skipUpdate } = params;
    const helperModel = getEditorModelWithCurrentCode();
    helperModel.setValue(codeViewInstanceModel.getValue());

    const sortedUids = sortUidsAsc(selectedItems);
    const allNodePathsToSelect: string[] = [];
    for (let i = 0; i < sortedUids.length; i++) {
      const uid = sortedUids[i];
      const node = validNodeTree[uid];

      const children = node?.children;

      if (!children) return;

      const { startLine, startCol, endLine, endCol } =
        node.data.sourceCodeLocation;
      let copiedCode = "";
      children.forEach((uid) => {
        const node = validNodeTree[uid];
        if (node) {
          const { startLine, startCol, endLine, endCol } =
            node.data.sourceCodeLocation;
          const text = codeViewInstanceModel.getValueInRange(
            new Range(startLine, startCol, endLine, endCol),
          );
          copiedCode += text;
        }
      });

      const removeGroupedCodeEdit = {
        range: new Range(startLine, startCol, endLine, endCol),
        text: "",
      };

      const preetyCopiedCode = await PrettyCode({ code: copiedCode });
      const addUngroupedCodeEdit = {
        range: new Range(startLine, startCol, startLine, startCol),
        text: preetyCopiedCode,
      };

      const stringToHtml = parse5.parseFragment(preetyCopiedCode);

      const tagNames = stringToHtml.childNodes
        .filter((node) => {
          //@ts-expect-error - node.nodeName is not a string
          if (isValidNode(node)) {
            return true;
          }
        })
        .map((node) => node.nodeName.toLowerCase());
      const nodesPathToSelect = await findNodeToSelectAfterAction({
        nodeUids: [uid],
        action: {
          type: "replace",
          tagNames,
        },
      });
      if (nodesPathToSelect) {
        allNodePathsToSelect.push(...nodesPathToSelect);
      }
      helperModel.applyEdits([removeGroupedCodeEdit, addUngroupedCodeEdit]);
    }
    const code = helperModel.getValue();
    if (!skipUpdate) {
      codeViewInstanceModel.setValue(code);
      dispatch(setNeedToSelectNodePaths(allNodePathsToSelect));
    }
  };

  const move = async (params: Imove) => {
    if (!codeViewInstanceModel) return;
    /*
    isBetween is false when we drop on a parent node and is true when we drop inside a parent node which has children
    isBetween is true even if we drop on the first child of the parent node
    */
    const { targetUid, isBetween, position, selectedUids } = params;
    const targetNode = validNodeTree[targetUid];

    const helperModel = getEditorModelWithCurrentCode();

    // When the position is 0 we need to add inside the target node
    const focusedItem =
      isBetween && position === 0
        ? targetNode.uid
        : targetNode.children[position - 1]
          ? targetNode.children[position - 1]
          : targetNode.uid;

    const copiedCode = await copy({
      uids: selectedUids,
      skipUpdate: true,
    });

    const sortedUids = Array.from([...selectedUids, focusedItem])
      .filter((uid) => validNodeTree[uid].data.sourceCodeLocation)
      .sort((a, b) => {
        return parseInt(b) - parseInt(a);
      });

    for (let i = 0; i < sortedUids.length; i++) {
      const uid = sortedUids[i];
      const node = validNodeTree[uid];
      if (node) {
        const { startLine, startCol, endLine, endCol } =
          node.data.sourceCodeLocation;
        const range = new Range(startLine, startCol, endLine, endCol);
        if (copiedCode && uid === focusedItem) {
          const pastePosition =
            focusedItem === targetNode.uid ? "inside" : "after";

          const updatedCode = await paste({
            content: helperModel.getValue(),
            pasteContent: copiedCode,
            pastePosition,
            targetNode: validNodeTree[focusedItem],
            skipUpdate: true,
          });
          updatedCode && helperModel.setValue(updatedCode);
        } else {
          const edit = {
            range,
            text: "",
          };
          helperModel.applyEdits([edit]);
        }
      }
    }

    codeViewInstanceModel.setValue(helperModel.getValue());
  };

  const updateEditableElement = useCallback(
    async (params: IupdateEditableElement) => {
      const { eventListenerRef, contentEditableUid } = params;
      const helperModel = getEditorModelWithCurrentCode();
      const iframeRef = eventListenerRef.current.iframeRefRef.current;
      const nodeTree = eventListenerRef.current.nodeTreeRef.current;
      const codeViewInstanceModel = monacoEditorRef.current?.getModel();
      if (!codeViewInstanceModel || !iframeRef) return;

      const contentEditableElement =
        iframeRef.contentWindow?.document.querySelector(
          `[${StageNodeIdAttr}="${contentEditableUid}"]`,
        ) as HTMLElement;

      if (!contentEditableElement) return;

      contentEditableElement.setAttribute("contenteditable", "false");
      const content = contentEditableElement.innerHTML
        .replace(/\n/, "")
        .replace(
          /data-rnbw-stage-node-id="\d+"|rnbwdev-rnbw-element-(select|hover)=""/g,
          "",
        );

      helperModel.setValue(codeViewInstanceModel.getValue());
      const focusedNode = nodeTree[contentEditableUid];
      const { startTag, endTag, startLine, endLine, startCol, endCol } =
        focusedNode.data.sourceCodeLocation;
      if (startTag && endTag) {
        const edit = {
          range: new Range(
            startTag.endLine,
            startTag.endCol,
            endTag.startLine,
            endTag.startCol,
          ),
          text: content,
        };
        helperModel.applyEdits([edit]);
      } else if (startLine && endLine && startCol && endCol) {
        const edit = {
          range: new Range(startLine, startCol, endLine, endCol),
          text: content,
        };
        helperModel.applyEdits([edit]);
      }
      const code = helperModel.getValue();
      await dispatch(setIsContentProgrammaticallyChanged(true));
      codeViewInstanceModel.setValue(code);
      const uniqueNodePath = focusedNode.uniqueNodePath;
      uniqueNodePath && dispatch(setNeedToSelectNodePaths([uniqueNodePath]));
    },
    [codeViewInstanceModel],
  );

  const updateSettings = async (params: IupdateSettings) => {
    if (!checkAllResourcesAvailable() || !codeViewInstanceModel) return;

    const { settings, skipUpdate } = params;
    const oldSettings = getElementSettings();
    const helperModel = getEditorModelWithCurrentCode();
    helperModel.setValue(codeViewInstanceModel.getValue());

    const focusedNode = validNodeTree[nFocusedItem];
    const attributesString = Object.entries(settings).reduce(
      (acc, [key, value]) => {
        const attributes = `${acc} ${key}="${value}"`;
        return attributes;
      },
      "",
    );
    const updatedTag = `<${focusedNode.displayName}${attributesString}>`;
    /* Don't prettify the code with prettyCode function 
    for updating the attributes as it automatically adds the closing tag */

    /* validating the attributes using PrettyCode function */
    let isInvalid = false;
    await PrettyCode({ code: updatedTag, throwError: true }).catch((e) => {
      LogAllow && console.error("Error in pretty code", e);
      if (e.stack.includes("SyntaxError")) {
        isInvalid = true;
        toast.error("Invalid settings value");
      }
    });
    if (isInvalid) return { isSuccess: false, settings: oldSettings };

    const { startTag } = focusedNode.data.sourceCodeLocation;
    const range = new Range(
      startTag.startLine,
      startTag.startCol,
      startTag.endLine,
      startTag.endCol,
    );
    const edit = {
      range,
      text: updatedTag,
    };
    helperModel.applyEdits([edit]);
    const code = helperModel.getValue();
    if (!skipUpdate) {
      await findNodeToSelectAfterAction({
        nodeUids: [nFocusedItem],
        action: {
          type: "replace",
        },
      });
      await dispatch(setIsContentProgrammaticallyChanged(true));
      codeViewInstanceModel.setValue(code);
    }

    return { isSuccess: true, settings, code };
  };

  const undo = () => {
    if (nodeEventPastLength <= 2) {
      LogAllow && console.log("Undo - NodeTree - it is the origin state");
      return;
    }
    if (
      currentFileContent !==
        nodeEventPast[nodeEventPastLength - 1].currentFileContent &&
      selectedNodeUids ===
        nodeEventPast[nodeEventPastLength - 1].selectedNodeUids
    ) {
      dispatch({ type: NodeTree_Event_UndoActionType });
      dispatch({ type: NodeTree_Event_UndoActionType });
    } else {
      dispatch({ type: NodeTree_Event_UndoActionType });
    }
    dispatch(setIsContentProgrammaticallyChanged(true));
    dispatch(setDidUndo(true));
  };

  const redo = () => {
    if (nodeEventFutureLength === 0) {
      LogAllow && console.log("Redo - NodeTree - it is the latest state");
      return;
    }

    dispatch({ type: NodeTree_Event_RedoActionType });
    dispatch(setDidRedo(true));
    dispatch(setIsContentProgrammaticallyChanged(true));
  };

  const setSelectedElements = (uids: string[]) => {
    dispatch(setSelectedNodeUids(uids));
  };

  //Delete
  const remove = async (params: Iremove = {}) => {
    const { uids, skipUpdate, content } = params;
    const removalUids = uids || selectedItems;

    if (removalUids.length === 0 || !codeViewInstanceModel) return;
    /* The user should not be able to delete the html, head, and body tags. */
    if (
      removalUids.some((uid) =>
        ["html", "head", "body"].includes(validNodeTree[uid].displayName),
      )
    ) {
      LogAllow && console.error("Deleting nodes not allowed");
      return;
    }

    const contentToEdit = content || codeViewInstanceModel.getValue();

    const helperModel = getEditorModelWithCurrentCode();
    helperModel.setValue(contentToEdit);

    const sortedUids = sortUidsDsc(removalUids);

    sortedUids.forEach((uid) => {
      const node = validNodeTree[uid];
      if (node) {
        const { startCol, startLine, endCol, endLine } =
          node.data.sourceCodeLocation;
        const edit = {
          range: new Range(startLine, startCol, endLine, endCol),
          text: "",
        };
        helperModel.applyEdits([edit]);
      }
    });

    const code = helperModel.getValue();

    if (!skipUpdate) {
      await findNodeToSelectAfterAction({
        nodeUids: [removalUids[0]],
        action: {
          type: "remove",
        },
      });
      await dispatch(setIsContentProgrammaticallyChanged(true));
      codeViewInstanceModel.setValue(code);
    }
    return code;
  };
  return {
    getElement,
    getElementSettings,
    add,
    duplicate,
    getSelectedElements,
    copy,
    setSelectedElements,
    cut,
    paste,
    plainPaste,
    group,
    ungroup,
    move,
    updateEditableElement,
    updateSettings,
    undo,
    redo,
    remove,
  };
}
