import {
  TFileHandlerCollection,
  TFileNodeData,
  createDirectory,
  writeFile,
} from "@_node/file";
import { TNodeTreeData, TNodeUid } from "@_node/types";
import { verifyFileHandlerPermission } from "@_services/main";
import { TFileNodeType, TProject } from "@_types/main";

export const createFileOrFolder = async (
  parentUid: TNodeUid,
  name: string,
  type: TFileNodeType,
  project: TProject,
  ffTree: TNodeTreeData,
  ffHandlers: TFileHandlerCollection,
) => {
  try {
    const parentNode = ffTree[parentUid];
    if (parentNode === undefined) throw new Error("Parent node not found");
    const parentNodeData = parentNode.data as TFileNodeData;

    if (project.context === "local") {
      const parentHandler = ffHandlers[
        parentNode.uid
      ] as FileSystemDirectoryHandle;
      if (!(await verifyFileHandlerPermission(parentHandler))) {
        throw new Error("Permission denied");
      }

      if (type === "*folder") {
        await parentHandler.getDirectoryHandle(name, { create: true });
      } else {
        await parentHandler.getFileHandle(name, { create: true });
      }
    } else if (project.context === "idb") {
      if (type === "*folder") {
        await createDirectory(`${parentNodeData.path}/${name}`);
      } else {
        await writeFile(`${parentNodeData.path}/${name}`, "");
      }
    }
  } catch (err) {
    console.error(err);
  }
};
