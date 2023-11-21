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
import { useDispatch } from "react-redux";
import { setCurrentFileContent } from "@_redux/main/nodeTree";

export const useNodeActionsHandlers = () => {
  const dispatch = useDispatch();
  const {
    nodeTree,
    validNodeTree,
    nFocusedItem: focusedItem,
    nSelectedItems: selectedItems,
  } = useAppState();
  const { monacoEditorRef, htmlReferenceData } = useContext(MainContext);
  const nodeActionParams = {
    tree: nodeTree,
    fileExt: "html",
    selectedUids: selectedItems,
  };

  function handleEditorUpdate({ updatedHtml }: { updatedHtml?: string }) {
    const model = monacoEditorRef.current?.getModel();
    if (!updatedHtml || !model) return;
    const content = html_beautify(updatedHtml);
    model.setValue(content);
    dispatch(setCurrentFileContent(updatedHtml));
  }

  const {
    cb_addNode,
    cb_removeNode,
    cb_duplicateNode,
    cb_copyNode,
    cb_groupNode,
    cb_ungroupNode,
  } = useNodeActions();

  const onCopy = useCallback(() => {
    if (selectedItems.length === 0) return;
    const codeViewInstance = monacoEditorRef.current;
    if (!codeViewInstance) {
      LogAllow && console.error("Monaco Editor  is undefined");
      return;
    }

    callNodeApi(
      {
        isFileTree: false,
        action: "copy",
        selectedUids: selectedItems,
        fileExt: "html",
      },
      handleEditorUpdate,
    );
  }, [selectedItems]);

  const onCut = useCallback(() => {
    if (selectedItems.length === 0) return;
    onCopy();
    onDelete();
  }, [selectedItems, cb_copyNode, cb_removeNode]);

  const onPaste = useCallback(() => {
    const codeViewInstance = monacoEditorRef.current;
    if (!codeViewInstance) {
      LogAllow && console.error("Monaco Editor  is undefined");
      return;
    }
    callNodeApi(
      {
        isFileTree: false,
        action: "paste",
        selectedUids: selectedItems,
        fileExt: "html",
        targetUid: focusedItem,
        codeViewInstance,
        tree: nodeTree,
      },
      handleEditorUpdate,
    );
  }, [validNodeTree, focusedItem]);

  const onDelete = useCallback(() => {
    if (selectedItems.length === 0) return;

    if (!monacoEditorRef.current) {
      LogAllow && console.error("Monaco Editor  is undefined");
      return;
    }

    callNodeApi(
      {
        ...nodeActionParams,
        isFileTree: false,
        action: "remove",
        codeViewInstance: monacoEditorRef.current,
      },
      handleEditorUpdate,
    );
  }, [selectedItems]);

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
      const codeViewInstance = monacoEditorRef.current;
      if (!codeViewInstance) {
        LogAllow && console.error("Monaco Editor  is undefined");
        return;
      }
      callNodeApi(
        {
          ...nodeActionParams,
          isFileTree: false,
          action: "create",
          codeViewInstance,
          htmlReferenceData,
          nodeTreeFocusedItem: focusedItem,
          actionName,
        },
        handleEditorUpdate,
      );
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
