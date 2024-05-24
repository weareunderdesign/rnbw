import {
  sortUidsByMaxEndIndex,
  sortUidsByMinStartIndex,
} from "@_components/main/actionsPanel/nodeTreeView/helpers";
import { eventListenersStatesRefType } from "@_components/main/stageView/iFrame/IFrame";
import { LogAllow } from "@_constants/global";
import { RootNodeUid } from "@_constants/main";
import { StageNodeIdAttr } from "@_node/file";

import { getObjKeys } from "@_pages/main/helper";
import { MainContext } from "@_redux/main";
import {
  NodeTree_Event_RedoActionType,
  NodeTree_Event_UndoActionType,
  setCopiedNodeDisplayName,
  setSelectedNodeUids,
} from "@_redux/main/nodeTree";
import { setDidRedo, setDidUndo } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import {
  Iadd,
  Icopy,
  Iduplicate,
  Imove,
  Ipaste,
  Iremove,
  IupdateSettings,
} from "@_types/elements.types";
import { html_beautify } from "js-beautify";
import { Range } from "monaco-editor";
import { useCallback, useContext, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useElementHelper } from "./useElementsHelper";
import { toast } from "react-toastify";
import * as parse5 from "parse5";

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

    const sortedUids = sortUidsByMinStartIndex(selectedItems, validNodeTree);
    if (sortedUids.length === 0) {
      toast.error("Please select a node to add the new element");
      return;
    }
    const uid = sortedUids[0];
    const node = validNodeTree[uid];
    let code = "";
    if (node) {
      const { endCol, endLine } = node.data.sourceCodeLocation;

      codeViewText = html_beautify(codeViewText);
      const edit = {
        range: new Range(endLine, endCol, endLine, endCol),
        text: codeViewText,
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

        codeViewInstanceModel.setValue(code);
      }
    }

    return { code };
  };

  const duplicate = async (params: Iduplicate = {}) => {
    if (!checkAllResourcesAvailable() || !codeViewInstanceModel) return;
    const { skipUpdate } = params;

    const helperModel = getEditorModelWithCurrentCode();

    const sortedUids = sortUidsByMaxEndIndex(selectedItems, validNodeTree);
    sortedUids.forEach((uid) => {
      const node = validNodeTree[uid];
      if (node) {
        const { startCol, startLine, endCol, endLine } =
          node.data.sourceCodeLocation;
        let text = codeViewInstanceModel.getValueInRange(
          new Range(startLine, startCol, endLine, endCol),
        );

        text = html_beautify(text);
        const edit = {
          range: new Range(endLine, endCol, endLine, endCol),
          text,
        };
        helperModel.applyEdits([edit]);
      }
    });
    const code = helperModel.getValue();
    if (!skipUpdate) {
      await findNodeToSelectAfterAction({
        nodeUids: selectedNodeUids,
        action: {
          type: "add",
        },
      });
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
    const sortedUids = sortUidsByMinStartIndex(selectedUids, validNodeTree);
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

    await copyAndCutNode({
      sortDsc: true,
    });

    dispatch(
      setCopiedNodeDisplayName(
        selectedItems.map((uid) => `Node-<${validNodeTree[uid].displayName}>`),
      ),
    );
    const code = helperModel.getValue();
    codeViewInstanceModel.setValue(code);
  };

  const paste = async (params: Ipaste = {}) => {
    const {
      content,
      skipUpdate,
      pastePosition = "after",
      targetUid,
      pasteContent,
    } = params;

    if (!codeViewInstanceModel) return;

    /* if targetUid is not provided, then the focused node will be the target node */
    const focusedNode = targetUid
      ? validNodeTree[targetUid]
      : validNodeTree[nFocusedItem];

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
    copiedCode = html_beautify(copiedCode);
    let code = copiedCode;
    const edit = {
      range: editRange,
      text: code,
    };
    helperModel.applyEdits([edit]);

    code = helperModel.getValue();
    if (!skipUpdate) {
      const stringToHtml = parse5.parseFragment(copiedCode);

      const tagNames = stringToHtml.childNodes.map((node) =>
        node.nodeName.toLowerCase(),
      );
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
  /*

Scenario 1:

a-> 1 - 100
b-> 100 -200
c-> 200 - 300
d-> 300 - 400


b is deleted, so now new ranges should be changed (which is not updated as we want move operation to be performed as one step)

a-> 1 - 100
c-> 100 - 200
d-> 200 - 300

if we paste b below c with old ranges, then b will be pasted from line 200 (if range is not updated) which is wrong
b should be pasted from line 200 as per the new ranges

Scenario 2:

a-> 1 - 100
b-> 100 -200
c-> 200 - 300
d-> 300 - 400

now we just copy b. The location of nodes will remain same

We now paste b below c. The new ranges now should be:
a -> 1 - 100
b -> 100 - 200
c -> 200 - 300
b -> 300 - 400
d -> 400 - 500

Now we delete b. The new ranges should be:
a -> 1 - 100
c -> 100 - 200
b -> 200 - 300
d -> 300 - 400
*/
  const group = async () => {
    if (!checkAllResourcesAvailable() || !codeViewInstanceModel) return;

    const helperModel = getEditorModelWithCurrentCode();
    helperModel.setValue(codeViewInstanceModel.getValue());

    const copiedCode = await copy();

    const sortedUids = sortUidsByMinStartIndex(selectedItems, validNodeTree);

    if (sortedUids.length === 0) return;
    const { startLine, startCol } =
      validNodeTree[sortedUids[0]].data.sourceCodeLocation;

    const updatedCode = await remove({
      content: helperModel.getValue(),
      skipUpdate: false,
    });
    if (!updatedCode) return;
    helperModel.setValue(updatedCode);

    let code = `<div>${copiedCode}</div>`;
    code = html_beautify(code);

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
    codeViewInstanceModel.setValue(html_beautify(helperModel.getValue()));
  };

  const ungroup = () => {
    if (!checkAllResourcesAvailable() || !codeViewInstanceModel) return;

    const helperModel = getEditorModelWithCurrentCode();
    helperModel.setValue(codeViewInstanceModel.getValue());

    const sortedUids = sortUidsByMaxEndIndex(selectedItems, validNodeTree);
    sortedUids.map((uid) => {
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
      const addUngroupedCodeEdit = {
        range: new Range(startLine, startCol, startLine, startCol),
        text: copiedCode,
      };
      helperModel.applyEdits([removeGroupedCodeEdit, addUngroupedCodeEdit]);
    });
    const code = html_beautify(helperModel.getValue());
    codeViewInstanceModel.setValue(code);
  };

  const move = async (params: Imove) => {
    if (!codeViewInstanceModel) return;
    /*
    isBetween is false when we drop on a parent node and is true when we drop inside a parent node which has children
    isBetween is true even if we drop on the first child of the parent node
    */
    const { targetUid, isBetween, position, selectedUids } = params;
    const helperModel = getEditorModelWithCurrentCode();

    const targetNode = validNodeTree[targetUid];

    // When the position is 0 we need to add inside the target node
    const focusedItem =
      isBetween && position === 0
        ? targetNode.uid
        : targetNode.children[position - 1]
          ? targetNode.children[position - 1]
          : targetNode.uid;

    const { copiedCode } = await copyAndCutNode({
      selectedUids,
      pasteToClipboard: false,
    });

    const sortedUids = sortUidsByMaxEndIndex(
      [...selectedUids, focusedItem],
      validNodeTree,
    );

    const pastePosition = focusedItem === targetNode.uid ? "inside" : "after";
    let isFirst = true; // isFirst is used to when drop focusedItem to itself

    sortedUids.forEach(async (uid) => {
      if (uid === focusedItem && isFirst) {
        isFirst = false;
        const pastedCode = (await paste({
          pasteContent: copiedCode,
          content: helperModel.getValue(),
          targetUid: focusedItem,
          pastePosition,
        })) as string;

        helperModel.setValue(pastedCode);
      } else {
        const updatedCode = await remove({
          uids: [uid],
          skipUpdate: true,
        });

        updatedCode && helperModel.setValue(updatedCode);
      }
    });

    const prettyCode = html_beautify(helperModel.getValue(), {
      preserve_newlines: false,
    });
    codeViewInstanceModel.setValue(prettyCode);
  };

  const updateEditableElement = useCallback(
    (params: eventListenersStatesRefType) => {
      const { iframeRefRef, contentEditableUidRef, nodeTreeRef } = params;
      const helperModel = getEditorModelWithCurrentCode();
      const iframeRef = iframeRefRef.current;
      const nodeTree = nodeTreeRef.current;
      const codeViewInstanceModel = monacoEditorRef.current?.getModel();
      if (!codeViewInstanceModel || !iframeRef) return;
      const contentEditableUid = contentEditableUidRef.current;
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
      const focusedNode = nodeTree[nFocusedItem];
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
      const code = html_beautify(helperModel.getValue());
      codeViewInstanceModel.setValue(code);
    },
    [codeViewInstanceModel],
  );

  const updateSettings = async (params: IupdateSettings) => {
    if (!checkAllResourcesAvailable() || !codeViewInstanceModel) return;

    const { settings, skipUpdate } = params;

    const helperModel = getEditorModelWithCurrentCode();
    helperModel.setValue(codeViewInstanceModel.getValue());

    const focusedNode = validNodeTree[nFocusedItem];
    const attributesString = Object.entries(settings).reduce(
      (acc, [key, value]) => {
        //TODO: test for invalid characters
        return `${acc} ${key}="${value}"`;
      },
      "",
    );
    const updatedTag = `<${focusedNode.displayName}${attributesString}>`;

    const { startTag } = focusedNode.data.sourceCodeLocation;
    const edit = {
      range: new Range(
        startTag.startLine,
        startTag.startCol,
        startTag.endLine,
        startTag.endCol,
      ),
      text: updatedTag,
    };
    helperModel.applyEdits([edit]);
    const code = html_beautify(helperModel.getValue());
    if (!skipUpdate) {
      await findNodeToSelectAfterAction({
        nodeUids: [nFocusedItem],
        action: {
          type: "replace",
        },
      });
      codeViewInstanceModel.setValue(code);
    }

    return settings;
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

    dispatch(setDidUndo(true));
  };

  const redo = () => {
    if (nodeEventFutureLength === 0) {
      LogAllow && console.log("Redo - NodeTree - it is the latest state");
      return;
    }

    dispatch({ type: NodeTree_Event_RedoActionType });

    dispatch(setDidRedo(true));
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

    const sortedUids = sortUidsByMaxEndIndex(removalUids, validNodeTree);
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
