import { useEffect } from "react";

import { useAppState } from "@_redux/useAppState";

export const useFileTreeEvent = () => {
  const { fileAction, fileEventFutureLength } = useAppState();

  // file event hms
  useEffect(() => {
    // reset fileAction in the new history
    /* fileEventFutureLength === 0 &&
      fileAction.type !== null &&
      dispatch(setFileAction({ type: null })); */
  }, [fileEventFutureLength]);

  useEffect(() => {
    console.log({ fileAction });
  }, [fileAction]);

  // isHms === true ? undo : redo
  /* if (didUndo) {
      const { type, param1, param2 } = fileAction;
      if (type === "create") {
        _delete([param1]);
      } else if (type === "rename") {
        const { parentUid } = param1;
        const { orgName, newName } = param2;
        const currentUid = `${parentUid}/${newName}`;
        (async () => {
          addTemporaryNodes(currentUid);
          await _rename(currentUid, orgName);
          removeTemporaryNodes(currentUid);
        })();
      } else if (type === "cut") {
        const _uids: { uid: TNodeUid; parentUid: TNodeUid; name: string }[] =
          param1;
        const _targetUids: TNodeUid[] = param2;

        const uids: TNodeUid[] = [];
        const targetUids: TNodeUid[] = [];

        _targetUids.map((targetUid, index) => {
          const { uid, parentUid, name } = _uids[index];
          uids.push(`${targetUid}/${name}`);
          targetUids.push(parentUid);
        });
        _cut(uids, targetUids);
      } else if (type === "copy") {
        const _uids: { uid: TNodeUid; name: string }[] = param1;
        const _targetUids: TNodeUid[] = param2;

        const uids: TNodeUid[] = [];
        _targetUids.map((targetUid, index) => {
          const { name } = _uids[index];
          uids.push(`${targetUid}/${name}`);
        });
        _delete(uids);
      } else if (type === "remove") {
      }
    } else {
      const { type, param1, param2 } = lastFileAction;
      if (type === "create") {
        _create(param2);
      } else if (type === "rename") {
        const { uid } = param1;
        const { newName } = param2;
        (async () => {
          addTemporaryNodes(uid);
          await _rename(uid, newName);
          removeTemporaryNodes(uid);
        })();
      } else if (type === "cut") {
        const _uids: { uid: TNodeUid; name: string }[] = param1;
        const targetUids: TNodeUid[] = param2;

        const uids: TNodeUid[] = _uids.map((_uid) => _uid.uid);
        _cut(uids, targetUids);
      } else if (type === "copy") {
        const _uids: { uid: TNodeUid; name: string }[] = param1;
        const targetUids: TNodeUid[] = param2;

        const uids: TNodeUid[] = [];
        const names: string[] = [];
        _uids.map((_uid) => {
          uids.push(_uid.uid);
          names.push(_uid.name);
        });
        _copy(uids, names, targetUids);
      } else if (type === "remove") {
      }
    } */
};
