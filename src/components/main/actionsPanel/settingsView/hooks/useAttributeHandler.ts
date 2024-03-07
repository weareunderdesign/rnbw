import { useCallback, useContext } from "react";

import { NodeActions } from "@_node/node";
import { MainContext } from "@_redux/main";
import { useAppState } from "@_redux/useAppState";
import { LogAllow } from "@_constants/global";
import { useDispatch } from "react-redux";
import { setIsContentProgrammaticallyChanged } from "@_redux/main/reference";

export const useAttributeHandler = () => {
  const { nodeTree, nFocusedItem } = useAppState();
  const { monacoEditorRef } = useContext(MainContext);
  const dispatch = useDispatch();

  const changeAttribute = useCallback(
    (attrName: string, attrValue: string, cb?: any) => {
      const codeViewInstance = monacoEditorRef.current;
      const codeViewInstanceModel = codeViewInstance?.getModel();

      if (!attrName) return;

      if (!codeViewInstance || !codeViewInstanceModel) {
        LogAllow &&
          console.error(
            `Monaco Editor ${!codeViewInstance ? "" : "Model"} is undefined`,
          );
        return;
      }

      dispatch(setIsContentProgrammaticallyChanged(true));

      NodeActions.addAttr({
        attrName,
        attrValue,
        nodeTree,
        focusedItem: nFocusedItem,
        codeViewInstanceModel,
        cb,
        fb: () => dispatch(setIsContentProgrammaticallyChanged(false)),
      });
    },
    [nodeTree, nFocusedItem, monacoEditorRef],
  );

  const deleteAttribute = useCallback(
    (attrName: string, attrValue?: string, cb?: any) => {
      const codeViewInstance = monacoEditorRef.current;
      const codeViewInstanceModel = codeViewInstance?.getModel();

      if (!attrName) return;

      if (!codeViewInstance || !codeViewInstanceModel) {
        LogAllow &&
          console.error(
            `Monaco Editor ${!codeViewInstance ? "" : "Model"} is undefined`,
          );
        return;
      }
      dispatch(setIsContentProgrammaticallyChanged(true));

      NodeActions.removeAttr({
        attrName,
        attrValue,
        nodeTree,
        focusedItem: nFocusedItem,
        codeViewInstanceModel,
        cb,
        fb: () => dispatch(setIsContentProgrammaticallyChanged(false)),
      });
    },
    [nodeTree, nFocusedItem, monacoEditorRef],
  );
  return { changeAttribute, deleteAttribute };
};
