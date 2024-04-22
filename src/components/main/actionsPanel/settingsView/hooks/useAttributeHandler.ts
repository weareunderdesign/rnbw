import { useCallback, useContext } from "react";

import { NodeActions } from "@_node/node";
import { MainContext } from "@_redux/main";
import { useAppState } from "@_redux/useAppState";
import { LogAllow } from "@_constants/global";
import { useDispatch } from "react-redux";
import { setIsContentProgrammaticallyChanged } from "@_redux/main/reference";

export const useAttributeHandler = () => {
  const { validNodeTree, nFocusedItem, formatCode } = useAppState();
  const { monacoEditorRef } = useContext(MainContext);
  const dispatch = useDispatch();

  const changeAttribute = useCallback(
    ({
      attrName,
      attrValue,
      cb,
    }: {
      attrName: string;
      attrValue: string;
      cb?: () => void;
    }) => {
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
        dispatch,
        attrName,
        attrValue,
        validNodeTree,
        focusedItem: nFocusedItem,
        codeViewInstanceModel,
        formatCode,
        cb,
        fb: () => dispatch(setIsContentProgrammaticallyChanged(false)),
      });
    },
    [validNodeTree, monacoEditorRef, nFocusedItem, formatCode],
  );

  const deleteAttribute = useCallback(
    ({
      attrName,
      attrValue,
      cb,
    }: {
      attrName: string;
      attrValue?: string;
      cb?: () => void;
    }) => {
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
        dispatch,
        attrName,
        attrValue,
        validNodeTree,
        focusedItem: nFocusedItem,
        codeViewInstanceModel,
        formatCode,
        cb,
        fb: () => dispatch(setIsContentProgrammaticallyChanged(false)),
      });
    },
    [validNodeTree, monacoEditorRef, nFocusedItem, formatCode],
  );
  return { changeAttribute, deleteAttribute };
};
