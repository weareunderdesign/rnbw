import {
  TFileHandlerCollection,
  TFileNodeData,
} from '@_node/file';
import {
  TNodeTreeData,
  TNodeUid,
} from '@_node/types';
import { verifyFileHandlerPermission } from '@_services/main';
import { TToast } from '@_types/global';

import {
  duplicatingWarning,
  invalidDirError,
} from '../errors';
import { generateNewNodeName } from './';
import { moveActions } from './moveActions';

export const duplicateNode = async (
  uid: TNodeUid,
  isCopy: boolean,
  ffTree: TNodeTreeData,
  ffHandlers: TFileHandlerCollection,
  addMessage: (message: TToast) => void,
  setInvalidNodes: any,
  invalidNodes: { [uid: string]: boolean },
) => {
  const { moveLocalFF } = moveActions(addMessage);

  const node = ffTree[uid];
  if (!node) return;

  const nodeData = node.data as TFileNodeData;
  const parentNode = ffTree[node.parentUid as TNodeUid];
  if (!parentNode) return;

  const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle;

  if (!(await verifyFileHandlerPermission(parentHandler))) {
    addMessage(invalidDirError);
    return;
  }

  const newName = await generateNewNodeName(
    parentHandler,
    nodeData.name,
    nodeData.kind === "directory",
    nodeData.ext,
  );

  const newUid = `${node.parentUid}/${newName}`;
  setInvalidNodes({ ...invalidNodes, [uid]: true, [newUid]: true });

  try {
    await moveLocalFF(
      ffHandlers[uid],
      parentHandler,
      parentHandler,
      newName,
      true,
    );
  } catch (err) {
    addMessage(duplicatingWarning);
  }

  delete invalidNodes[uid];
  delete invalidNodes[newUid];
  setInvalidNodes({ ...invalidNodes });

  return { uid, name: newName };
};
