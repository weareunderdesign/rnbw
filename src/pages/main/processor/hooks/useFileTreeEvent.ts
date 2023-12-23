import { useCallback, useContext, useEffect, useRef } from "react";

import { useDispatch } from "react-redux";

import { LogAllow } from "@_constants/global";
import { FileChangeAlertMessage } from "@_constants/main";
import { FileActions } from "@_node/apis";
import { _path, confirmAlert, getFullnameFromUid } from "@_node/index";
import { TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import {
  FileTree_Event_RedoActionType,
  FileTree_Event_UndoActionType,
  setDoingFileAction,
  setFileAction,
  TFileAction,
} from "@_redux/main/fileTree";
import { useAppState } from "@_redux/useAppState";

export const useFileTreeEvent = () => {
  const dispatch = useDispatch();
  const {
    project,
    fileTree,
    fileAction,
    lastFileAction,
    fileEventPastLength,
    didUndo,
    didRedo,
    clipboardData,
  } = useAppState();
  const {
    fileHandlers,
    addInvalidFileNodes,
    removeInvalidFileNodes,
    triggerCurrentProjectReload,
  } = useContext(MainContext);

  const clearFutureHistoryTriggerRef = useRef(false);
  const lastFileActionRef = useRef<TFileAction>({ action: null });
  useEffect(() => {
    if (clearFutureHistoryTriggerRef.current) {
      // remove invalid history events after `remove` action
      clearFutureHistoryTriggerRef.current = false;
      dispatch(setFileAction({ ...lastFileActionRef.current }));
    }

    if (didRedo) {
      const { action, payload } = fileAction;
      if (action === "create") {
        // _create({ ...payload });
      } else if (action === "remove") {
        // _remove({ ...payload });
      } else if (action === "rename") {
        _rename({ ...payload });
      } else if (action === "move") {
        _move({ ...payload });
      }
    }
  }, [fileAction]);
  useEffect(() => {
    if (didUndo) {
      const { action, payload } = lastFileAction;
      if (action === "create") {
        _remove({ ...payload });
        // clear future history events
        if (fileEventPastLength) {
          lastFileActionRef.current = { ...fileAction };
          clearFutureHistoryTriggerRef.current = true;
          dispatch({ type: FileTree_Event_UndoActionType });
        } else {
          dispatch(setFileAction({ ...fileAction }));
        }
      } else if (action === "remove") {
        // not undoable
      } else if (action === "rename") {
        _rename({ orgUid: payload.newUid, newUid: payload.orgUid });
      } else if (action === "move") {
        const uids = payload.uids.map(({ orgUid, newUid }) => ({
          orgUid: newUid,
          newUid: orgUid,
        }));
        _move({ uids });
      }
    }
  }, [lastFileAction]);

  const _remove = useCallback(
    async ({ uids }: { uids: TNodeUid[] }) => {
      const message = `Are you sure you want to delete them? This action cannot be undone!`;
      if (!window.confirm(message)) {
        didRedo && dispatch({ type: FileTree_Event_UndoActionType });
        didUndo && dispatch({ type: FileTree_Event_RedoActionType });
        return;
      }

      dispatch(setDoingFileAction(true));
      addInvalidFileNodes(...uids);
      await FileActions.remove({
        projectContext: project.context,
        fileTree,
        fileHandlers,
        uids,
        fb: () => {
          LogAllow && console.error("error while removing file system");
        },
        cb: (allDone: boolean) => {
          LogAllow &&
            console.log(
              allDone ? "all is successfully removed" : "some is not removed",
            );
        },
      });
      removeInvalidFileNodes(...uids);
      dispatch(setDoingFileAction(false));

      // reload the current project
      triggerCurrentProjectReload();
    },
    [
      didRedo,
      didUndo,
      addInvalidFileNodes,
      removeInvalidFileNodes,
      project,
      fileTree,
      fileHandlers,
    ],
  );
  const _rename = useCallback(
    async ({ orgUid, newUid }: { orgUid: TNodeUid; newUid: TNodeUid }) => {
      const node = fileTree[orgUid];
      if (!node) return;
      const nodeData = node.data;
      if (nodeData.changed && !confirmAlert(FileChangeAlertMessage)) {
        didRedo && dispatch({ type: FileTree_Event_UndoActionType });
        didUndo && dispatch({ type: FileTree_Event_RedoActionType });
        return;
      }

      const newName = getFullnameFromUid(newUid);
      dispatch(setDoingFileAction(true));
      addInvalidFileNodes(node.uid);
      await FileActions.rename({
        projectContext: project.context,
        fileTree,
        fileHandlers,
        uids: [node.uid],
        parentUid: node.parentUid as TNodeUid,
        newName,
        fb: () => {
          LogAllow && console.error("error while renaming file system");
        },
        cb: (done: boolean) => {
          LogAllow &&
            console.log(done ? "successfully renamed" : "not renamed");
        },
      });
      removeInvalidFileNodes(node.uid);
      dispatch(setDoingFileAction(false));

      // reload the current project
      triggerCurrentProjectReload();
    },
    [
      didRedo,
      didUndo,
      addInvalidFileNodes,
      removeInvalidFileNodes,
      project,
      fileTree,
      fileHandlers,
    ],
  );
  const _move = useCallback(
    async ({ uids }: { uids: { orgUid: TNodeUid; newUid: TNodeUid }[] }) => {
      const orgUids = uids.map(({ orgUid }) => orgUid);
      const newName = uids.map(({ newUid }) => getFullnameFromUid(newUid));
      const targetUid = "";

      dispatch(setDoingFileAction(true));
      // addInvalidFileNodes(node.uid);
      await FileActions.move({
        projectContext: project.context,
        fileTree,
        fileHandlers,
        uids: orgUids,
        newName,
        isCopy: false,
        // targetUid: uids.map(({ newUid }) => fileTree[newUid]),

        fb: () => {
          LogAllow && console.error("error while pasting file system");
        },
        cb: (allDone: boolean) => {
          LogAllow &&
            console.log(
              allDone ? "all is successfully pasted" : "some is not pasted",
            );
        },
      });

      // removeInvalidFileNodes(...uids);
      dispatch(setDoingFileAction(false));

      // reload the current project
      triggerCurrentProjectReload();
    },
    [
      didRedo,
      didUndo,
      addInvalidFileNodes,
      removeInvalidFileNodes,
      project,
      fileTree,
      fileHandlers,
      clipboardData,
    ],
  );
};
