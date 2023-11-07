import {
  removeFileSystem,
  TFileHandlerCollection,
  TFileNodeData,
} from "@_node/file";
import { TNodeUid } from "@_node/types";
import { verifyFileHandlerPermission } from "@_services/main";

export const deleteFileOrFolder = async (
  uid: TNodeUid,
  ffTree: Record<string, any>,
  fileHandlers: TFileHandlerCollection,
  projectContext: string,
) => {
  try {
    // validate
    const node = ffTree[uid];
    if (node === undefined) throw new Error("Node not found");
    const nodeData = node.data as TFileNodeData;
    const parentNode = ffTree[node.parentUid as TNodeUid];
    if (parentNode === undefined) throw new Error("Parent node not found");
    const parentNodeData = parentNode.data as TFileNodeData;

    if (projectContext === "local") {
      const parentHandler = fileHandlers[
        parentNode.uid
      ] as FileSystemDirectoryHandle;
      if (!(await verifyFileHandlerPermission(parentHandler))) {
        throw new Error("Permission denied");
      }

      // delete
      try {
        const entryName =
          nodeData.kind === "directory"
            ? nodeData.name
            : `${nodeData.name}${nodeData.ext}`;
        await parentHandler.removeEntry(entryName, { recursive: true });
      } catch (err) {
        console.error(err);
      }
    } else if (projectContext === "idb") {
      // delete
      try {
        const entryName =
          nodeData.kind === "directory"
            ? nodeData.name
            : `${nodeData.name}${nodeData.ext}`;
        await removeFileSystem(`${parentNodeData.path}/${entryName}`);
      } catch (err) {
        console.error(err);
      }
    }
  } catch (err) {
    console.error(err);
  }
};
