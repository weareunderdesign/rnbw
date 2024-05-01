import { sortUidsByMaxEndIndex } from "@_components/main/actionsPanel/nodeTreeView/helpers";
import { getObjKeys } from "@_pages/main/helper";
import { useAppState } from "@_redux/useAppState";
import { Iadd } from "@_types/elements.types";
import { Range, editor } from "monaco-editor";
import { useMemo } from "react";

export default function useElements() {
  const { nSelectedItemsObj, htmlReferenceData, validNodeTree } = useAppState();

  const selectedItems = useMemo(
    () => getObjKeys(nSelectedItemsObj),
    [nSelectedItemsObj],
  );
  // helperModel added to update the code in the codeViewInstanceModel
  // once when the action is executed, this improves the History Management
  const helperModel = editor.createModel("", "html");
  //Create
  const add = (params: Iadd) => {
    const { tagName } = params;

    if (selectedItems.length === 0) return;
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
  };

  const duplicate = () => {};

  //Read
  const getSelectedElements = () => {
    return selectedItems;
  };

  const getElement = (uid: string) => {
    return validNodeTree[uid];
  };
  const copy = () => {};
  //Update
  const cut = () => {};
  const paste = () => {};
  const plainPaste = () => {};
  const group = () => {};
  const ungroup = () => {};
  const move = () => {};
  const updateEditableElement = () => {};
  const updateSettings = () => {};
  const undo = () => {};
  const redo = () => {};

  //Delete
  const remove = () => {};
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
