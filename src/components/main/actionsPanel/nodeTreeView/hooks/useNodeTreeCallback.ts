import { DraggingPosition, TreeItem, TreeItemIndex } from "react-complex-tree";

import { TNodeUid } from "@_node/types";

import { useNodeViewState } from "./useNodeViewState";
import { useContext } from "react";
import { MainContext } from "@_redux/main";
import { Range } from "monaco-editor";
import { useEditor } from "@_components/main/codeView/hooks";
import {
  getCopiedContent,
  getDropOptions,
  sortUidsByMaxEndIndex,
} from "../helpers";
import { useSelector } from "react-redux";
import { AppState } from "@_redux/_root";

export const useNodeTreeCallback = (
  focusItemValue: TNodeUid | null,
  isDragging: boolean,
) => {
  const { validNodeTree } = useSelector(
    (state: AppState) => state.main.nodeTree,
  );
  const { monacoEditorRef, setIsContentProgrammaticallyChanged } =
    useContext(MainContext);

  const { cb_focusNode, cb_selectNode, cb_expandNode, cb_collapseNode } =
    useNodeViewState(focusItemValue);

  const onSelectItems = (items: TreeItemIndex[]) => {
    cb_selectNode(items as TNodeUid[]);
  };

  const onFocusItem = (item: TreeItem) => {
    cb_focusNode(item.index as TNodeUid);
  };

  const onExpandItem = (item: TreeItem) => {
    cb_expandNode(item.index as TNodeUid);
  };

  const onCollapseItem = (item: TreeItem) => {
    cb_collapseNode(item.index as TNodeUid);
  };

  const { handleEditorChange } = useEditor();

  const onDrop = (
    items: TreeItem[],
    target: DraggingPosition & { parentItem?: TreeItemIndex },
  ) => {
    if (target.parentItem === "ROOT") return;
    const uids: TNodeUid[] = items.map((item) => item.index as TNodeUid);

    const model = monacoEditorRef.current?.getModel();
    if (!model) {
      console.error("Monaco Editor model is undefined");
      return;
    }
    setIsContentProgrammaticallyChanged(true);
    const dropOptions = getDropOptions(target, validNodeTree, model);
    if (dropOptions === undefined) {
      return;
    }
    const { position, isBetween, order, targetendOffset, targetUid } =
      dropOptions;

    const range = new Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column,
    );

    const iframe: any = document.getElementById("iframeId");
    let copiedCode = "";
    uids.forEach((uid, index) => {
      const cleanedUpCode = getCopiedContent(uid, iframe);
      if (!cleanedUpCode) return;
      copiedCode +=
        items.length - 1 == index ? cleanedUpCode : cleanedUpCode + "\n";
    });

    const editOperation =
      isBetween && !order
        ? { range, text: copiedCode + "\n" }
        : { range, text: "\n" + copiedCode };

    let pasted = 0;

    const sortedUids = sortUidsByMaxEndIndex(uids, validNodeTree);
    sortedUids.forEach((uid, index) => {
      let node = validNodeTree[uid];

      if (node) {
        const {
          endCol: endColumn,
          endLine: endLineNumber,
          startCol: startColumn,
          startLine: startLineNumber,
          endOffset: uidEndOffset,
        } = node.data.sourceCodeLocation;

        if (!pasted && uidEndOffset <= targetendOffset) {
          model.pushEditOperations([], [editOperation], () => null);
          monacoEditorRef.current?.setPosition({
            lineNumber:
              isBetween && !order
                ? position.lineNumber
                : position.lineNumber + 1,
            column: 1,
          });
          pasted += 1;
        }

        const range = new Range(
          startLineNumber,
          startColumn,
          endLineNumber,
          endColumn,
        );
        let edit = {
          range: range,
          text: "",
        };
        model.applyEdits([edit]);

        if (uidEndOffset > targetendOffset && !index) {
          model.pushEditOperations([], [editOperation], () => null);
          monacoEditorRef.current?.setPosition({
            lineNumber:
              isBetween && !order
                ? position.lineNumber
                : position.lineNumber + 1,
            column: 1,
          });
          pasted += 1;
        }
      }
    });

    const content = model.getValue();
    handleEditorChange(content, { matchIds: [targetUid, ...uids] });

    isDragging = false;

    // const className = "dragging-tree";
    // const html = document.getElementsByTagName("html").item(0);
    // let body = document.body as HTMLElement;
    // body.classList.remove("inheritCursors");
    // body.style.cursor = "unset";
    // if (html && new RegExp(className).test(html.className) === true) {
    //   // Remove className with the added space (from setClassToHTMLElement)

    //   html.className = html.className.replace(new RegExp(" " + className), "");
    //   // Remove className without added space (just in case)
    //   html.className = html.className.replace(new RegExp(className), "");
    // }
  };
  return {
    onSelectItems,
    onFocusItem,
    cb_expandNode,
    onExpandItem,
    onCollapseItem,
    onDrop,
  };
};
