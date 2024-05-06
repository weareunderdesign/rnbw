import {
  sortUidsByMaxEndIndex,
  sortUidsByMinStartIndex,
} from "@_components/main/actionsPanel/nodeTreeView/helpers";
import { LogAllow } from "@_constants/global";
import { RootNodeUid } from "@_constants/main";

import { getObjKeys } from "@_pages/main/helper";
import { MainContext } from "@_redux/main";
import {
  NodeTree_Event_RedoActionType,
  NodeTree_Event_UndoActionType,
  setCopiedNodeDisplayName,
} from "@_redux/main/nodeTree";
import { setDidRedo, setDidUndo } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import { Iadd } from "@_types/elements.types";
import { html_beautify } from "js-beautify";
import { Range, editor } from "monaco-editor";
import { useContext, useMemo } from "react";
import { useDispatch } from "react-redux";

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

  const codeViewInstanceModel = monacoEditorRef.current?.getModel();
  const selectedItems = useMemo(
    () => getObjKeys(nSelectedItemsObj),
    [nSelectedItemsObj],
  );

  /*The role of helperModel is to perform all the edit operations in it 
  without affecting the actual codeViewInstanceModel 
  and then apply the changes to the codeViewInstanceModel all at once.*/

  const helperModel = editor.createModel("", "html");
  codeViewInstanceModel &&
    helperModel.setValue(codeViewInstanceModel.getValue());

  function checkAllResourcesAvailable() {
    if (selectedItems.length === 0) return false;
    if (!codeViewInstanceModel) {
      LogAllow &&
        console.error(
          `Monaco Editor ${!codeViewInstanceModel ? "" : "Model"} is undefined`,
        );
      return false;
    }
    return true;
  }

  async function copyAndCutNode() {
    const sortedUids = sortUidsByMinStartIndex(selectedItems, validNodeTree);
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

        // remove the copied code from the original code
        const edit = {
          range: new Range(startLine, startCol, endLine, endCol),
          text: "",
        };
        helperModel.applyEdits([edit]);
      }
    });
    await window.navigator.clipboard.writeText(copiedCode);
    return {
      sortedUids,
      copiedCode,
    };
  }
  //Create
  const add = (params: Iadd) => {
    const { tagName } = params;
    if (!checkAllResourcesAvailable() || !codeViewInstanceModel) return;
    const commentTag = "!--...--";
    const HTMLElement =
      htmlReferenceData.elements[tagName === commentTag ? "comment" : tagName];

    let openingTag = HTMLElement?.Tag || "";
    if (HTMLElement?.Attributes) {
      openingTag = openingTag.replace(">", ` ${HTMLElement.Attributes}>`);
    }
    const closingTag = `</${tagName}>`;

    const tagContent = HTMLElement?.Content || "";

    const codeViewText =
      tagName === commentTag
        ? tagContent
        : HTMLElement?.Contain === "None"
          ? openingTag
          : `${openingTag}${tagContent}${closingTag}`;

    const sortedUids = sortUidsByMaxEndIndex(selectedItems, validNodeTree);
    sortedUids.forEach((uid) => {
      const node = validNodeTree[uid];
      if (node) {
        const { endCol, endLine } = node.data.sourceCodeLocation;

        const edit = {
          range: new Range(endLine, endCol, endLine, endCol),
          text: codeViewText,
        };
        helperModel.applyEdits([edit]);
      }
    });
    const code = html_beautify(helperModel.getValue());
    codeViewInstanceModel.setValue(code);
  };

  const duplicate = () => {
    if (!checkAllResourcesAvailable() || !codeViewInstanceModel) return;
    helperModel.setValue(codeViewInstanceModel.getValue());
    const sortedUids = sortUidsByMaxEndIndex(selectedItems, validNodeTree);
    sortedUids.forEach((uid) => {
      const node = validNodeTree[uid];
      if (node) {
        const { startCol, startLine, endCol, endLine } =
          node.data.sourceCodeLocation;
        const text = codeViewInstanceModel.getValueInRange(
          new Range(startLine, startCol, endLine, endCol),
        );
        const edit = {
          range: new Range(endLine, endCol, endLine, endCol),
          text,
        };
        helperModel.applyEdits([edit]);
      }
    });
    const code = html_beautify(helperModel.getValue());
    codeViewInstanceModel.setValue(code);
  };

  //Read
  const getSelectedElements = () => {
    return selectedItems;
  };

  const getElement = (uid: string) => {
    return validNodeTree[uid];
  };

  const copy = async () => {
    if (!checkAllResourcesAvailable()) return;
    const sortedUids = sortUidsByMinStartIndex(selectedItems, validNodeTree);
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
    await window.navigator.clipboard.writeText(copiedCode);

    dispatch(
      setCopiedNodeDisplayName(
        selectedItems.map((uid) => `Node-<${validNodeTree[uid].displayName}>`),
      ),
    );
  };

  //Update
  const cut = async () => {
    if (!checkAllResourcesAvailable || !codeViewInstanceModel) return;
    helperModel.setValue(codeViewInstanceModel.getValue());

    await copyAndCutNode();
    dispatch(
      setCopiedNodeDisplayName(
        selectedItems.map((uid) => `Node-<${validNodeTree[uid].displayName}>`),
      ),
    );
    const code = html_beautify(helperModel.getValue());
    codeViewInstanceModel.setValue(code);
  };
  const paste = async () => {
    if (!checkAllResourcesAvailable() || !codeViewInstanceModel) return;
    const focusedNode = validNodeTree[nFocusedItem];
    if (
      !focusedNode ||
      !focusedNode.data.sourceCodeLocation ||
      focusedNode?.parentUid === RootNodeUid
    ) {
      LogAllow &&
        console.error("Focused node or source code location is undefined");
      return;
    }

    helperModel.setValue(codeViewInstanceModel.getValue());
    let code = await window.navigator.clipboard.readText();

    const { startLine, startCol, endLine, endCol } =
      focusedNode.data.sourceCodeLocation;

    /* can be used to paste the copied code before the focused node */
    const addToBefore = false;
    const edit = {
      range: new Range(
        addToBefore ? startLine : endLine,
        addToBefore ? startCol : endCol,
        addToBefore ? startLine : endLine,
        addToBefore ? startCol : endCol,
      ),
      text: code,
    };
    helperModel.applyEdits([edit]);

    code = html_beautify(helperModel.getValue());
    codeViewInstanceModel.setValue(code);
  };
  const plainPaste = () => {};
  const group = async () => {
    if (!checkAllResourcesAvailable() || !codeViewInstanceModel) return;
    helperModel.setValue(codeViewInstanceModel.getValue());
    const { sortedUids, copiedCode } = await copyAndCutNode();
    const { startLine, startCol } =
      validNodeTree[sortedUids[0]].data.sourceCodeLocation;

    const code = `<div>${copiedCode}</div>`;
    const edit = {
      range: new Range(startLine, startCol, startLine, startCol),
      text: code,
    };

    helperModel.applyEdits([edit]);
    codeViewInstanceModel.setValue(html_beautify(helperModel.getValue()));
  };
  const ungroup = () => {
    if (!checkAllResourcesAvailable() || !codeViewInstanceModel) return;
    helperModel.setValue(codeViewInstanceModel.getValue());

    const sortedUids = sortUidsByMaxEndIndex(selectedItems, validNodeTree);
    sortedUids.map((uid) => {
      const node = validNodeTree[uid];
      const children = node.children;
      if (children.length === 0) return;

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
  const move = () => {};
  const updateEditableElement = () => {};
  const updateSettings = () => {};
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

  //Delete
  const remove = () => {
    if (!checkAllResourcesAvailable() || !codeViewInstanceModel) return;

    /* The user should not be able to delete the html, head, and body tags. */
    if (
      selectedItems.some((uid) =>
        ["html", "head", "body"].includes(validNodeTree[uid].displayName),
      )
    ) {
      LogAllow && console.error("Deleting nodes not allowed");
      return;
    }

    helperModel.setValue(codeViewInstanceModel.getValue());

    const sortedUids = sortUidsByMaxEndIndex(selectedItems, validNodeTree);
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

    const code = html_beautify(helperModel.getValue());
    codeViewInstanceModel.setValue(code);
  };
  return {
    getElement,
    add,
    duplicate,
    getSelectedElements,
    copy,
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
