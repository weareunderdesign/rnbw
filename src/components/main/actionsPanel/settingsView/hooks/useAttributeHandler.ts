import { useCallback, useContext } from "react";

import { NodeActions } from "@_node/node";
import { MainContext } from "@_redux/main";
import { useAppState } from "@_redux/useAppState";
import { LogAllow } from "@_constants/global";
import { useDispatch } from "react-redux";
import { setIsContentProgrammaticallyChanged } from "@_redux/main/reference";
import { TNodeUid } from "@_node/index";

export const useAttributeHandler = () => {
  const { validNodeTree, selectedNodeUids } = useAppState();
  const { monacoEditorRef } = useContext(MainContext);
  const dispatch = useDispatch();

  const changeAttribute = useCallback(
    ({
      uid,
      attrName,
      attrValue,
      cb,
    }: {
      uid: TNodeUid;
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
        focusedItem: uid,
        selectedItems: selectedNodeUids,
        codeViewInstanceModel,
        cb,
        fb: () => dispatch(setIsContentProgrammaticallyChanged(false)),
      });
    },
    [validNodeTree, monacoEditorRef, selectedNodeUids],
  );

  const deleteAttribute = useCallback(
    ({
      uid,
      attrName,
      attrValue,
      cb,
    }: {
      uid: TNodeUid;
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
        selectedItems: selectedNodeUids,
        focusedItem: uid,
        codeViewInstanceModel,
        cb,
        fb: () => dispatch(setIsContentProgrammaticallyChanged(false)),
      });
    },
    [validNodeTree, monacoEditorRef, selectedNodeUids],
  );
  return { changeAttribute, deleteAttribute };
};
