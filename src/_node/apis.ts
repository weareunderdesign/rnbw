import {
  parseHtml,
  serializeHtml,
} from './html';
import {
  TAddNodePayload,
  TDuplicateNodePayload,
  TMoveNodePayload,
  TNode,
  TNodeApiRes,
  TParseFilePayload,
  TRemoveNodePayload,
  TReplaceNodePayload,
  TSearializeFilePayload,
  TTree,
  TUid,
} from './types';

/**
 * generate the new uid inside p_uid
 * @param p_uid 
 * @param nodeIndex 
 * @returns 
 */
export const generateNodeUid = (p_uid: TUid, nodeIndex: number): TUid => {
  return p_uid + "_" + nodeIndex
}

/**
 * get all of the nested chidren(not entity) uids
 * @param uid 
 * @param tree 
 * @returns 
 */
export const getSubNEUids = (uid: TUid, tree: TTree): TUid[] => {
  let subUids: TUid[] = [uid]
  let uids: TUid[] = []
  while (subUids.length) {
    const subUid = subUids.shift() as TUid
    uids.push(subUid)
    const node = tree[subUid]
    for (const childUid of node.children) {
      if (!tree[childUid].isEntity) {
        subUids.push(childUid)
      }
    }
  }
  return uids
}

/**
 * get all of the nested chidren uids
 * @param uid 
 * @param tree 
 * @returns 
 */
export const getSubUids = (uid: TUid, tree: TTree): TUid[] => {
  let subUids: TUid[] = [uid]
  let uids: TUid[] = []
  while (subUids.length) {
    const subUid = subUids.shift() as TUid
    uids.push(subUid)
    const node = tree[subUid]
    for (const childUid of node.children) {
      subUids.push(childUid)
    }
  }
  return uids
}

/**
 * validate the uids - parent/child, nested...
 * @param uids 
 * @param targetUid 
 * @returns 
 */
export const validateUids = (uids: TUid[], targetUid?: TUid): TUid[] => {
  if (uids.length == 0)
    return uids

  // check move action
  if (targetUid == undefined) {
    // think prev items already validate, so you need validate the last one
    const uid: TUid = uids.pop() as TUid
    let flag: boolean = false // true: the last one modified prev items, false: current uids are already validate
    let result: TUid[] = []

    result = uids.filter((curUid) => {
      // check curUid related uid
      if (curUid.startsWith(uid) || uid.startsWith(curUid))
        flag = true
      return !curUid.startsWith(uid) && !uid.startsWith(curUid)
    })

    if (flag === false) {
      uids.push(uid)
      return uids
    }
    else {
      result.push(uid)
      return result
    }
  } else {
    // remove target's parent uids from uids
    return uids.filter((uid) => {
      return !targetUid.startsWith(uid)
    })
  }

}

/**
 * reset all of the uids inside p_uid in the tree data
 * @param p_uid 
 * @param tree 
 * @param convertedUids 
 */
export const resetUids = (p_uid: TUid, tree: TTree, convertedUids: Map<TUid, TUid>) => {
  const addedNodes: TNode[] = []
  const _deletedUids: TUid[] = []

  tree[p_uid].children = tree[p_uid].children.map((uid, index) => {
    const newUid = generateNodeUid(p_uid, index + 1)
    if (newUid !== uid) {
      /* remove original node(nest) and add new nodes */
      const subUids = getSubUids(uid, tree)
      _deletedUids.push(...subUids)
      for (const subUid of subUids) {
        const newSubUid = newUid + subUid.slice(uid.length)
        const subNode = tree[subUid]
        addedNodes.push({
          uid: newSubUid,
          p_uid: (subNode.p_uid !== p_uid) ? newUid + subNode.p_uid?.slice(uid.length) : p_uid,
          name: subNode.name,
          isEntity: subNode.isEntity,
          children: subNode.children.map(c_uid => newUid + c_uid.slice(uid.length)),
          data: subNode.data,
        })
        convertedUids.set(subUid, newSubUid)
      }
    }
    return newUid
  })

  /* delete orignal node-nest */
  for (const deletedUid of _deletedUids) {
    delete tree[deletedUid]
  }

  /* add the new renamed nodes */
  for (const addedNode of addedNodes) {
    tree[addedNode.uid] = addedNode
  }
}

/**
 * add node api
 * this api adds the node just child of the target node in the tree
 */
export const addNode = ({ tree, targetUid, node }: TAddNodePayload): TNodeApiRes => {
  try {
    const target = tree[targetUid]
    node.uid = generateNodeUid(targetUid, target.children.length + 1)
    node.p_uid = targetUid
    target.children.push(node.uid)
    tree[node.uid] = node

    return { success: true }
  } catch (err) {
    return { success: false, error: err as string }
  }
}

/**
 * remove node api
 * this api removes the nodes from the tree based on the node uids
 */
export const removeNode = ({ tree, nodeUids }: TRemoveNodePayload): TNodeApiRes => {
  try {
    const _convertedUids = new Map<TUid, TUid>()
    const deletedUids: TUid[] = []
    const changedParent: { [uid: TUid]: boolean } = {}

    for (const nodeUid of nodeUids) {
      const node = tree[nodeUid]

      changedParent[node.p_uid as TUid] = true
      const p_node = tree[node.p_uid as TUid]
      p_node.children = p_node.children.filter(c_uid => c_uid !== nodeUid)

      /* remove sub nodes */
      const uids = getSubUids(nodeUid, tree)
      for (const uid of uids) {
        delete tree[uid]
      }
      deletedUids.push(...uids)
    }

    /* reset the uids */
    Object.keys(changedParent).sort((a, b) => a > b ? -1 : 1)
      .map(uid =>
        resetUids(uid, tree, _convertedUids)
      )

    const convertedUids: [TUid, TUid][] = []
    for (const [prev, cur] of _convertedUids) {
      convertedUids.push([prev, cur])
    }
    return { success: true, deletedUids, convertedUids }
  } catch (err) {
    return { success: false, error: err as string }
  }
}

/**
 * replace node api
 * this api replaces the node in the tree - it can also use for rename
 */
export const replaceNode = ({ tree, node }: TReplaceNodePayload): TNodeApiRes => {
  try {
    // replace node in the tree
    tree[node.uid] = node

    return { success: true }
  } catch (err) {
    return { success: false, error: err as string }
  }
}

/**
 * move(cut & paste) node api
 * this api moves the nodes inside the parent node
 */
export const moveNode = ({ tree, isBetween, parentUid, position, uids }: TMoveNodePayload): TNodeApiRes => {
  try {
    const _convertedUids = new Map<TUid, TUid>()
    const changedParent: { [uid: TUid]: boolean } = {}

    const parentNode = tree[parentUid]
    for (const uid of uids) {
      const node = tree[uid]

      /* reset the parent node */
      const p_node = tree[node.p_uid as TUid]
      changedParent[p_node.uid] = true
      p_node.children = p_node.children.filter(c_uid => c_uid !== uid)

      if (isBetween) {
        node.p_uid = parentUid

        /* push the node at the specific position of the parent.children */
        let pushed = false
        parentNode.children = parentNode.children.reduce((prev, cur, index) => {
          if (index === position) {
            pushed = true
            prev.push(uid)
          }
          if (cur === uid) {
            return prev
          }
          prev.push(cur)
          return prev
        }, [] as TUid[])
        if (!pushed) {
          parentNode.children.push(uid)
        }
      } else {
        /* push to back of the parent node */
        node.p_uid = parentUid
        parentNode.children.push(uid)
      }
    }

    /* reset the uids */
    changedParent[parentUid] = true
    Object.keys(changedParent).sort((a, b) => a > b ? -1 : 1)
      .map(uid =>
        resetUids(uid, tree, _convertedUids)
      )

    const convertedUids: [TUid, TUid][] = []
    for (const [prev, cur] of _convertedUids) {
      convertedUids.push([prev, cur])
    }
    return { success: true, convertedUids }
  } catch (err) {
    return { success: false, error: err as string }
  }
}

/**
 * duplicate(copy & paste) node api
 * this api duplicates the nodes inside the parent node
 */
export const duplicateNode = ({ tree, node }: TDuplicateNodePayload): TNodeApiRes => {
  try {
    const _convertedUids = new Map<TUid, TUid>()

    /* insert the duplicated node uid to the parent.children */
    const p_node = tree[node.p_uid as TUid]
    let newUid: TUid = node.uid
    p_node.children = p_node.children.reduce((prev, cur, index) => {
      prev.push(cur)
      if (cur === node.uid) {
        newUid = generateNodeUid(p_node.uid, p_node.children.length + 1)
        prev.push(newUid)
      }
      return prev
    }, [] as TUid[])

    /* generate the new nodes and add them to the tree */
    const subUids = getSubUids(node.uid, tree)
    for (const subUid of subUids) {
      const newSubUid = newUid + subUid.slice(node.uid.length)
      const subNode = tree[subUid]
      tree[newSubUid] = {
        uid: newSubUid,
        p_uid: (subNode.p_uid !== p_node.uid) ? newUid + subNode.p_uid?.slice(node.uid.length) : p_node.uid,
        name: subNode.name,
        isEntity: subNode.isEntity,
        children: subNode.children.map(c_uid => newUid + c_uid.slice(node.uid.length)),
        data: subNode.data,
      }
    }

    /* reset the node uids */
    resetUids(p_node.uid, tree, _convertedUids)

    const convertedUids: [TUid, TUid][] = []
    for (const [prev, cur] of _convertedUids) {
      convertedUids.push([prev, cur])
    }
    return { success: true, convertedUids }
  } catch (err) {
    return { success: false, error: err as string }
  }
}

/**
 * parse file api
 * this api parses the file content based on the type and return the tree data
 */
export const parseFile = ({ type, content }: TParseFilePayload): TTree => {
  if (type === "html") {
    return parseHtml(content)
  }
  return {}
}

/**
 * searialize file api
 * this api searializes the file content based on the type and tree data
 */
export const serializeFile = ({ type, tree }: TSearializeFilePayload): string => {
  if (type === "html") {
    return serializeHtml(tree)
  }
  return ''
}