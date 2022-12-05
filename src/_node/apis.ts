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
  TUpdateNodePayload,
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
 * get all of the nested chidren uids including itself
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
  let _uids: TUid[] = [...uids]
  if (_uids.length === 0) return []

  const deleted: { [uid: TUid]: boolean } = {}
  // sort uids
  _uids = _uids.sort((a, b) => a < b ? -1 : 1)

  // validate the uids generally
  _uids = _uids.filter((uid) => {
    const arr = uid.split('_')
    let parentDeleted = false
    let _uid = ''
    arr.map((_arr) => {
      _uid += `${_uid === '' ? '' : '_'}${_arr}`
      if (deleted[_uid] === true) {
        parentDeleted = true
      }
    })
    !parentDeleted ? (deleted[uid] = true) : null
    return !parentDeleted
  })

  // validate uids for move action
  if (targetUid !== undefined) {
    _uids = _uids.filter((uid) => {
      return !(targetUid as TUid).startsWith(uid)
    })
  }

  return _uids
}

/**
 * reset uids for all of the tree nodes
 * @param tree 
 * @returns 
 */
export const resetTreeUids = (tree: TTree): Map<TUid, TUid> => {
  const nodes: TNode[] = [{ ...tree['root'] }]
  const convertedUids: Map<TUid, TUid> = new Map<TUid, TUid>()
  while (nodes.length) {
    const node = nodes.shift() as TNode
    node.children = node.children.map((c_uid, index) => {
      const expectedUid = generateNodeUid(node.uid, index + 1)
      c_uid !== expectedUid && !tree[c_uid].isEntity && convertedUids.set(c_uid, expectedUid)
      nodes.push({ ...tree[c_uid], p_uid: node.uid, uid: expectedUid })
      return expectedUid
    })
  }
  return convertedUids
}

/**
 * add node api
 * this api adds the node just as a child of the target node in the tree
 * @param param0 
 */
export const addNode = ({ tree, targetUid, node }: TAddNodePayload) => {
  const target = tree[targetUid]
  node.uid = generateNodeUid(targetUid, target.children.length + 1)
  node.p_uid = targetUid
  target.children.push(node.uid)
  tree[node.uid] = node
}

/**
 * remove node api
 * this api removes the nodes from the tree based on the node uids
 */
export const removeNode = ({ tree, nodeUids }: TRemoveNodePayload): TNodeApiRes => {
  const deletedUids: TUid[] = []
  const changedParent: { [uid: TUid]: boolean } = {}
  for (const nodeUid of nodeUids) {
    const node = tree[nodeUid]

    // update parent
    const p_node = tree[node.p_uid as TUid]
    p_node.children = p_node.children.filter(c_uid => c_uid !== nodeUid)

    changedParent[p_node.uid] = true

    // delete nested nodes
    const uids = getSubUids(nodeUid, tree)
    deletedUids.push(...uids)
    for (const uid of uids) {
      delete tree[uid]
    }
  }

  /* reset the uids */
  const _convertedUids: Map<TUid, TUid> = resetTreeUids(tree)
  const convertedUids: [TUid, TUid][] = []
  for (const [prev, cur] of _convertedUids) {
    convertedUids.push([prev, cur])
  }
  return { deletedUids, convertedUids }
}

/**
 * move(cut & paste) node api
 * this api moves the nodes inside the parent node
 */
export const moveNode = ({ tree, isBetween, parentUid, position, uids }: TMoveNodePayload): TNodeApiRes => {
  const parentNode = tree[parentUid]
  for (const uid of uids) {
    const node = tree[uid]
    const p_node = tree[node.p_uid as TUid]
    p_node.children = p_node.children.filter(c_uid => c_uid !== uid)

    node.p_uid = parentUid
    if (isBetween) {
      /* push the node at the specific position of the parent.children */
      let pushed = false
      let childIndex = position
      parentNode.children = parentNode.children.reduce((prev, cur, index) => {
        if (index === childIndex) {
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
      parentNode.children.push(uid)
    }
  }

  /* reset the uids */
  const _convertedUids: Map<TUid, TUid> = resetTreeUids(tree)
  const convertedUids: [TUid, TUid][] = []
  for (const [prev, cur] of _convertedUids) {
    convertedUids.push([prev, cur])
  }
  return { convertedUids }
}

/**
 * duplicate(copy & paste) node api
 * this api duplicates the nodes inside the parent node
 */
export const duplicateNode = ({ tree, node }: TDuplicateNodePayload): TNodeApiRes => {
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

  /* reset the uids */
  const _convertedUids: Map<TUid, TUid> = resetTreeUids(tree)
  const convertedUids: [TUid, TUid][] = []
  for (const [prev, cur] of _convertedUids) {
    convertedUids.push([prev, cur])
  }
  return { convertedUids }
}

/**
 * update the data of the node in the tree based on the uid
 */
export const updateNode = ({ tree, uid, data }: TUpdateNodePayload) => {
  tree[uid].data = data
}

/**
 * replace node api
 * this api replaces the node in the tree - it can also use for rename
 */
export const replaceNode = ({ tree, node }: TReplaceNodePayload) => {
  // replace node in the tree
  tree[node.uid] = node
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