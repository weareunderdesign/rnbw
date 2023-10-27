import { useCallback, useContext } from "react";
import { useSelector } from "react-redux";
import { TNodeUid } from "@_node/types";
import { fnSelector, MainContext, navigatorSelector } from "@_redux/main";
import { AddNodeActionPrefix } from "@_constants/main";

import { useNodeActions } from "./useNodeActions";
import { Range } from "monaco-editor";
import { useEditor } from "@_components/main/codeView/hooks";

export const useNodeActionsHandlers = () => {
  const { file } = useSelector(navigatorSelector);
  const { focusedItem, selectedItems } = useSelector(fnSelector);
  const {
    // file tree view
    ffTree,
    // node tree view
    nodeTree,
    validNodeTree,
    // other
    theme: _theme,
    monacoEditorRef,
  } = useContext(MainContext);

  const { cb_addNode, cb_removeNode, cb_duplicateNode, cb_copyNode } =
    useNodeActions();

  const { handleEditorChange } = useEditor();

  const onCut = useCallback(() => {
    if (selectedItems.length === 0) return;
    cb_copyNode(selectedItems);
    cb_removeNode(selectedItems);
  }, [selectedItems, ffTree[file.uid], nodeTree, cb_removeNode, cb_copyNode]);

  const onCopy = useCallback(() => {
    if (selectedItems.length === 0) return;
    cb_copyNode(selectedItems);
  }, [selectedItems, ffTree[file.uid], nodeTree, cb_copyNode]);

  const onPaste = useCallback(() => {
    const focusedNode = validNodeTree[focusedItem];

    if (!focusedNode?.uid) {
      console.error("Focused node is undefined");
      return;
    }

    const selectedNode = validNodeTree[focusedNode.uid];
    if (!selectedNode || !selectedNode.sourceCodeLocation) {
      console.error("Parent node or source code location is undefined");
      return;
    }

    const { endLine, endCol } = selectedNode.sourceCodeLocation;
    const model = monacoEditorRef.current?.getModel();

    if (!model) {
      console.error("Monaco Editor model is undefined");
      return;
    }

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
        const editOperation = { range, text: "\n" + copiedCode };

        model.pushEditOperations([], [editOperation], () => null);
        monacoEditorRef.current?.setPosition({
          lineNumber: position.lineNumber + 1,
          column: 1,
        });
        const content = model.getValue();
        handleEditorChange(content, {
          matchIds: [focusedNode.parentUid as TNodeUid],
        });
      })
      .catch((error) => {
        console.error("Error reading from clipboard:", error);
      });
  }, [validNodeTree, focusedItem]);

  const onDelete = useCallback(() => {
    if (selectedItems.length === 0) return;
    cb_removeNode(selectedItems);
  }, [cb_removeNode, selectedItems]);

  const onDuplicate = useCallback(() => {
    if (selectedItems.length === 0) return;
    cb_duplicateNode(selectedItems);
  }, [cb_duplicateNode, selectedItems, validNodeTree]);

  const onTurnInto = useCallback(() => {}, []);

  const onGroup = useCallback(() => {}, []);

  const onUngroup = useCallback(() => {}, []);

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
    onCut,
    onCopy,
    onPaste,
    onDelete,
    onDuplicate,
    onTurnInto,
    onGroup,
    onUngroup,
    onAddNode,
  };
};
