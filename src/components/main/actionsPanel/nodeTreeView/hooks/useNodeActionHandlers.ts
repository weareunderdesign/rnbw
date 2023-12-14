import { useCallback, useContext } from "react";

import { useDispatch } from "react-redux";

import { LogAllow } from "@_constants/global";
import { TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import { useAppState } from "@_redux/useAppState";
import { doNodeActions } from "@_node/node";
import { callNodeApi } from "@_node/apis";

export const useNodeActionHandlers = () => {
  const dispatch = useDispatch();
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
          dispatch,
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
        dispatch,
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

    console.log(callNodeApi);

    setIsContentProgrammaticallyChanged(true);
    callNodeApi(
      {
        dispatch,
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
        dispatch,
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
        dispatch,
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
        dispatch,
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
      selectedUids,
      targetUid,
      isBetween = false,
      position = 0,
    }: {
      selectedUids: TNodeUid[];
      targetUid: TNodeUid;
      isBetween: boolean;
      position: number;
    }) => {
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
          dispatch,
          action: "move",
          nodeTree,
          selectedUids,
          targetUid,
          isBetween,
          position,
          codeViewInstanceModel,
        },
        () => setIsContentProgrammaticallyChanged(false),
      );
    },
    [nodeTree],
  );
  const onTurnInto = useCallback(
    (actionName: string) => {
      const focusedNode = nodeTree[focusedItem];
      if (!focusedNode) return;

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
          dispatch,
          action: "rename",
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
        dispatch,
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
        dispatch,
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
