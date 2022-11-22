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

const _ = require("lodash")

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
 * get all of the nested chidren nodes
 * @param uid 
 * @param tree 
 * @returns 
 */
export const getSubNodes = (uid: TUid, tree: TTree): TNode[] => {
  let nodes: TNode[] = []
  let uids: TUid[] = [uid]
  while (uids.length) {
    const uid = uids.shift() as TUid
    const node = tree[uid]
    nodes.push(node)
    for (const childUid of node.children) {
      uids.push(childUid)
    }
  }
  return nodes
}

/**
 * reset all of the uids inside p_uid in the tree data
 * @param p_uid 
 * @param tree 
 * @param convertedUids 
 */
export const resetUids = (p_uid: TUid, tree: TTree, convertedUids: Map<TUid, TUid>) => {
  tree[p_uid].children = tree[p_uid].children.map((c_uid, index) => {
    const newUid = generateNodeUid(p_uid, index + 1)
    if (newUid !== c_uid) {
      convertedUids.set(c_uid, newUid)
    }
    return newUid
  })
}

const getParentUids = (uids: TUid[]) => {
  let p_uids: TUid[] = []
  uids.sort().map((uid) => {
    if (p_uids.length == 0) {
      p_uids.push(uid)
    } else {
      if (uid.startsWith(p_uids[p_uids.length - 1])) {
        return;
      }
      p_uids.push(uid)
    }
  })
  return p_uids
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
    const convertedUids = new Map<TUid, TUid>()
    const deletedUids: TUid[] = []

    for (const nodeUid of nodeUids) {
      const node = tree[nodeUid]
      const p_node = tree[node.p_uid as TUid]
      p_node.children = p_node.children.filter(c_uid => c_uid !== nodeUid)

      /* remove sub nodes */
      const uids = getSubUids(nodeUid, tree)
      for (const uid of uids) {
        delete tree[uid]
      }
      deletedUids.push(...uids)

      /* reset the uids */
      resetUids(node.p_uid as TUid, tree, convertedUids)
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
export const moveNode = ({ tree, isBetween, parentUid, position, uids }: TMoveNodePayload): TNodeApiRes => {
  /* try {
    console.log(tree, parentUid, uids)
    let treeData: TTree = tree;
    uids.map((uid) => {
      let node = _.cloneDeep(tree[uid])

      const result = removeNode({ tree: treeData, nodeUids: [uid], deleted: true })
      console.log(result)
      let child: TTree = result.child
      const convertUids = result.convertUids
      treeData = _.cloneDeep(result.tree as TTree)

      console.log("add", treeData)

      convertUids?.has(parentUid) ? parentUid = convertUids.get(parentUid) as string : '';
      addNode({ tree: treeData as TTree, targetUid: parentUid, node });
      treeData[node.uid].children = treeData[node.uid].children.map((key) => { return key.replace(uid, node.uid) });
      Object.keys(child).map((key) => {

        const oldChild: TNode = child[key] as TNode
        const newNewUid: string = key.replace(uid, node.uid as string) as string
        treeData[newNewUid] = {
          uid: newNewUid,
          p_uid: oldChild.p_uid?.replace(uid, node.uid) as string,
          name: oldChild.name,
          isEntity: oldChild.isEntity,
          children: oldChild.children.map((old_key) => { return old_key.replace(uid, node.uid as string) }),
          data: oldChild.data,
        }
      })
    })
    return { success: true, tree: treeData as TTree, child: {} }
  } catch (err) {
    return { success: false, error: err as string, child: {} }
  } */
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
  if (type === "html")
    return parseHtml(content)
  return {}
}

/**
 * searialize file api
 * this api searializes the file content based on the type and tree data
 */
export const serializeFile = ({ type, tree }: TSearializeFilePayload): string => {
  if (type === "html")
    return serializeHtml(tree)
  return ''
}