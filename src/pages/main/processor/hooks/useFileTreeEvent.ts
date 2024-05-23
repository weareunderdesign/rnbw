import { useCallback, useEffect, useRef } from "react";

import { useDispatch } from "react-redux";

import { FileChangeAlertMessage } from "@_constants/main";
import {
  confirmAlert,
  getFullnameFromUid,
  getParentUidFromUid,
} from "@_node/index";
import { TNodeUid } from "@_node/types";
import {
  addInvalidFileNodes,
  FileTree_Event_RedoActionType,
  FileTree_Event_UndoActionType,
  removeInvalidFileNodes,
  setDoingFileAction,
  setFileAction,
  TFileAction,
} from "@_redux/main/fileTree";
import { useAppState } from "@_redux/useAppState";
import useRnbw from "@_services/useRnbw";

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
    fileHandlers,
  } = useAppState();
  const rnbw = useRnbw();
  // const { reloadCurrentProject } = useHandlers();

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
        _remove({ ...payload });
      } else if (action === "rename") {
        _rename({ ...payload });
      } else if (action === "move") {
        if (payload.isCopy) {
          // not redoable
        } else {
          _move({ ...payload });
        }
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
        if (payload.isCopy) {
          const uids = payload.uids.map(({ newUid }) => newUid);
          _remove({ uids });

          // clear future history events
          if (fileEventPastLength) {
            lastFileActionRef.current = { ...fileAction };
            clearFutureHistoryTriggerRef.current = true;
            dispatch({ type: FileTree_Event_UndoActionType });
          } else {
            dispatch(setFileAction({ ...fileAction }));
          }
        } else {
          const uids = payload.uids.map(({ orgUid, newUid }) => ({
            orgUid: newUid,
            newUid: orgUid,
          }));
          _move({ uids, isCopy: payload.isCopy });
        }
      }
    }
  }, [lastFileAction]);

  const _remove = useCallback(
    async ({ uids }: { uids: TNodeUid[] }) => {
      dispatch(setDoingFileAction(true));
      dispatch(addInvalidFileNodes([...uids]));

      rnbw.files.remove({ uids });

      dispatch(removeInvalidFileNodes([...uids]));
      dispatch(setDoingFileAction(false));
    },
    [didRedo, didUndo, project, fileTree, fileHandlers],
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
      dispatch(addInvalidFileNodes([node.uid]));
      await rnbw.files.rename({
        uid: node.uid,
        newName,
        extension: nodeData.ext,
      });

      dispatch(removeInvalidFileNodes([node.uid]));
      dispatch(setDoingFileAction(false));
    },
    [didRedo, didUndo, project, fileTree, fileHandlers],
  );

  const _move = useCallback(
    async ({
      uids,
    }: {
      uids: { orgUid: TNodeUid; newUid: TNodeUid }[];
      isCopy: boolean;
    }) => {
      const orgUids = uids.map(({ orgUid }) => orgUid);

      const targetUids = uids.map(({ newUid }) => getParentUidFromUid(newUid));

      dispatch(setDoingFileAction(true));
      dispatch(addInvalidFileNodes([...orgUids]));

      await rnbw.files.move({ uids: orgUids, targetUid: targetUids[0] });

      dispatch(removeInvalidFileNodes([...orgUids]));
      dispatch(setDoingFileAction(false));
    },
    [project, fileTree, fileHandlers],
  );
};
