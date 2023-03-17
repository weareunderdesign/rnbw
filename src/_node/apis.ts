import {
  NodeUidSplitter,
  RootNodeUid,
} from '@_constants/main';
import { TOsType } from '@_types/global';
import { TFileType } from '@_types/main';

import {
  addFormatTextAfterNode,
  addFormatTextBeforeNode,
  indentNode,
  parseHtml,
  serializeHtml,
  setHtmlNodeInAppAttribName,
  THtmlNodeData,
  THtmlReferenceData,
} from './html';
import {
  TFileParserResponse,
  TNode,
  TNodeApiResponse,
  TNodeReferenceData,
  TNodeTreeContext,
  TNodeTreeData,
  TNodeUid,
} from './types';

export const getSubNodeUidsByBfs = (uid: TNodeUid, tree: TNodeTreeData): TNodeUid[] => {
  if (!tree[uid]) return []

  let subUids: TNodeUid[] = []

  let uids = [uid]
  while (uids.length) {
    const subUid = uids.shift() as TNodeUid
    subUids.push(subUid)

    const subNode = tree[subUid]
    uids.push(...subNode.children)
  }

  return subUids
}
export const getSubNodeUidsByDfs = (uid: TNodeUid, tree: TNodeTreeData): TNodeUid[] => {
  if (!tree[uid]) return []

  let subUids: TNodeUid[] = []

  let uids = [uid]
  while (uids.length) {
    const subUid = uids.shift() as TNodeUid
    subUids.push(subUid)

    const subNode = tree[subUid]
    uids.splice(0, 0, ...subNode.children)
  }

  return subUids
}
export const getPrevSiblingNodeUid = (tree: TNodeTreeData, node: TNode): TNodeUid => {
  const parentNode = tree[node.parentUid as TNodeUid]
  let beforeUid: TNodeUid = ''
  for (const childUid of parentNode.children) {
    if (childUid === node.uid) break
    beforeUid = childUid
  }
  return beforeUid
}
export const parseFile = (type: TFileType, content: string, referenceData: TNodeReferenceData, osType: TOsType): TFileParserResponse => {
  if (type === 'html') {
    return parseHtml(content, referenceData as THtmlReferenceData, osType)
  } else {
    return {
      formattedContent: '',
      contentInApp: '',
      tree: {},
      nodeMaxUid: '0',
      info: null,
    }
  }
}
export const serializeFile = (type: TFileType, tree: TNodeTreeData, referenceData: TNodeReferenceData): string => {
  if (type === 'html') {
    const { html } = serializeHtml(tree, referenceData as THtmlReferenceData)
    return html
  }
  return ''
}
export const addNode = (tree: TNodeTreeData, targetUid: TNodeUid, node: TNode, treeType: TNodeTreeContext, nodeMaxUid: TNodeUid, osType: TOsType, tabSize: number): TNodeApiResponse => {
  let _nodeMaxUid = Number(nodeMaxUid)

  // update parent
  const parentNode = tree[node.parentUid as TNodeUid]
  const position = getNodeChildIndex(parentNode, tree[targetUid]) + 1

  let inserted = false
  let index = -1

  parentNode.children = parentNode.children.reduce((prev, cur) => {
    ++index
    if (index === position && !inserted) {
      inserted = true
      prev.push(node.uid)
    }

    prev.push(cur)
    return prev
  }, [] as TNodeUid[])

  !inserted && parentNode.children.push(node.uid)

  // add node
  tree[node.uid] = node

  // format node
  if (treeType === 'html') {
    addFormatTextBeforeNode(tree, node, String(++_nodeMaxUid) as TNodeUid, osType, tabSize)
  }

  return { tree, nodeMaxUid: String(_nodeMaxUid) as TNodeUid }
}
export const removeNode = (tree: TNodeTreeData, nodeUids: TNodeUid[], treeType: TNodeTreeContext): TNodeApiResponse => {
  const deletedUids: TNodeUid[] = []

  nodeUids.map((nodeUid) => {
    const node = tree[nodeUid]
    if (!node) return

    const parentNode = tree[node.parentUid as TNodeUid]

    if (treeType === 'html') {
      // remove prev format-text-node
      const prevUid = getPrevSiblingNodeUid(tree, node)
      const prevNode = tree[prevUid]
      if (prevNode && (prevNode.data as THtmlNodeData).isFormatText) {
        delete tree[prevUid]
        parentNode.children = parentNode.children.filter(childUid => childUid !== prevUid)
      }
    }

    // remove itself from the parent
    parentNode.children = parentNode.children.filter(c_uid => c_uid !== nodeUid)
    parentNode.isEntity = parentNode.children.length === 0

    // delete nested nodes
    const uids = getSubNodeUidsByBfs(nodeUid, tree)
    uids.map((uid) => {
      delete tree[uid]
    })
    deletedUids.push(...uids)
  })

  return { tree, deletedUids }
}
export const copyNode = (tree: TNodeTreeData, targetUid: TNodeUid, isBetween: boolean, position: number, uids: TNodeUid[], treeType: TNodeTreeContext, nodeMaxUid: TNodeUid, osType: TOsType, tabSize: number): TNodeApiResponse => {
  let _nodeMaxUid = Number(nodeMaxUid)

  const targetNode = tree[targetUid]
  const targetNodeDepth = getNodeDepth(tree, targetNode.uid)

  uids.map((uid) => {
    // copy root node
    const newUid = String(++_nodeMaxUid) as TNodeUid

    const newNode = JSON.parse(JSON.stringify(tree[uid])) as TNode
    const parentNodeDepth = getNodeDepth(tree, newNode.parentUid as TNodeUid)

    newNode.uid = newUid
    newNode.parentUid = targetUid
    if (treeType === 'html') {
      setHtmlNodeInAppAttribName(newNode, newUid)
    }

    if (isBetween) {
      let inserted = false
      let index = -1

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
    const nodes = [newNode]
    while (nodes.length) {
      const node = nodes.shift() as TNode
      node.children = node.children.map((childUid) => {
        const newChildUid = String(++_nodeMaxUid) as string

        const childNode = JSON.parse(JSON.stringify(tree[childUid])) as TNode
        childNode.uid = newChildUid
        childNode.parentUid = node.uid
        if (treeType === 'html') {
          setHtmlNodeInAppAttribName(childNode, newChildUid)
        }

        nodes.push(childNode)

        return newChildUid
      })

      tree[node.uid] = node
    }

    // format node
    if (treeType === 'html') {
      addFormatTextBeforeNode(tree, newNode, String(++_nodeMaxUid) as TNodeUid, osType, tabSize)
      addFormatTextAfterNode(tree, newNode, String(++_nodeMaxUid) as TNodeUid, osType, tabSize)

      targetNodeDepth !== parentNodeDepth && indentNode(tree, newNode, (targetNodeDepth - parentNodeDepth) * tabSize, osType)
    }
  })

  return { tree, nodeMaxUid: String(_nodeMaxUid) as TNodeUid }
}
export const moveNode = (tree: TNodeTreeData, targetUid: TNodeUid, isBetween: boolean, position: number, uids: TNodeUid[], treeType: TNodeTreeContext, nodeMaxUid: TNodeUid, osType: TOsType, tabSize: number): TNodeApiResponse => {
  let _nodeMaxUid = Number(nodeMaxUid)

  const targetNode = tree[targetUid]
  const targetNodeDepth = getNodeDepth(tree, targetNode.uid)

  uids.map((uid) => {
    const node = tree[uid]

    const parentNode = tree[node.parentUid as TNodeUid]
    const parentNodeDepth = getNodeDepth(tree, parentNode.uid)

    let validChildIndex: number = 0
    if (parentNode.uid === targetNode.uid) {
      for (const childUid of targetNode.children) {
        if (childUid === node.uid) break
        tree[childUid].data.valid && validChildIndex++
      }
    }

    // remove prev format text node
    if (treeType === 'html') {
      const prevUid = getPrevSiblingNodeUid(tree, node)
      const prevNode = tree[prevUid]
      if (prevNode && (prevNode.data as THtmlNodeData).isFormatText) {
        delete tree[prevUid]
        parentNode.children = parentNode.children.filter(childUid => childUid !== prevUid)
      }
    }

    // remove from parent
    parentNode.children = parentNode.children.filter(childUid => childUid !== uid)
    parentNode.isEntity = parentNode.children.length === 0

    // add to target
    node.parentUid = targetUid
    targetNode.isEntity = false

    if (isBetween) {
      let inserted = false
      let index = -1
      const childIndex = parentNode.uid === targetNode.uid && validChildIndex < position ? position - 1 : position

      targetNode.children = targetNode.children.reduce((prev, cur) => {
        tree[cur].data.valid && index++
        if (index === childIndex && !inserted) {
          inserted = true
          prev.push(uid)
        }

        cur !== uid && prev.push(cur)
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

  uids.map((uid) => {
    // duplicate root node
    const newUid = String(++_nodeMaxUid) as TNodeUid
    const newNode = JSON.parse(JSON.stringify(tree[uid])) as TNode

    newNode.uid = newUid
    if (treeType === 'html') {
      setHtmlNodeInAppAttribName(newNode, newUid)
    }

    const parentNode = tree[newNode.parentUid as TNodeUid]
    parentNode.children = parentNode.children.reduce((prev, cur) => {
      prev.push(cur)
      if (cur === uid) {
        prev.push(newUid)
      }
      return prev
    }, [] as TNodeUid[])

    // duplicate sub nodes
    const nodes = [newNode]
    while (nodes.length) {
      const node = nodes.shift() as TNode

      node.children = node.children.map((childUid) => {
        const newChildUid = String(++_nodeMaxUid) as string

        const childNode = JSON.parse(JSON.stringify(tree[childUid])) as TNode
        childNode.uid = newChildUid
        childNode.parentUid = node.uid
        if (treeType === 'html') {
          setHtmlNodeInAppAttribName(childNode, newChildUid)
        }

        nodes.push(childNode)

        return newChildUid
      })

      tree[node.uid] = node
    }

    // format node
    if (treeType === 'html') {
      addFormatTextBeforeNode(tree, newNode, String(++_nodeMaxUid) as TNodeUid, osType, tabSize)
    }
  })

  return { tree, nodeMaxUid: String(_nodeMaxUid) as TNodeUid }
}
export const getNodeChildIndex = (parentNode: TNode, childNode: TNode): number => {
  let childIndex = 0
  for (const c_uid of parentNode.children) {
    if (c_uid === childNode.uid) break
    childIndex++
  }
  return childIndex
}
export const getNodeDepth = (tree: TNodeTreeData, uid: TNodeUid): number => {
  let node = tree[uid]
  let nodeDepth = 0
  while (node.uid !== RootNodeUid) {
    node = tree[node.parentUid as TNodeUid]
    ++nodeDepth
  }
  return nodeDepth
}














export const validateNodeUidCollection = (uids: TNodeUid[], targetUid?: TNodeUid): TNodeUid[] => {
  let _uids = [...uids]
  const validatedUids: {
    [uid: TNodeUid]: boolean
  } = {}

  // validate the uids generally
  _uids.map((uid) => {
    const uidArr = uid.split(NodeUidSplitter)

    // remove parent uids
    let _uid: TNodeUid = ''
    uidArr.map((_arr) => {
      _uid += `${_uid === '' ? '' : NodeUidSplitter}${_arr}`
      if (validatedUids[_uid]) delete validatedUids[_uid]
    })

    // remove nested uids
    Object.keys(validatedUids).map((validatedUid) => {
      if (validatedUid.startsWith(uid)) delete validatedUids[validatedUid]
    })

    // add current uid
    validatedUids[uid] = true
  })

  _uids = Object.keys(validatedUids)

  // validate uids for dnd action
  if (targetUid) {
    _uids = _uids.filter((uid) => {
      return !targetUid.startsWith(uid)
    })
  }

  return _uids
}
