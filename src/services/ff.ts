import {
  TTree,
  TUid,
} from '@_node/types';
import { FFNode } from '@_types/ff';

/**
 * get all of the nested chidren uids
 * @param uid 
 * @param workspace 
 * @returns 
 */
export const getSubDirectoryUids = (uid: TUid, workspace: TTree): TUid[] => {
  let nodes: FFNode[] = [workspace[uid]]
  let uids: TUid[] = []
  while (nodes.length) {
    const node = nodes.shift() as FFNode
    uids.push(node.uid)
    for (const childUid of node.children) {
      if (!workspace[childUid].isEntity) {
        nodes.push(workspace[childUid])
      }
    }
  }
  return uids
}

/**
 * get all of the nested chidren nodes
 * @param uid 
 * @param workspace 
 * @returns 
 */
export const getSubDirectoryNodes = (uid: TUid, workspace: TTree): FFNode[] => {
  let nodes: FFNode[] = []
  let uids: TUid[] = [uid]
  while (uids.length) {
    const uid = uids.shift() as TUid
    const node = workspace[uid]
    nodes.push(node)
    for (const childUid of node.children) {
      uids.push(childUid)
    }
  }
  return nodes
}