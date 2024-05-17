import { RootNodeUid, TmpFileNodeUidWhenAddNew } from "@_constants/main";
import { TFileNodeTreeData, _path } from "@_node/file";
import { TNode, TNodeTreeData } from "@_node/index";
import { expandFileTreeNodes, setFileTree } from "@_redux/main/fileTree";
import { useAppState } from "@_redux/useAppState";
import { useDispatch } from "react-redux";

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
      }
    }
  }
  return uniqueName;
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

  return { getParentHandler, updatedFileTreeAfterAdding, getUniqueIndexedName };
};
