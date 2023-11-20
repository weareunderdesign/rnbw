import { useCallback, useContext } from "react";

import { Range } from "monaco-editor";

import { useEditor } from "@_components/main/codeView/hooks";
import { AddNodeActionPrefix } from "@_constants/main";
import { MainContext } from "@_redux/main";

import { useNodeActions } from "./useNodeActions";
import { html_beautify } from "js-beautify";
import { useAppState } from "@_redux/useAppState";
import { LogAllow } from "@_constants/global";
import { callNodeApi } from "@_node/apis";

export const useNodeActionsHandlers = () => {
  const {
    nodeTree,
    validNodeTree,
    codeViewTabSize,
    nFocusedItem: focusedItem,
    nSelectedItems: selectedItems,
  } = useAppState();
  const { monacoEditorRef, setIsContentProgrammaticallyChanged } =
    useContext(MainContext);

  const {
    cb_addNode,
    cb_removeNode,
    cb_duplicateNode,
    cb_copyNode,
    cb_groupNode,
    cb_ungroupNode,
  } = useNodeActions();

  const { handleEditorChange } = useEditor();

  const onCut = useCallback(() => {
    if (selectedItems.length === 0) return;
    cb_copyNode(selectedItems);
    cb_removeNode(selectedItems);
  }, [selectedItems, cb_copyNode, cb_removeNode]);

  const onCopy = useCallback(() => {
    if (selectedItems.length === 0) return;
    cb_copyNode(selectedItems);
  }, [selectedItems, cb_copyNode]);

  const onPaste = useCallback(() => {
    const focusedNode = validNodeTree[focusedItem];
    const model = monacoEditorRef.current?.getModel();

    if (!focusedNode || !focusedNode.data.sourceCodeLocation) {
      LogAllow &&
        console.error("Focused node or its source code location is undefined");
      return;
    }
    if (!model) {
      LogAllow && console.error("Monaco Editor model is undefined");
      return;
    }

    const { endLine, endCol } = focusedNode.data.sourceCodeLocation;

    window.navigator.clipboard
      .readText()
      .then((copiedCode) => {
        const position = { lineNumber: endLine, column: endCol + 1 };
        const range = new Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column,
        );
        const editOperation = { range, text: copiedCode };

        model.pushEditOperations([], [editOperation], () => null);
        monacoEditorRef.current?.setPosition({
          lineNumber: position.lineNumber + 1,
          column: 1,
        });
        const content = html_beautify(model.getValue());
        model.setValue(content);
        handleEditorChange(content);
      })
      .catch((error) => {
        LogAllow && console.error("Error reading from clipboard:", error);
      });
  }, [validNodeTree, focusedItem]);

  const onDelete = useCallback(() => {
    if (selectedItems.length === 0) return;
    const model = monacoEditorRef.current?.getModel();
    if (!model) {
      LogAllow && console.error("Monaco Editor model is undefined");
      return;
    }

    // setIsContentProgrammaticallyChanged(true);
    callNodeApi(
      {
        tree: nodeTree,
        isFileTree: false,
        fileExt: "html",
        action: "remove",
        selectedUids: selectedItems,

        codeViewInstanceModel: model,
      },
      // handleEditorChange,
    );
  }, [selectedItems, handleEditorChange]);
  const onDuplicate = useCallback(() => {
    if (selectedItems.length === 0) return;
    cb_duplicateNode(selectedItems);
  }, [selectedItems, cb_duplicateNode]);

  const onTurnInto = useCallback(() => {}, []);

  const onGroup = useCallback(() => {
    if (selectedItems.length === 0) return;
    cb_groupNode(selectedItems);
  }, [cb_groupNode, selectedItems]);
  const onUngroup = useCallback(() => {
    if (selectedItems.length === 0) return;
    cb_ungroupNode(selectedItems);
  }, [cb_ungroupNode, selectedItems]);

  const onAddNode = useCallback(
    (actionName: string) => {
      const tagName = actionName.slice(
        AddNodeActionPrefix.length + 2,
        actionName.length - 1,
      );
      cb_addNode(tagName);
    },
    [cb_addNode],
  );

  return {
    onAddNode,
    onCut,
    onCopy,
    onPaste,
    onDelete,
    onDuplicate,
    onTurnInto,
    onGroup,
    onUngroup,
  };
};
