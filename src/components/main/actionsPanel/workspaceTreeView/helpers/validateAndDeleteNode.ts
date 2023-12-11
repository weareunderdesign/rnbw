import {
  TFileHandlerCollection,
  TFileNodeData,
  TFileNodeTreeData,
} from "@_node/file";
import { TNodeUid } from "@_node/types";
import { verifyFileHandlerPermission } from "@_services/main";

export const validateAndDeleteNode = async (
  uid: string,
  ffTree: TFileNodeTreeData,
  fileHandlers: TFileHandlerCollection,
) => {
  const node = ffTree[uid];
  if (node === undefined) {
    return false;
  }
  const nodeData = node.data as TFileNodeData;
  const parentNode = ffTree[node.parentUid as TNodeUid];
  if (parentNode === undefined) {
    return false;
  }

  const parentHandler = fileHandlers[
    parentNode.uid
  ] as FileSystemDirectoryHandle;
  if (!(await verifyFileHandlerPermission(parentHandler))) {
    return false;
  }

  try {
    const entryName =
      nodeData.kind === "directory"
        ? nodeData.name
        : `${nodeData.name}.${nodeData.ext}`;

    await parentHandler.removeEntry(entryName, { recursive: true });

    return true;
  } catch (err) {
    return false;
  }
};
