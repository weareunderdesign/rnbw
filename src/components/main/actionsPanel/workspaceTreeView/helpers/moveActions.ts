import {
  getStat,
  readFile,
  removeFileSystem,
  TFileNodeData,
  writeFile,
} from "@_node/file";
import { TToast } from "@_types/global";

import { copyDirectory, moveDirectory, moveFile } from "./";

export const moveActions = (addMessage: (message: TToast) => void) => {
  const moveLocalFF = async (
    handler: FileSystemHandle,
    parentHandler: FileSystemDirectoryHandle,
    targetHandler: FileSystemDirectoryHandle,
    newName: string,
    copy: boolean = false,
    showWarning: boolean = false,
  ) => {
    if (handler.kind === "directory") {
      // validate if the new name exists
      let exists = true;
      try {
        await targetHandler.getDirectoryHandle(newName, { create: false });
        exists = true;
      } catch (err) {
        exists = false;
      }
      if (exists) {
        showWarning &&
          addMessage({
            type: "error",
            content: "Folder with the same name already exists.",
          });
        return;
      }

      // move nested handler-dir to targetHandler with the newName - copy (optional)
      try {
        const newHandler = await targetHandler.getDirectoryHandle(newName, {
          create: true,
        });
        await copyDirectory(
          handler as FileSystemDirectoryHandle,
          newHandler,
          copy,
        );
      } catch (err) {
        throw new Error("error");
      }
    } else {
      await moveFile(
        handler,
        parentHandler,
        targetHandler,
        newName,
        copy,
        showWarning,
        addMessage,
      );
    }
  };

  const moveIDBFF = async (
    nodeData: TFileNodeData,
    targetNodeData: TFileNodeData,
    newName: string,
    copy: boolean = false,
    showWarning: boolean = false,
  ) => {
    if (nodeData.kind === "directory") {
      // validate if the new name exists
      let exists = true;
      try {
        await getStat(`${targetNodeData.path}/${newName}`);
        exists = true;
      } catch (err) {
        exists = false;
      }
      if (exists) {
        showWarning &&
          addMessage({
            type: "error",
            content: "Folder with the same name already exists.",
          });
        return;
      }

      // move nested handler-dir to targetHandler with the newName - copy (optional)
      try {
        const dirs = [
          {
            orgPath: nodeData.path,
            newPath: `${targetNodeData.path}/${newName}`,
          },
        ];

        for (const { orgPath, newPath } of dirs) {
          await moveDirectory(orgPath, newPath, copy, nodeData);
        }
      } catch (err) {
        throw "error";
      }
    } else {
      // validate if the new name exists
      let exists = true;
      try {
        await getStat(`${targetNodeData.path}/${newName}`);
        exists = true;
      } catch (err) {
        exists = false;
      }
      if (exists) {
        showWarning &&
          addMessage({
            type: "error",
            content: "File with the same name already exists.",
          });
        return;
      }

      // create a new file with the new name and write the content
      try {
        await writeFile(
          `${targetNodeData.path}/${newName}`,
          await readFile(nodeData.path),
        );

        // handle copy(optional)
        !copy && (await removeFileSystem(nodeData.path));
      } catch (err) {
        throw "error";
      }
    }
  };

  return {
    moveLocalFF,
    moveIDBFF,
  };
};
