import { useCallback, useContext } from "react";
import { MainContext } from "@_redux/main";

import { useAppState } from "@_redux/useAppState";
import { LogAllow } from "@_constants/global";
import { callNodeApi } from "@_node/apis";

import { getValidNodeUids } from "@_node/helpers";
import { TNodeUid } from "@_node/types";

export const useNodeActionsHandlers = () => {
  const {
    nodeTree,
    validNodeTree,
    nFocusedItem: focusedItem,
    nSelectedItems: selectedItems,
  } = useAppState();
  const {
    htmlReferenceData,
    monacoEditorRef,
    setIsContentProgrammaticallyChanged,
  } = useContext(MainContext);

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

      setIsContentProgrammaticallyChanged(true);
      callNodeApi(
        {
          action: "add",
          actionName,
          referenceData: htmlReferenceData,
          nodeTree,
          targetUid: focusedItem,
          codeViewInstanceModel,
        },
        () => setIsContentProgrammaticallyChanged(false),
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

    setIsContentProgrammaticallyChanged(true);
    callNodeApi(
      {
        action: "cut",
        nodeTree,
        selectedUids: selectedItems,
        codeViewInstanceModel,
      },
      () => setIsContentProgrammaticallyChanged(false),
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

    setIsContentProgrammaticallyChanged(true);
    callNodeApi(
      {
        action: "copy",
        nodeTree,
        selectedUids: selectedItems,
        codeViewInstanceModel,
      },
      () => setIsContentProgrammaticallyChanged(false),
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

    setIsContentProgrammaticallyChanged(true);
    callNodeApi(
      {
        action: "paste",
        nodeTree: validNodeTree,
        targetUid: focusedItem,
        codeViewInstanceModel,
      },
      () => setIsContentProgrammaticallyChanged(false),
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

    setIsContentProgrammaticallyChanged(true);
    callNodeApi(
      {
        action: "remove",
        nodeTree,
        selectedUids: selectedItems,
        codeViewInstanceModel,
      },
      () => setIsContentProgrammaticallyChanged(false),
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

    setIsContentProgrammaticallyChanged(true);
    callNodeApi(
      {
        action: "duplicate",
        nodeTree,
        selectedUids: selectedItems,
        codeViewInstanceModel,
      },
      () => setIsContentProgrammaticallyChanged(false),
    );
  }, [selectedItems, nodeTree]);

  const onMove = useCallback(
    ({
      targetUid,
      isBetween = false,
      position = 0,
    }: {
      targetUid: TNodeUid;
      isBetween: boolean;
      position: number;
    }) => {
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

      setIsContentProgrammaticallyChanged(true);
      callNodeApi(
        {
          action: "move",
          nodeTree,
          selectedUids: selectedItems,
          targetUid,
          isBetween,
          position,
          codeViewInstanceModel,
        },
        () => setIsContentProgrammaticallyChanged(false),
      );
    },
    [nodeTree, selectedItems, focusedItem],
  );

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

    setIsContentProgrammaticallyChanged(true);
    callNodeApi(
      {
        action: "group",
        nodeTree: validNodeTree,
        selectedUids: selectedItems,
        codeViewInstanceModel,
      },
      () => setIsContentProgrammaticallyChanged(false),
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

    setIsContentProgrammaticallyChanged(true);
    callNodeApi(
      {
        action: "ungroup",
        nodeTree: validNodeTree,
        selectedUids: selectedItems,
        codeViewInstanceModel,
      },
      () => setIsContentProgrammaticallyChanged(false),
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
