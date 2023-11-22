import { useCallback, useContext } from "react";
import { MainContext } from "@_redux/main";

import { useAppState } from "@_redux/useAppState";
import { LogAllow } from "@_constants/global";
import { callNodeApi } from "@_node/apis";

import { getValidNodeUids } from "@_node/helpers";

export const useNodeActionsHandlers = () => {
  const {
    nodeTree,
    validNodeTree,
    nFocusedItem: focusedItem,
    nSelectedItems: selectedItems,
  } = useAppState();
  const { htmlReferenceData, monacoEditorRef, setProgrammaticContentChange } =
    useContext(MainContext);

  const onAddNode = useCallback(
    (actionName: string) => {
      const focusedNode = nodeTree[focusedItem];
      if (!focusedNode || !focusedNode.data.sourceCodeLocation) {
        LogAllow &&
          console.error("Focused node or source code location is undefined");
        return;
      }

      const codeViewInstance = monacoEditorRef.current;
      const codeViewInstanceModel = codeViewInstance?.getModel();
      if (!codeViewInstance || !codeViewInstanceModel) {
        LogAllow &&
          console.error(
            `Monaco Editor ${!codeViewInstance ? "" : "Model"} is undefined`,
          );
        return;
      }

      setProgrammaticContentChange({});
      callNodeApi(
        {
          action: "add",
          actionName,
          referenceData: htmlReferenceData,
          nodeTree,
          targetUid: focusedItem,
          codeViewInstance,
          codeViewInstanceModel,
        },
        () => setProgrammaticContentChange(null),
      );
    },
    [nodeTree, focusedItem],
  );

  const onCut = useCallback(() => {
    if (selectedItems.length === 0) return;

    const codeViewInstance = monacoEditorRef.current;
    const codeViewInstanceModel = codeViewInstance?.getModel();
    if (!codeViewInstance || !codeViewInstanceModel) {
      LogAllow &&
        console.error(
          `Monaco Editor ${!codeViewInstance ? "" : "Model"} is undefined`,
        );
      return;
    }

    setProgrammaticContentChange({});
    callNodeApi(
      {
        action: "cut",
        nodeTree,
        selectedUids: selectedItems,
        codeViewInstance,
        codeViewInstanceModel,
      },
      () => setProgrammaticContentChange(null),
    );
  }, [selectedItems, nodeTree]);

  const onCopy = useCallback(() => {
    if (selectedItems.length === 0) return;

    const codeViewInstance = monacoEditorRef.current;
    const codeViewInstanceModel = codeViewInstance?.getModel();
    if (!codeViewInstance || !codeViewInstanceModel) {
      LogAllow &&
        console.error(
          `Monaco Editor ${!codeViewInstance ? "" : "Model"} is undefined`,
        );
      return;
    }

    setProgrammaticContentChange({});
    callNodeApi(
      {
        action: "copy",
        nodeTree,
        selectedUids: selectedItems,
        codeViewInstance,
        codeViewInstanceModel,
      },
      () => setProgrammaticContentChange(null),
    );
  }, [selectedItems, nodeTree]);

  const onPaste = useCallback(() => {
    const focusedNode = validNodeTree[focusedItem];
    if (!focusedNode || !focusedNode.data.sourceCodeLocation) {
      LogAllow &&
        console.error("Focused node or source code location is undefined");
      return;
    }

    const codeViewInstance = monacoEditorRef.current;
    const codeViewInstanceModel = codeViewInstance?.getModel();
    if (!codeViewInstance || !codeViewInstanceModel) {
      LogAllow &&
        console.error(
          `Monaco Editor ${!codeViewInstance ? "" : "Model"} is undefined`,
        );
      return;
    }

    setProgrammaticContentChange({});
    callNodeApi(
      {
        action: "paste",
        validNodeTree,
        targetUid: focusedItem,
        codeViewInstance,
        codeViewInstanceModel,
      },
      () => setProgrammaticContentChange(null),
    );
  }, [validNodeTree, focusedItem]);

  const onDelete = useCallback(() => {
    if (selectedItems.length === 0) return;

    const codeViewInstance = monacoEditorRef.current;
    const codeViewInstanceModel = codeViewInstance?.getModel();
    if (!codeViewInstance || !codeViewInstanceModel) {
      LogAllow &&
        console.error(
          `Monaco Editor ${!codeViewInstance ? "" : "Model"} is undefined`,
        );
      return;
    }

    setProgrammaticContentChange({});
    callNodeApi(
      {
        action: "remove",
        nodeTree,
        selectedUids: selectedItems,
        codeViewInstance,
        codeViewInstanceModel,
      },
      () => setProgrammaticContentChange(null),
    );
  }, [selectedItems, nodeTree]);

  const onDuplicate = useCallback(() => {
    if (selectedItems.length === 0) return;

    const codeViewInstance = monacoEditorRef.current;
    const codeViewInstanceModel = codeViewInstance?.getModel();
    if (!codeViewInstance || !codeViewInstanceModel) {
      LogAllow &&
        console.error(
          `Monaco Editor ${!codeViewInstance ? "" : "Model"} is undefined`,
        );
      return;
    }

    setProgrammaticContentChange({});
    callNodeApi(
      {
        action: "duplicate",
        nodeTree,
        selectedUids: selectedItems,
        codeViewInstance,
        codeViewInstanceModel,
      },
      () => setProgrammaticContentChange(null),
    );
  }, [selectedItems, nodeTree]);

  const onMove = useCallback(() => {
    const uids = getValidNodeUids(
      nodeTree,
      selectedItems,
      focusedItem,
      "html",
      htmlReferenceData,
    );
    if (uids.length === 0) return;

    const codeViewInstance = monacoEditorRef.current;
    const codeViewInstanceModel = codeViewInstance?.getModel();
    if (!codeViewInstance || !codeViewInstanceModel) {
      LogAllow &&
        console.error(
          `Monaco Editor ${!codeViewInstance ? "" : "Model"} is undefined`,
        );
      return;
    }

    setProgrammaticContentChange({});
    callNodeApi(
      {
        action: "move",
        nodeTree,
        selectedUids: selectedItems,
        targetUid: focusedItem,
        isBetween: false,
        position: 0,
        codeViewInstance,
        codeViewInstanceModel,
      },
      () => setProgrammaticContentChange(null),
    );
  }, [nodeTree, selectedItems, focusedItem]);

  const onTurnInto = useCallback(() => {}, []);

  const onGroup = useCallback(() => {
    if (selectedItems.length === 0) return;

    const codeViewInstance = monacoEditorRef.current;
    const codeViewInstanceModel = codeViewInstance?.getModel();
    if (!codeViewInstance || !codeViewInstanceModel) {
      LogAllow &&
        console.error(
          `Monaco Editor ${!codeViewInstance ? "" : "Model"} is undefined`,
        );
      return;
    }

    setProgrammaticContentChange({});
    callNodeApi(
      {
        action: "group",
        validNodeTree,
        selectedUids: selectedItems,
        codeViewInstance,
        codeViewInstanceModel,
      },
      () => setProgrammaticContentChange(null),
    );
  }, [selectedItems, validNodeTree]);
  const onUngroup = useCallback(() => {
    if (selectedItems.length === 0) return;

    const codeViewInstance = monacoEditorRef.current;
    const codeViewInstanceModel = codeViewInstance?.getModel();
    if (!codeViewInstance || !codeViewInstanceModel) {
      LogAllow &&
        console.error(
          `Monaco Editor ${!codeViewInstance ? "" : "Model"} is undefined`,
        );
      return;
    }

    setProgrammaticContentChange({});
    callNodeApi(
      {
        action: "ungroup",
        validNodeTree,
        selectedUids: selectedItems,
        codeViewInstance,
        codeViewInstanceModel,
      },
      () => setProgrammaticContentChange(null),
    );
  }, [selectedItems, validNodeTree]);

  return {
    onAddNode,
    onCut,
    onCopy,
    onPaste,
    onDelete,
    onDuplicate,
    onMove,
    onTurnInto,
    onGroup,
    onUngroup,
  };
};
