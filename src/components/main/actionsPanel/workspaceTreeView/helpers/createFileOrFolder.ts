import {
  TFileHandlerCollection,
  TFileNodeData,
} from "@_node/file";
import { _createIDBDirectory, _writeIDBFile } from "@_node/file/nohostApis";
import { TNodeTreeData, TNodeUid } from "@_node/types";
import { TProject } from "@_redux/main/fileTree";
import { verifyFileHandlerPermission } from "@_services/main";
import { TFileNodeType } from "@_types/main";

export const createFileOrFolder = async (
  parentUid: TNodeUid,
  name: string,
  type: TFileNodeType,
  project: Omit<TProject, "handler">,
  ffTree: TNodeTreeData,
  fileHandlers: TFileHandlerCollection,
) => {
  try {
    const parentNode = ffTree[parentUid];
    if (parentNode === undefined) throw new Error("Parent node not found");
    const parentNodeData = parentNode.data as TFileNodeData;

    if (project.context === "local") {
      const parentHandler = fileHandlers[
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
        await _createIDBDirectory(`${parentNodeData.path}/${name}`);
      } else {
        await _writeIDBFile(`${parentNodeData.path}/${name}`, "");
      }
    }
  } catch (err) {
    console.error(err);
  }
};
