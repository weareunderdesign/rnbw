import { useContext } from 'react';

import { useSelector } from 'react-redux';

import { TFileNodeData } from '@_node/file';
import { TNodeUid } from '@_node/types';
import { MainContext } from '@_redux/main';
import {
  fileTreeSelector,
  projectSelector,
} from '@_redux/main/fileTree';
import { verifyFileHandlerPermission } from '@_services/main';

import { useInvalidNodes } from '../hooks';
import { generateNewNameMoveNode } from './generateNewNameMoveNode';
import { moveActions } from './moveActions';

export const validateAndMoveNode = async (
  uid: string,
  targetUid: TNodeUid,
  copy: boolean = false,
) => {
  const project = useSelector(projectSelector);
  const fileTree = useSelector(fileTreeSelector);

  const { ffHandlers, addMessage } = useContext(MainContext);

  const { setInvalidNodes }: any = useInvalidNodes();

  const { moveIDBFF, moveLocalFF } = moveActions(addMessage);

  const node = fileTree[uid];

  if (node === undefined) {
    return false;
  }

  const nodeData = node.data as TFileNodeData;
  const parentNode = fileTree[node.parentUid as TNodeUid];

  if (parentNode === undefined) {
    return false;
  }

  const handler = ffHandlers[uid];
  const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle;

  if (
    !(await verifyFileHandlerPermission(handler)) ||
    !(await verifyFileHandlerPermission(parentHandler))
  ) {
    return false;
  }

  const newUid = `${targetUid}/${await generateNewNameMoveNode(
    nodeData,
    parentHandler,
    copy,
  )}`;

  // update invalidNodes
  setInvalidNodes((prevState: Record<string, boolean>) => ({
    ...prevState,
    [uid]: true,
    [newUid]: true,
  }));

  // move
  try {
    if (project.context === "local") {
      await moveLocalFF(handler, parentHandler, parentHandler, newUid, copy);
    } else if (project.context === "idb") {
      const targetNode = fileTree[targetUid];
      const targetNodeData = targetNode.data as TFileNodeData;
      await moveIDBFF(nodeData, targetNodeData, newUid, copy);
    }
    return true;
  } catch (err) {
    return false;
  } finally {
    // update invalidNodes
    setInvalidNodes((prevState: Record<string, boolean>) => {
      delete prevState[uid];
      delete prevState[newUid];
      return { ...prevState };
    });
  }
};
