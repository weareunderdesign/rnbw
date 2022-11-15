import {
  TAddNodePayload,
  TDuplicateNodePayload,
  TMoveNodePayload,
  TNodeApiRes,
  TParseFilePayload,
  TRemoveNodePayload,
  TReplaceNodePayload,
  TSearializeFilePayload,
  TTree,
  TUid,
} from './types';

/**
 * add node api
 * this api adds the node just after the target node in the tree
 */
export const addNode = ({ tree, targetUid, node }: TAddNodePayload): TNodeApiRes => {
  try {
    /* target validate */
    const target = tree[targetUid]
    if (target === undefined) {
      throw 'invalid target'
    }

    if (target.p_uid !== null) {
      /* parent validate */
      const parent = tree[target.p_uid]
      if (parent === undefined) {
        throw 'invalid parent'
      }

      /* add node uid to the parent.children uid list */
      parent.children = parent.children.reduce((prev: TUid[], cur: TUid): TUid[] => {
        if (cur === target.uid) {
          prev.push(cur, node.uid)
        } else {
          prev.push(cur)
        }
        return prev
      }, [])
    }

    /* set parent uid of the node and add it to the tree */
    node.p_uid = target.p_uid
    tree[node.uid] = node
  } catch (err) {
    return { success: false, error: err as string }
  }

  return { success: true }
}

/**
 * remove node api
 * this api removes the nodes from the tree based on the node uids
 */
export const removeNode = ({ tree, nodeUids }: TRemoveNodePayload): TNodeApiRes => {
  try {
    // remove the nodes from the tree based on the node uids
    while (nodeUids.length > 0) {
      const nodeUid = nodeUids.shift()
      const node = tree[nodeUid as TUid]
      if (node !== undefined) {
        nodeUids.push(...node.children)
      }
      delete tree[nodeUid as TUid]
    }

  } catch (err) {
    return { success: false, error: err as string }
  }
  return { success: true }
}

/**
 * replace node api
 * this api replaces the node in the tree - it can also use for rename
 */
export const replaceNode = ({ tree, node }: TReplaceNodePayload): TNodeApiRes => {
  try {
    // node validate
    if (tree[node.uid] === undefined) {
      throw 'invalid node'
    }

    // replace node in the tree
    tree[node.uid] = node
  } catch (err) {
    return { success: false, error: err as string }
  }
  return { success: true }
}

/**
 * move(cut & paste) node api
 * this api moves the nodes inside the parent node
 */
export const moveNode = ({ tree, isBetween, parentUid, position, nodes }: TMoveNodePayload): TNodeApiRes => {
  try {

  } catch (err) {
    return { success: false, error: err as string }
  }
  return { success: true }
}

/**
 * duplicate(copy & paste) node api
 * this api duplicates the nodes inside the parent node
 */
export const duplicateNode = ({ tree, isBetween, parentUid, position, nodes }: TDuplicateNodePayload): TNodeApiRes => {
  try {

  } catch (err) {
    return { success: false, error: err as string }
  }
  return { success: true }
}

/**
 * parse file api
 * this api parses the file content based on the type and return the tree data
 */
export const parseFile = ({ type, content }: TParseFilePayload): TTree => {
  return {}
}

/**
 * searialize file api
 * this api searializes the file content based on the type and tree data
 */
export const serializeFile = ({ type, tree }: TSearializeFilePayload): string => {
  return ''
}