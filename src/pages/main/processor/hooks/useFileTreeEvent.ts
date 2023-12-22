import { useCallback, useContext, useEffect } from "react";

import { useAppState } from "@_redux/useAppState";
import { useDispatch } from "react-redux";
import {
  FileTree_Event_RedoActionType,
  FileTree_Event_UndoActionType,
  setDoingFileAction,
  setFileAction,
} from "@_redux/main/fileTree";
import { callFileApi } from "@_node/apis";
import { LogAllow } from "@_constants/global";
import { TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import { _path, confirmAlert, getFullnameFromUid } from "@_node/index";
import { FileChangeAlertMessage } from "@_constants/main";

export const useFileTreeEvent = () => {
  const dispatch = useDispatch();
  const { project, fileTree, fileAction, lastFileAction, didUndo, didRedo } =
    useAppState();
  const {
    fileHandlers,
    addInvalidFileNodes,
    removeInvalidFileNodes,
    setReloadCurrentProjectTrigger,
  } = useContext(MainContext);

  useEffect(() => {
    if (didRedo) {
      const { action, payload } = fileAction;
      if (action === "create") {
        // _create({ ...payload });
      } else if (action === "remove") {
        // _remove({ ...payload });
      } else if (action === "rename") {
        _rename({ ...payload });
      }
    }
  }, [fileAction]);
  useEffect(() => {
    if (didUndo) {
      const { action, payload } = lastFileAction;
      if (action === "create") {
        _remove({ ...payload });
      } else if (action === "remove") {
        // not undoable
      } else if (action === "rename") {
        _rename({ orgUid: payload.newUid, newUid: payload.orgUid });
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
      await callFileApi(
        {
          projectContext: project.context,
          action: "remove",
          fileTree,
          fileHandlers,
          uids,
        },
        () => {
          LogAllow && console.error("error while removing file system");
        },
        (allDone: boolean) => {
          LogAllow &&
            console.log(
              allDone ? "all is successfully removed" : "some is not removed",
            );
        },
      );
      removeInvalidFileNodes(...uids);
      dispatch(setDoingFileAction(false));

      // reload the current project
      setReloadCurrentProjectTrigger((prev) => !prev);

      // remove invalid events history for `remove` action
      dispatch(setFileAction({ action: null }));
    },
    [
      didRedo,
      didUndo,
      addInvalidFileNodes,
      removeInvalidFileNodes,
      project,
      fileTree,
      fileHandlers,
      fileAction,
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
      await callFileApi(
        {
          projectContext: project.context,
          action: "rename",
          fileTree,
          fileHandlers,
          uids: [node.uid],
          parentUid: node.parentUid as TNodeUid,
          name: newName,
        },
        () => {
          LogAllow && console.error("error while renaming file system");
        },
        (done: boolean) => {
          LogAllow &&
            console.log(done ? "successfully renamed" : "not renamed");
        },
      );
      removeInvalidFileNodes(node.uid);
      dispatch(setDoingFileAction(false));

      // reload the current project
      setReloadCurrentProjectTrigger((prev) => !prev);
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
};
