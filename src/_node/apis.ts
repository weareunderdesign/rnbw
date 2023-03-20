import {
  NodeUidSplitter,
  RootNodeUid,
} from '@_constants/main';
import { TOsType } from '@_types/global';

import {
  addFormatTextAfterNode,
  addFormatTextBeforeNode,
  indentNode,
  setHtmlNodeInAppAttribName,
  THtmlNodeData,
} from './html';
import {
  TNode,
  TNodeApiResponse,
  TNodeTreeContext,
  TNodeTreeData,
  TNodeUid,
} from './types';

export const getSubNodeUidsByBfs = (uid: TNodeUid, tree: TNodeTreeData, withItSelf: boolean = true): TNodeUid[] => {
  const subUids: TNodeUid[] = []

  const uids = [uid]
  while (uids.length) {
    const subUid = uids.shift() as TNodeUid
    const subNode = tree[subUid]
    subUids.push(subUid)
    uids.push(...subNode.children)
  }

  !withItSelf && subUids.shift()

  return subUids
}
export const getSubNodeUidsByDfs = (uid: TNodeUid, tree: TNodeTreeData, withItSelf: boolean = true): TNodeUid[] => {
  const subUids: TNodeUid[] = []

  const uids = [uid]
  while (uids.length) {
    const subUid = uids.shift() as TNodeUid
    const subNode = tree[subUid]
    subUids.push(subUid)
    uids.splice(0, 0, ...subNode.children)
  }

  !withItSelf && subUids.shift()

  return subUids
}
export const getPrevNodeUid = (tree: TNodeTreeData, node: TNode): TNodeUid => {
  let beforeUid: TNodeUid = ''

  const parentNode = tree[node.parentUid as TNodeUid]
  for (const uid of parentNode.children) {
    if (uid === node.uid) break
    beforeUid = uid
  }

  return beforeUid
}
export const getNodeChildIndex = (parentNode: TNode, node: TNode): number => {
  let childIndex = 0

  for (const uid of parentNode.children) {
    if (uid === node.uid) break
    ++childIndex
  }

  return childIndex
}
export const getNodeDepth = (tree: TNodeTreeData, uid: TNodeUid): number => {
  let nodeDepth = 0, node = tree[uid]

  while (node.uid !== RootNodeUid) {
    node = tree[node.parentUid as TNodeUid]
    ++nodeDepth
  }

  return nodeDepth
}
export const getValidNodeUids = (tree: TNodeTreeData, uids: TNodeUid[], targetUid?: TNodeUid): TNodeUid[] => {
  const validatedUids: { [uid: TNodeUid]: boolean } = {}

  // validate collection
  uids.map((uid) => {
    // remove parent uids
    let parentNode = tree[uid]
    while (parentNode.uid !== RootNodeUid) {
      parentNode = tree[parentNode.parentUid as TNodeUid]
      delete validatedUids[parentNode.uid]
    }

    // remove nested uids
    Object.keys(validatedUids).map((validatedUid) => {
      let validatedNode = tree[validatedUid]
      while (validatedNode.uid !== RootNodeUid) {
        validatedNode = tree[validatedNode.parentUid as TNodeUid]
        if (validatedNode.uid === uid) {
          delete validatedUids[validatedUid]
          break
        }
      }
    })

    // add current uid
    validatedUids[uid] = true
  })

  // validate target
  if (targetUid) {
    let targetNode = tree[targetUid]
    while (targetNode.uid !== RootNodeUid) {
      targetNode = tree[targetNode.parentUid as TNodeUid]
      delete validatedUids[targetNode.uid]
    }
  }

  return Object.keys(validatedUids)
}

export const addNode = (tree: TNodeTreeData, targetUid: TNodeUid, node: TNode, treeType: TNodeTreeContext, nodeMaxUid: TNodeUid, osType: TOsType, tabSize: number): TNodeApiResponse => {
  let _nodeMaxUid = Number(nodeMaxUid)

  // update parent
  const targetNode = tree[targetUid]
  const parentNode = tree[targetNode.parentUid as TNodeUid]
  const position = getNodeChildIndex(parentNode, targetNode) + 1
  parentNode.children.splice(position, 0, node.uid)
  parentNode.isEntity = false

  // add node
  tree[node.uid] = node

  if (treeType === 'html') {
    // format node
    addFormatTextBeforeNode(tree, node, String(++_nodeMaxUid) as TNodeUid, osType, tabSize)
  } else {
    // do nothing
  }

  return { tree, nodeMaxUid: String(_nodeMaxUid) as TNodeUid }
}
export const removeNode = (tree: TNodeTreeData, uids: TNodeUid[], treeType: TNodeTreeContext): TNodeApiResponse => {
  const deletedUids: TNodeUid[] = []

  uids.map((uid) => {
    const node = tree[uid]
    const parentNode = tree[node.parentUid as TNodeUid]

    if (treeType === 'html') {
      // remove prev format text node
      const prevNodeUid = getPrevNodeUid(tree, node)
      if (prevNodeUid !== '') {
        const prevNode = tree[prevNodeUid]
        if ((prevNode.data as THtmlNodeData).isFormatText) {
          delete tree[prevNodeUid]
          parentNode.children = parentNode.children.filter(childUid => childUid !== prevNodeUid)
        }
      }
    } else {
      // do nothing
    }

    // update parent
    parentNode.children = parentNode.children.filter(c_uid => c_uid !== uid)
    parentNode.isEntity = parentNode.children.length === 0

    // remove nest nodes
    const subUids = getSubNodeUidsByBfs(uid, tree)
    subUids.map((subUid) => {
      delete tree[subUid]
    })

    deletedUids.push(...subUids)
  })

  return { tree, deletedUids }
}
export const copyNode = (tree: TNodeTreeData, targetUid: TNodeUid, isBetween: boolean, position: number, uids: TNodeUid[], treeType: TNodeTreeContext, nodeMaxUid: TNodeUid, osType: TOsType, tabSize: number): TNodeApiResponse => {
  let _nodeMaxUid = Number(nodeMaxUid)

  const targetNode = tree[targetUid]
  const targetNodeDepth = getNodeDepth(tree, targetUid)

  const addedUidMap = new Map<TNodeUid, TNodeUid>()

  const _uids = [...uids]
  _uids.reverse()
  _uids.map((uid) => {
    const node = tree[uid]
    const orgSubNodeUids = getSubNodeUidsByBfs(uid, tree)

    // copy root node
    const newUid = String(++_nodeMaxUid) as TNodeUid

    const newNode = JSON.parse(JSON.stringify(node)) as TNode
    const parentNodeDepth = getNodeDepth(tree, newNode.parentUid as TNodeUid)

    newNode.uid = newUid
    newNode.parentUid = targetUid

    if (treeType === 'html') {
      setHtmlNodeInAppAttribName(newNode, newUid)
    } else {
      // do nothing
    }

    // add root node
    if (isBetween) {
      let inserted = false, index = -1

      targetNode.children = targetNode.children.reduce((prev, cur) => {
        tree[cur].data.valid && index++
        if (index === position && !inserted) {
          inserted = true
          prev.push(newUid)
        }

        prev.push(cur)
        return prev
      }, [] as TNodeUid[])

      !inserted && targetNode.children.push(newUid)
    } else {
      targetNode.children.push(newUid)
    }

    // copy sub nodes
    const subNodes = [newNode]
    let index = -1
    while (subNodes.length) {
      const subNode = subNodes.shift() as TNode

      addedUidMap.set(orgSubNodeUids[++index], subNode.uid)

      subNode.children = subNode.children.map((childUid) => {
        const newChildUid = String(++_nodeMaxUid) as string

        const childNode = JSON.parse(JSON.stringify(tree[childUid])) as TNode

        childNode.uid = newChildUid
        childNode.parentUid = subNode.uid

        if (treeType === 'html') {
          setHtmlNodeInAppAttribName(childNode, newChildUid)
        } else {
          // do nothing
        }

        subNodes.push(childNode)

        return newChildUid
      })

      tree[subNode.uid] = subNode
    }

    // format node
    if (treeType === 'html') {
      addFormatTextBeforeNode(tree, newNode, String(++_nodeMaxUid) as TNodeUid, osType, tabSize)
      addFormatTextAfterNode(tree, newNode, String(++_nodeMaxUid) as TNodeUid, osType, tabSize)

      targetNodeDepth !== parentNodeDepth && indentNode(tree, newNode, (targetNodeDepth - parentNodeDepth) * tabSize, osType)
    }
  })

  return { tree, nodeMaxUid: String(_nodeMaxUid) as TNodeUid, addedUidMap }
}
export const moveNode = (tree: TNodeTreeData, targetUid: TNodeUid, isBetween: boolean, position: number, uids: TNodeUid[], treeType: TNodeTreeContext, nodeMaxUid: TNodeUid, osType: TOsType, tabSize: number): TNodeApiResponse => {
  let _nodeMaxUid = Number(nodeMaxUid)

  const targetNode = tree[targetUid]
  const targetNodeDepth = getNodeDepth(tree, targetUid)

  const _uids = [...uids]
  _uids.reverse()
  _uids.map((uid) => {
    const node = tree[uid]

    const parentNode = tree[node.parentUid as TNodeUid]
    const parentNodeDepth = getNodeDepth(tree, parentNode.uid)

    // get valid position
    let validChildIndex = 0
    if (parentNode.uid === targetUid) {
      for (const childUid of parentNode.children) {
        if (childUid === uid) break
        tree[childUid].data.valid && ++validChildIndex
      }
    }

    if (treeType === 'html') {
      // remove prev format text node
      const prevNodeUid = getPrevNodeUid(tree, node)
      if (prevNodeUid !== '') {
        const prevNode = tree[prevNodeUid]
        if ((prevNode.data as THtmlNodeData).isFormatText) {
          delete tree[prevNodeUid]
          parentNode.children = parentNode.children.filter(childUid => childUid !== prevNodeUid)
        }
      }
    } else {
      // do nothing
    }

    // update parent
    parentNode.children = parentNode.children.filter(childUid => childUid !== uid)
    parentNode.isEntity = parentNode.children.length === 0

    // add to target
    node.parentUid = targetUid
    targetNode.isEntity = false

    if (isBetween) {
      const _position = parentNode.uid === targetUid && validChildIndex < position ? position - 1 : position
      let inserted = false, index = -1

      targetNode.children = targetNode.children.reduce((prev, cur) => {
        tree[cur].data.valid && ++index
        if (index === _position && !inserted) {
          inserted = true
          prev.push(uid)
        }

        prev.push(cur)
        return prev
      }, [] as TNodeUid[])

      !inserted && targetNode.children.push(uid)
    } else {
      targetNode.children.push(uid)
    }

    // format node
    if (treeType === 'html') {
      addFormatTextBeforeNode(tree, node, String(++_nodeMaxUid) as TNodeUid, osType, tabSize)
      addFormatTextAfterNode(tree, node, String(++_nodeMaxUid) as TNodeUid, osType, tabSize)

      targetNodeDepth !== parentNodeDepth && indentNode(tree, node, (targetNodeDepth - parentNodeDepth) * tabSize, osType)
    }
  })

  return { tree, nodeMaxUid: String(_nodeMaxUid) as TNodeUid }
}
export const duplicateNode = (tree: TNodeTreeData, uids: TNodeUid[], treeType: TNodeTreeContext, nodeMaxUid: TNodeUid, osType: TOsType, tabSize: number): TNodeApiResponse => {
  let _nodeMaxUid = Number(nodeMaxUid)

  const addedUidMap = new Map<TNodeUid, TNodeUid>()

  uids.map((uid) => {
    const node = tree[uid]
    const parentNode = tree[node.parentUid as TNodeUid]
    const orgSubNodeUids = getSubNodeUidsByBfs(uid, tree)

    // duplicate root node
    const newUid = String(++_nodeMaxUid) as TNodeUid
    const newNode = JSON.parse(JSON.stringify(tree[uid])) as TNode
    newNode.uid = newUid

    if (treeType === 'html') {
      setHtmlNodeInAppAttribName(newNode, newUid)
    } else {
      // do nothing
    }

    // update parent
    const position = getNodeChildIndex(parentNode, node) + 1
    parentNode.children.splice(position, 0, newUid)

    // duplicate sub nodes
    const subNodes = [newNode]
    let index = -1
    while (subNodes.length) {
      const subNode = subNodes.shift() as TNode

      addedUidMap.set(orgSubNodeUids[++index], subNode.uid)

      subNode.children = subNode.children.map((childUid) => {
        const newChildUid = String(++_nodeMaxUid) as string

        const childNode = JSON.parse(JSON.stringify(tree[childUid])) as TNode

        childNode.uid = newChildUid
        childNode.parentUid = subNode.uid

        if (treeType === 'html') {
          setHtmlNodeInAppAttribName(childNode, newChildUid)
        } else {
          // do nothing
        }

        subNodes.push(childNode)

        return newChildUid
      })

      tree[subNode.uid] = subNode
    }

    // format node
    if (treeType === 'html') {
      addFormatTextBeforeNode(tree, newNode, String(++_nodeMaxUid) as TNodeUid, osType, tabSize)
    }
  })

  return { tree, nodeMaxUid: String(_nodeMaxUid) as TNodeUid, addedUidMap }
}

export const generateNodeUid = (parentUid: TNodeUid, entryName: string | number): TNodeUid => {
  return `${parentUid}${NodeUidSplitter}${entryName}`
}
export const getParentNodeUid = (uid: TNodeUid): TNodeUid => {
  const uidArr = uid.split(NodeUidSplitter)
  uidArr.pop()
  return uidArr.join(NodeUidSplitter)
}
export const getNodeEntryName = (uid: TNodeUid): string => {
  const uidArr = uid.split(NodeUidSplitter)
  const entryName = uidArr.pop()
  return entryName || ''
}
