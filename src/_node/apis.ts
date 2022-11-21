import {
  parseHtml,
  serializeHtml,
} from './html';
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
  TNode,
  TUid,
} from './types';

const _ = require("lodash");

export const generateNodeUID = (PID: string, index: number) => {
  return PID + "_" + index.toString()
}

export const updateUIDs = (PID: TUid, data: TTree) => {
  let convertUIDs = new Map<TUid, TUid>

  const children = data[PID].children.map((cid: TUid, index) => {
    const tid = generateNodeUID(PID, index + 1)
    if (tid !== cid) {
      convertUIDs.set(cid, tid)
    }
    return tid
  })
  let newData: TTree = {}
  Object.keys(data).sort().map((uid) => {
    let flag = false
    convertUIDs.forEach((newUID, oldUID) => {
      if (uid.startsWith(oldUID) == true) {
        const newCID = uid.replace(oldUID, newUID)

        newData[newCID] = _.cloneDeep(data[uid]);
        // oldUID
        delete data[uid]
        newData[newCID].uid = newCID
        if ((newData[newCID].p_uid as string).startsWith(oldUID))
          newData[newCID].p_uid = (newData[newCID].p_uid as string).replace(oldUID, newUID)
        console.log("children:", newData[newCID].children, "old:", uid, "new", newCID)
        newData[newCID].children = newData[newCID].children.map((item) => {
          if (item.startsWith(uid))
            item = item.replace(uid, newCID)
          return item
        })
        flag = true
      }
    })
    if (flag == false) {
      newData[uid] = _.cloneDeep(data[uid]);
    }
  })
  newData[PID].children = children
  console.log("newData:", newData)
  return {
    data: newData,
    convertUIDs: convertUIDs
  }
}
/**
 * add node api
 * this api adds the node just child of the target node in the tree
 */
export const addNode = ({ tree, targetUid, node }: TAddNodePayload): TNodeApiRes => {
  try {
    /* target validate */
    const target = tree[targetUid]
    if (target === undefined) {
      throw 'invalid target'
    }

    /* parent validate */
    console.log("node:", node, "tree:", tree)
    node.p_uid = targetUid
    node.uid = generateNodeUID(targetUid, tree[targetUid].children.length as number + 1)
    target.children.push(node.uid)
    /* set parent uid of the node and add it to the tree */
    tree[node.uid] = node
  } catch (err) {
    return { success: false, error: err as string, child: {} }
  }

  return { success: true, child: {} }
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
 * remove node api
 * this api removes the nodes from the tree based on the node uids
 */
export const removeNode = ({ tree, nodeUids, deleted }: TRemoveNodePayload): TNodeApiRes => {
  try {
    // get removeable uids, only parent 
    let removeUids: TUid[] = getParentUids(nodeUids);
    // remove uids and it's desendent from tree
    let p_uids: TUid[] = []
    let child: TTree = {};
    let convertUIDs = new Map<TUid, TUid>
    console.log(removeUids, p_uids)
    removeUids.map((uid) => {
      Object.keys(tree).sort((a: string, b: string) => { return a > b ? -1 : a < b ? 1 : 0; }).map((key) => {
        console.log("key:", key, "uid:", uid)
        if (key === uid) {
          p_uids.push(tree[key].p_uid as string)
        }
        if (key.startsWith(uid)) {
          const p_uid = tree[key].p_uid
          child[key] = _.cloneDeep(tree[key])
          let parent = tree[p_uid as string]
          if (deleted == false || key === uid)
            parent.children = parent.children.filter((x) => { return x !== key })
          delete tree[key]
        }
      })
    })
    console.log(removeUids, p_uids)
    p_uids.map((uid) => {
      const result = updateUIDs(uid, tree)
      tree = _.cloneDeep(result.data)
      if (deleted == true) 
        convertUIDs = result.convertUIDs
    })
    return { success: true, tree: tree, child: child, convertUIDs }
  } catch (err) {
    return { success: false, error: err as string, child: {} }
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
    return { success: false, error: err as string, child: {} }
  }
  return { success: true, child: {} }
}

/**
 * move(cut & paste) node api
 * this api moves the nodes inside the parent node
 */
export const moveNode = ({ tree, isBetween, parentUid, position, uids }: TMoveNodePayload): TNodeApiRes => {
  try {
    console.log(tree, parentUid, uids)
    let treeData: TTree = tree;
    uids.map((uid) => {
      let node = _.cloneDeep(tree[uid])

      const result = removeNode({ tree: treeData, nodeUids: [uid], deleted: true})
      console.log(result)
      let child: TTree = result.child
      const convertUIDs = result.convertUIDs
      treeData = _.cloneDeep(result.tree as TTree)

      console.log("add", treeData)
      
      convertUIDs?.has(parentUid) ? parentUid = convertUIDs.get(parentUid) as string : '';
      addNode({ tree: treeData as TTree, targetUid: parentUid, node });
      treeData[node.uid].children = treeData[node.uid].children.map((key) => { return key.replace(uid, node.uid)});
      Object.keys(child).map((key) => {

        const oldChild: TNode = child[key] as TNode
        const newNewUID: string = key.replace(uid, node.uid as string) as string
        treeData[newNewUID] = {
          uid: newNewUID,
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
  }

}

/**
 * duplicate(copy & paste) node api
 * this api duplicates the nodes inside the parent node
 */
export const duplicateNode = ({ tree, isBetween, parentUid, position, nodes }: TDuplicateNodePayload): TNodeApiRes => {
  try {

  } catch (err) {
    return { success: false, error: err as string, child: {} }
  }
  return { success: true, child: {} }
}

/**
 * parse file api
 * this api parses the file content based on the type and return the tree data
 */
export const parseFile = ({ type, content }: TParseFilePayload): TTree => {
  if (type === "html")
    return parseHtml(content);
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