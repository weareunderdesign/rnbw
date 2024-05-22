import { RootNodeUid, TmpFileNodeUidWhenAddNew } from "@_constants/main";
import {
  TFileHandlerCollection,
  TFileNodeData,
  TFileNodeTreeData,
  _path,
  getTargetHandler,
} from "@_node/file";
import { TNode, TNodeTreeData, TNodeUid } from "@_node/index";
import { expandFileTreeNodes, setFileTree } from "@_redux/main/fileTree";
import { useAppState } from "@_redux/useAppState";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { verifyFileHandlerPermission } from "./main";

export const getUniqueIndexedName = async ({
  parentHandler,
  entityName,
  extension,
}: {
  parentHandler: FileSystemDirectoryHandle;
  entityName: string;
  extension?: string;
}) => {
  let index = 0;

  function getIndexedName() {
    /*if the extension is provided, then it is a file, 
      else it is a folder*/

    if (extension)
      return `${entityName}${index > 0 ? `(${index})` : ""}.${extension}`;
    return `${entityName}${index > 0 ? `(${index})` : ""}`;
  }

  let uniqueName = null;
  //We generate a unique indexed name for the file
  while (uniqueName === null) {
    const indexedName = getIndexedName();
    try {
      //getFileHandle throws an error if the file does not exist
      if (extension) await parentHandler.getFileHandle(indexedName);
      else await parentHandler.getDirectoryHandle(indexedName);
      index++;
    } catch (err) {
      //if the error is not NotFoundError, we create the file

      //@ts-expect-error - types are not updated
      if (err.name === "NotFoundError") {
        uniqueName = indexedName;
      } else {
        toast.error("An error occurred while creating the file");
      }
    }
  }
  return uniqueName;
};
const generateNewNameForLocalDirectoryOrFile = async ({
  nodeData,
  targetHandler,
}: {
  nodeData: TFileNodeData;
  targetHandler: FileSystemDirectoryHandle;
}): Promise<string> => {
  const { name, ext, kind } = nodeData;
  let newName = kind === "directory" ? name : `${name}.${ext}`;
  let exists = true;
  let index = -1;
  while (exists) {
    try {
      if (nodeData.kind === "directory") {
        await targetHandler.getDirectoryHandle(newName, { create: false });
      } else {
        await targetHandler.getFileHandle(newName, {
          create: false,
        });
      }
    } catch (err) {
      toast.error("Error while generating a new name for a local directory.");
      exists = false;
    }

    if (exists) {
      ++index;
      newName =
        nodeData.kind === "directory"
          ? index === 0
            ? `${name} copy`
            : `${name} copy (${index})`
          : index === 0
            ? `${name} copy.${ext}`
            : `${name} copy (${index}).${ext}`;
    }
  }
  return newName;
};
export const useFileHelpers = () => {
  const dispatch = useDispatch();

  const { fFocusedItem, fileTree, fileHandlers, fExpandedItemsObj } =
    useAppState();

  const getParentHandler = (uid: string): FileSystemDirectoryHandle | null => {
    if (!uid) return fileHandlers[RootNodeUid] as FileSystemDirectoryHandle;
    const parentUid = fileTree[uid].parentUid;
    if (!parentUid) return null;
    const parentNode = fileTree[parentUid];
    if (!parentNode) return null;
    const parentHandler = fileHandlers[parentUid] as FileSystemDirectoryHandle;
    return parentHandler;
  };

  const updatedFileTreeAfterAdding = ({
    isFolder,
    ext,
  }: {
    isFolder: boolean;
    ext: string;
  }) => {
    // performs a deep clone of the file tree
    const _fileTree = structuredClone(fileTree) as TNodeTreeData;

    // find the immediate directory of the focused item if it is a file
    let immediateDir = _fileTree[fFocusedItem];
    if (!immediateDir) return;
    if (immediateDir.isEntity) {
      immediateDir = _fileTree[immediateDir.parentUid!];
    }

    //if the directory is not a RootNode and not already expanded, expand it
    if (
      immediateDir.uid !== RootNodeUid &&
      !fExpandedItemsObj[immediateDir.uid]
    ) {
      dispatch(expandFileTreeNodes([immediateDir.uid]));
    }

    // create tmp node for new file/directory
    const tmpNode: TNode = {
      uid: _path.join(immediateDir.uid, TmpFileNodeUidWhenAddNew),
      parentUid: immediateDir.uid,
      displayName: "Untitled",
      isEntity: !isFolder,
      children: [],
      data: {
        valid: false,
        ext,
      },
    };

    // adds the tmp node to the file tree at the beginning of focused item parent's children
    immediateDir.children.unshift(tmpNode.uid);

    // Assign the tmp node to the file tree
    _fileTree[tmpNode.uid] = tmpNode;

    // update the file tree
    dispatch(setFileTree(_fileTree as TFileNodeTreeData));
  };
  const _moveLocalDirectory = async (
    source: FileSystemDirectoryHandle,
    destination: FileSystemDirectoryHandle,
    parentHandler: FileSystemDirectoryHandle,
    isCopy: boolean,
  ) => {
    const dirQueue = [
      {
        source,
        destination,
      },
    ];

    try {
      while (dirQueue.length) {
        const { source, destination } = dirQueue.shift() as {
          source: FileSystemDirectoryHandle;
          destination: FileSystemDirectoryHandle;
        };

        /* We iterate through the source directory and copy the files and directories
        to the destination directory. */
        for await (const entry of source.values()) {
          /*If the entry is a directory, we create a new
          directory in the destination directory and push the source directory and the
          new directory to the queue. */
          if (entry.kind === "directory") {
            const newDir = await destination.getDirectoryHandle(entry.name, {
              create: true,
            });
            dirQueue.push({
              source: entry as FileSystemDirectoryHandle,
              destination: newDir,
            });
          } else {
            /*
            If the entry is a file, we create a new file in
          the destination directory and write the content of the source file to the new file.*/
            const newFile = await destination.getFileHandle(entry.name, {
              create: true,
            });
            const content = await (entry as FileSystemFileHandle).getFile();
            const writableStream = await newFile.createWritable();
            await writableStream.write(content);
            await writableStream.close();
          }
        }
      }

      /*If the operation is a move operation, we remove the source directory
      from the parent directory.*/
      if (!isCopy) {
        try {
          parentHandler.removeEntry(source.name, { recursive: true });
        } catch (err) {
          toast.error("Error while moving a local directory.");
          console.error(err);
        }
      }
    } catch (err) {
      toast.error("Error while moving a local directory.");
      console.error(err);
    }
  };
  const _moveLocalFile = async (
    handler: FileSystemHandle,
    parentHandler: FileSystemDirectoryHandle,
    targetHandler: FileSystemDirectoryHandle,
    newName: string,
    isCopy: boolean,
  ) => {
    try {
      const newFile = await targetHandler.getFileHandle(newName, {
        create: true,
      });

      const content = await (handler as FileSystemFileHandle).getFile();
      const writableStream = await newFile.createWritable();
      await writableStream.write(content);
      await writableStream.close();

      !isCopy &&
        (await parentHandler.removeEntry(handler.name, { recursive: true }));
    } catch (err) {
      toast.error("Error while moving a local file.");
      throw "Error while moving a local file.";
    }
  };
  const moveLocalSingleDirectoryOrFile = async ({
    uid,
    targetUid,
    newName,
    fileTree,
    fileHandlers,
    isCopy = false,
  }: {
    uid: TNodeUid;
    targetUid: TNodeUid;
    newName?: string;
    fileTree: TFileNodeTreeData;
    fileHandlers: TFileHandlerCollection;
    isCopy?: boolean;
  }): Promise<boolean> => {
    /* We check if the source node, target node,
  and the parent node of the source node exist.
  */

    const node = fileTree[uid];
    if (!node) return false;

    const parentNode = fileTree[node.parentUid!];
    if (!parentNode) return false;

    const targetNode = fileTree[targetUid];
    if (!targetNode) return false;

    /*
  We verify the permissions of the source node,
  the parent node of the source node, and the target node.
  */
    const handler = fileHandlers[uid];
    const parentUid = parentNode.uid;
    const parentHandler = fileHandlers[parentUid] as FileSystemDirectoryHandle;
    const targetHandler = getTargetHandler({
      targetUid,
      fileTree,
      fileHandlers,
    });
    try {
      if (
        !(await verifyFileHandlerPermission(handler)) ||
        !(await verifyFileHandlerPermission(parentHandler)) ||
        !(await verifyFileHandlerPermission(targetHandler))
      )
        return false;

      const nodeData = node.data;

      let uniqueEntityName =
        newName || `${nodeData.name}${nodeData.ext ? `.${nodeData.ext}` : ""}`;
      if (isCopy) {
        uniqueEntityName = await generateNewNameForLocalDirectoryOrFile({
          nodeData,
          targetHandler,
        });
      } else {
        //ignore paste for cut in the same location
        if (targetNode.isEntity) {
          if (targetNode.parentUid === parentNode.uid) {
            return false;
          }
        }
      }

      if (nodeData.kind === "directory") {
        try {
          const newHandler = await targetHandler.getDirectoryHandle(
            uniqueEntityName,
            {
              create: true,
            },
          );

          await _moveLocalDirectory(
            handler as FileSystemDirectoryHandle,
            newHandler,
            parentHandler,
            isCopy,
          );
        } catch (err) {
          toast.error("Error while moving a local directory.");
          console.log(err);
        }
      } else {
        try {
          await _moveLocalFile(
            handler as FileSystemFileHandle,
            parentHandler,
            targetHandler,
            uniqueEntityName,
            isCopy,
          );
        } catch (err) {
          toast.error("Error while moving a local file.");
          console.log(err);
        }
      }
      return true;
    } catch (err) {
      toast.error("Error while moving a local directory or file.");
      console.error(err);
      return false;
    }
  };

  return {
    getParentHandler,
    updatedFileTreeAfterAdding,
    getUniqueIndexedName,
    moveLocalSingleDirectoryOrFile,
  };
};
