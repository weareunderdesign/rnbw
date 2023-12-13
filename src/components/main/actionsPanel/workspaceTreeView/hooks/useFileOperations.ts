import { useCallback, useContext } from "react";

import { TFileNodeData } from "@_node/file";
import { TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import { useAppState } from "@_redux/useAppState";
import { verifyFileHandlerPermission } from "@_services/main";
import { TFileNodeType } from "@_types/main";

import {
  createFileOrFolder,
  deleteFileOrFolder,
  moveActions,
} from "../helpers";

interface IUseFileOperations {
  invalidNodes: {
    [uid: string]: true;
  };
  addInvalidNodes: (...uids: string[]) => void;
  removeInvalidNodes: (...uids: string[]) => void;
  temporaryNodes: {
    [uid: string]: true;
  };
  addTemporaryNodes: (...uids: string[]) => void;
  removeTemporaryNodes: (...uids: string[]) => void;
}
export const useFileOperations = ({
  invalidNodes,
  addInvalidNodes,
  removeInvalidNodes,
  temporaryNodes,
  addTemporaryNodes,
  removeTemporaryNodes,
}: IUseFileOperations) => {
  const { project, fileTree } = useAppState();
  const { addRunningActions, removeRunningActions, fileHandlers } =
    useContext(MainContext);

  const { moveIDBFF, moveLocalFF } = moveActions(() => {});

  const _create = useCallback(
    async (params: {
      parentUid: TNodeUid;
      name: string;
      type: TFileNodeType;
    }) => {
      addRunningActions(["fileTreeView-create"]);

      const { parentUid, name, type } = params;
      try {
        await createFileOrFolder(
          parentUid,
          name,
          type,
          project,
          fileTree,
          fileHandlers,
        );
      } catch (err) {
        throw new Error("err");
      }

      removeRunningActions(["fileTreeView-create"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      project.context,
      fileTree,
      fileHandlers,
    ],
  );
  const _delete = useCallback(
    async (uids: TNodeUid[]) => {
      addRunningActions(["fileTreeView-delete"]);
      addInvalidNodes(...uids);

      await Promise.all(
        uids.map(async (uid) => {
          try {
            await deleteFileOrFolder(
              uid,
              fileTree,
              fileHandlers,
              project.context,
            );
          } catch (err) {
            console.error(err);
          }
        }),
      );

      removeInvalidNodes(...uids);
      removeRunningActions(["fileTreeView-delete"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      project.context,
      addInvalidNodes,
      removeInvalidNodes,
      fileTree,
      fileHandlers,
    ],
  );
  const _rename = useCallback(
    async (uid: TNodeUid, newName: string) => {
      addRunningActions(["fileTreeView-rename"]);

      try {
        // validate
        const node = fileTree[uid];
        if (node === undefined || node.displayName === newName) throw "error";
        const nodeData = node.data as TFileNodeData;
        const parentNode = fileTree[node.parentUid as TNodeUid];
        if (parentNode === undefined) throw "error";
        const parentNodeData = parentNode.data as TFileNodeData;

        const newUid = `${parentNode.uid}/${newName}`;
        addTemporaryNodes(uid);
        addInvalidNodes(newUid);

        if (project.context === "local") {
          const handler = fileHandlers[uid],
            parentHandler = fileHandlers[
              parentNode.uid
            ] as FileSystemDirectoryHandle;
          if (
            !(await verifyFileHandlerPermission(handler)) ||
            !(await verifyFileHandlerPermission(parentHandler))
          )
            throw "error";

          await moveLocalFF(handler, parentHandler, parentHandler, newName);
        } else if (project.context === "idb") {
          await moveIDBFF(nodeData, parentNodeData, newName);
        }

        removeInvalidNodes(newUid);
        removeTemporaryNodes(uid);
      } catch (err) {}
      removeRunningActions(["fileTreeView-rename"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      project.context,
      addTemporaryNodes,
      removeTemporaryNodes,
      addInvalidNodes,
      removeInvalidNodes,
      fileTree,
      fileHandlers,
    ],
  );
  const _cut = useCallback(
    async (uids: TNodeUid[], targetUids: TNodeUid[]) => {
      addRunningActions(["fileTreeView-move"]);

      const _invalidNodes = { ...invalidNodes };

      await Promise.all(
        uids.map(async (uid, index) => {
          const targetUid = targetUids[index];

          // validate
          const node = fileTree[uid];
          if (node === undefined) return;
          const nodeData = node.data as TFileNodeData;
          const parentNode = fileTree[node.parentUid as TNodeUid];
          if (parentNode === undefined) return;
          const targetNode = fileTree[targetUid];
          if (targetNode === undefined) return;
          const targetNodeData = targetNode.data as TFileNodeData;

          const newUid = `${targetUid}/${nodeData.name}`;
          _invalidNodes[uid] = true;
          _invalidNodes[newUid] = true;
          addInvalidNodes(...Object.keys(_invalidNodes));

          if (project.context === "local") {
            const handler = fileHandlers[uid],
              parentHandler = fileHandlers[
                parentNode.uid
              ] as FileSystemDirectoryHandle,
              targetHandler = fileHandlers[
                targetUid
              ] as FileSystemDirectoryHandle;
            if (
              !(await verifyFileHandlerPermission(handler)) ||
              !(await verifyFileHandlerPermission(parentHandler)) ||
              !(await verifyFileHandlerPermission(targetHandler))
            )
              return;

            try {
              await moveLocalFF(
                handler,
                parentHandler,
                targetHandler,
                nodeData.name,
              );
            } catch (err) {}
          } else if (project.context === "idb") {
            await moveIDBFF(nodeData, targetNodeData, nodeData.name);
          }

          delete _invalidNodes[uid];
          delete _invalidNodes[newUid];
          addInvalidNodes(...Object.keys(_invalidNodes));
        }),
      );
      removeRunningActions(["fileTreeView-move"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      project.context,
      invalidNodes,
      addInvalidNodes,
      fileTree,
      fileHandlers,
    ],
  );
  const _copy = useCallback(
    async (uids: TNodeUid[], names: string[], targetUids: TNodeUid[]) => {
      addRunningActions(["fileTreeView-duplicate"]);

      const _invalidNodes = { ...invalidNodes };

      await Promise.all(
        uids.map(async (uid, index) => {
          const name = names[index];
          const targetUid = targetUids[index];

          // validate
          const node = fileTree[uid];
          if (node === undefined) return;
          const nodeData = node.data as TFileNodeData;
          const parentNode = fileTree[node.parentUid as TNodeUid];
          if (parentNode === undefined) return;
          const targetNode = fileTree[targetUid];
          if (targetNode === undefined) return;
          const targetNodeData = targetNode.data as TFileNodeData;

          const newUid = `${targetUid}/${name}`;
          _invalidNodes[uid] = true;
          _invalidNodes[newUid] = true;
          addInvalidNodes(...Object.keys(_invalidNodes));

          if (project.context === "local") {
            const handler = fileHandlers[uid],
              parentHandler = fileHandlers[
                parentNode.uid
              ] as FileSystemDirectoryHandle,
              targetHandler = fileHandlers[
                targetUid
              ] as FileSystemDirectoryHandle;
            if (
              !(await verifyFileHandlerPermission(handler)) ||
              !(await verifyFileHandlerPermission(parentHandler)) ||
              !(await verifyFileHandlerPermission(targetHandler))
            )
              return;

            try {
              await moveLocalFF(
                handler,
                parentHandler,
                targetHandler,
                name,
                true,
              );
            } catch (err) {
              console.log(err);
            }
          } else if (project.context === "idb") {
            await moveIDBFF(nodeData, targetNodeData, nodeData.name, true);
          }

          delete _invalidNodes[uid];
          delete _invalidNodes[newUid];
          addInvalidNodes(...Object.keys(_invalidNodes));
        }),
      );
      removeRunningActions(["fileTreeView-duplicate"]);
    },
    [
      addRunningActions,
      removeRunningActions,
      project.context,
      invalidNodes,
      addInvalidNodes,
      fileTree,
      fileHandlers,
    ],
  );

  return {
    _copy,
    _create,
    _cut,
    _delete,
    _rename,
  };
};
