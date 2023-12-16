import { TFileNodeData } from "@_node/file";

export const generateNewNameMoveNode = async (
  nodeData: TFileNodeData,
  targetHandler: FileSystemDirectoryHandle,
  copy: boolean,
) => {
  let newName =
    nodeData.kind === "directory"
      ? nodeData.name
      : `${nodeData.name}.${nodeData.ext}`;

  // if (copy) {
  if (nodeData.kind === "directory") {
    let folderName = nodeData.name;
    let exists = false;
    try {
      await targetHandler.getDirectoryHandle(folderName, {
        create: false,
      });
      exists = true;
    } catch (err) {
      exists = false;
    }
    if (exists) {
      try {
        folderName = `${nodeData.name} copy`;
        await targetHandler.getDirectoryHandle(folderName, {
          create: false,
        });
        exists = true;
      } catch (err) {
        exists = false;
      }
      if (exists) {
        let index = 0;
        while (exists) {
          try {
            folderName = `${nodeData.name} copy (${++index})`;
            await targetHandler.getDirectoryHandle(folderName, {
              create: false,
            });
            exists = true;
          } catch (err) {
            exists = false;
          }
        }
      }
    }
    newName = folderName;
  } else {
    let fileName = `${nodeData.name}.${nodeData.ext}`;
    let exists = false;
    try {
      await targetHandler.getFileHandle(fileName, {
        create: false,
      });
      exists = true;
    } catch (err) {
      exists = false;
    }
    if (exists) {
      try {
        fileName = `${nodeData.name} copy.${nodeData.ext}`;
        await targetHandler.getFileHandle(fileName, {
          create: false,
        });
        exists = true;
      } catch (err) {
        exists = false;
      }
      if (exists) {
        let index = 0;
        while (exists) {
          try {
            fileName = `${nodeData.name} copy (${++index}).${nodeData.ext}`;
            await targetHandler.getFileHandle(fileName, {
              create: false,
            });
            exists = true;
          } catch (err) {
            exists = false;
          }
        }
      }
      newName = fileName;
    }
  }
  // }

  return newName;
};
