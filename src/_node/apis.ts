import {
  NodeUidSplitter,
  RootNodeUid,
} from '@_constants/main';
import { TOsType } from '@_types/global';
import {
  TFileSystemType,
  TFileType,
} from '@_types/main';

import {
  addFormatTextAfterNode,
  addFormatTextBeforeNode,
  indentNode,
  parseHtml,
  replaceHtmlNodeInAppAttribName,
  serializeHtml,
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
  TResetNodeTreeUidsApiResponse,
} from './types';

/**
 * generate node uid from parent uid and its entry name
 * @param parentUid 
 * @param entryName 
 * @returns 
 */
export const generateNodeUid = (parentUid: TNodeUid, entryName: string | number): TNodeUid => {
  return `${parentUid}${NodeUidSplitter}${entryName}`
}

/**
 * get parent node uid from given uid
 * @param uid 
 * @returns 
 */
export const getParentNodeUid = (uid: TNodeUid): TNodeUid => {
  const uidArr = uid.split(NodeUidSplitter)
  uidArr.pop()
  return uidArr.join(NodeUidSplitter)
}

/**
 * get node entry name from given uid
 * @param uid 
 * @returns 
 */
export const getNodeEntryName = (uid: TNodeUid): string => {
  const uidArr = uid.split(NodeUidSplitter)
  const entryName = uidArr.pop()
  return entryName || ''
}

/**
 * sort the nodes by name-asc based on its context
 * @param _nodes 
 * @param context 
 * @returns 
 */
export const sortNodesByContext = (_nodes: TNode[], fsType: TFileSystemType): TNode[] => {
  let nodes = [..._nodes]

  return fsType === 'local' ? nodes.sort((a, b) => {
    return a.isEntity && !b.isEntity ? 1 :
      !a.isEntity && b.isEntity ? -1 :
        a.name > b.name ? 1 : -1
  }) : nodes
}

/**
 * sort node uids by dfs
 * @param _uids 
 * @returns 
 */
export const sortNodeUidsByDfs = (_uids: TNodeUid[]): TNodeUid[] => {
  let uids = [..._uids]

  return uids.sort((a, b) => {
    if (a === RootNodeUid) return -1
    if (b === RootNodeUid) return 1

    const arr_a = a.split(NodeUidSplitter)
    const arr_b = b.split(NodeUidSplitter)

    for (let index = 1; index < arr_a.length; ++index) {
      const aa = parseInt(arr_a[index])
      const ab = parseInt(arr_b[index] || '0')
      if (aa === ab) continue
      return aa > ab ? 1 : -1
    }

    return -1
  })
}

/**
 * sort node uids by bfs
 * @param _uids 
 * @returns 
 */
export const sortNodeUidsByBfs = (_uids: TNodeUid[]): TNodeUid[] => {
  let uids = [..._uids]

  return uids.sort((a, b) => {
    if (a === RootNodeUid) return -1
    if (b === RootNodeUid) return 1

    const arr_a = a.split(NodeUidSplitter)
    const arr_b = b.split(NodeUidSplitter)

    if (arr_a.length !== arr_b.length) return arr_a.length > arr_b.length ? 1 : -1

    for (let index = 1; index < arr_a.length; ++index) {
      const aa = parseInt(arr_a[index])
      const ab = parseInt(arr_b[index])
      if (aa === ab) continue
      return aa > ab ? 1 : -1
    }

    return 0
  })
}

/**
 * get all of the nested child node uids including itself
 * @param uid 
 * @param tree 
 * @returns 
 */
export const getSubNodeUids = (uid: TNodeUid, tree: TNodeTreeData): TNodeUid[] => {
  let subUids: TNodeUid[] = []

  let uids = [uid]
  while (uids.length) {
    const subUid = uids.shift() as TNodeUid
    subUids.push(subUid)

    const subNode = tree[subUid]
    for (const childUid of subNode.children) {
      uids.push(childUid)
    }
  }

  return subUids
}

/**
 * validate the uid collection - for select, dnd actions in node-tree-view
 * @param uids 
 * @param targetUid 
 * @returns 
 */
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

/**
 * reset all of the node uids in node-tree-view
 * @param tree 
 * @returns 
 */
export const resetNodeTreeUids = (tree: TNodeTreeData, type: TNodeTreeContext): TResetNodeTreeUidsApiResponse => {
  const nodes = [tree[RootNodeUid]]
  const convertedUids = new Map<TNodeUid, TNodeUid>()

  // generate expected uids for nodes
  while (nodes.length) {
    const node = nodes.shift() as TNode
    node.children = node.children.map((childUid, index) => {
      const expectedUid = generateNodeUid(node.uid, index + 1)
      childUid !== expectedUid && convertedUids.set(childUid, expectedUid)

      tree[childUid].parentUid = node.uid
      tree[childUid].uid = expectedUid
      nodes.push(tree[childUid])

      return expectedUid
    })
  }

  // update the tree with convertedUids
  const newTree: TNodeTreeData = {}
  Object.keys(tree).map((uid) => {
    const node = tree[uid]

    if (type === 'html') {
      replaceHtmlNodeInAppAttribName(node, node.uid)
    }

    newTree[node.uid] = node
  })

  return { newTree, convertedUids }
}

/**
 * get prev sibling node uid in the node-tree
 * @param tree 
 * @param node 
 * @returns 
 */
export const getPrevSiblingNodeUid = (tree: TNodeTreeData, node: TNode): TNodeUid => {
  const parentNode = tree[node.parentUid as TNodeUid]
  let beforeUid: TNodeUid = ''
  for (const childUid of parentNode.children) {
    if (childUid === node.uid) break
    beforeUid = childUid
  }
  return beforeUid
}

/**
 * get child-index of the node inside its parent, start z-index is 0
 * @param parentNode 
 * @param node 
 * @returns 
 */
export const getNodeChildIndex = (parentNode: TNode, node: TNode): number => {
  let childIndex = 0
  for (const c_uid of parentNode.children) {
    if (c_uid === node.uid) break
    childIndex++
  }
  return childIndex
}

/**
 * get node's depth from the root node
 * @param uid 
 * @returns 
 */
export const getNodeDepth = (uid: TNodeUid): number => {
  return uid.split(NodeUidSplitter).length - 1
}

/**
 * add node inside target
 * @param tree 
 * @param targetUid 
 * @param node 
 * @param osType 
 * @param treeType 
 * @returns 
 */
export const addNode = (tree: TNodeTreeData, targetUid: TNodeUid, node: TNode, osType: TOsType, treeType: TNodeTreeContext, tabSize: number): TNodeApiResponse => {
  // update tree
  const target = tree[targetUid]
  node.uid = generateNodeUid(targetUid, target.children.length + 1)
  target.children.push(node.uid)
  target.isEntity = false
  node.parentUid = targetUid
  tree[node.uid] = node

  if (treeType === 'html') {
    // add text-format nodes before & after the node
    let uidOffset: number = 0
    let hasOffset: boolean = false
    hasOffset = addFormatTextBeforeNode(tree, node, uidOffset, osType, tabSize)
    hasOffset && uidOffset++
    hasOffset = addFormatTextAfterNode(tree, node, uidOffset, osType, tabSize)
    hasOffset && uidOffset++
  }

  // reset the uids
  const { newTree, convertedUids: _convertedUids } = resetNodeTreeUids(tree, treeType)
  const convertedUids: [TNodeUid, TNodeUid][] = []
  for (const [prev, cur] of _convertedUids) {
    convertedUids.push([prev, cur])
  }
  return { tree: newTree, convertedUids }
}

/**
 * remove nodes from the tree
 * @param tree 
 * @param nodeUids 
 * @param treeType 
 * @returns 
 */
export const removeNode = (tree: TNodeTreeData, nodeUids: TNodeUid[], treeType: TNodeTreeContext): TNodeApiResponse => {
  const deletedUids: TNodeUid[] = []

  nodeUids.map((nodeUid) => {
    const node = tree[nodeUid]
    const parentNode = tree[node.parentUid as TNodeUid]

    if (treeType === 'html') {
      // delete prev format-text-node
      const prevUid = getPrevSiblingNodeUid(tree, node)
      const prevNode = tree[prevUid]
      if (prevNode && (prevNode.data as THtmlNodeData).isFormatText) delete tree[prevUid]

      // update parent
      parentNode.children = parentNode.children.filter(childUid => prevUid === '' || childUid !== prevUid)
    }

    // remove itself from the parent
    parentNode.children = parentNode.children.filter(c_uid => c_uid !== nodeUid)
    parentNode.isEntity = parentNode.children.length === 0

    // delete nested nodes
    const uids = getSubNodeUids(nodeUid, tree)
    uids.map((uid) => {
      delete tree[uid]
    })
    deletedUids.push(...uids)
  })

  // reset the uids
  const { newTree, convertedUids: _convertedUids } = resetNodeTreeUids(tree, treeType)
  const convertedUids: [TNodeUid, TNodeUid][] = []
  for (const [prev, cur] of _convertedUids) {
    convertedUids.push([prev, cur])
  }
  return { tree: newTree, deletedUids, convertedUids }
}

/**
 * mode nodes inside the target
 * @param tree 
 * @param targetUid 
 * @param isBetween 
 * @param position 
 * @param uids 
 * @param osType 
 * @param treeType 
 * @param tabSize 
 * @returns 
 */
export const moveNode = (tree: TNodeTreeData, targetUid: TNodeUid, isBetween: boolean, position: number, uids: TNodeUid[], osType: TOsType, treeType: TNodeTreeContext, tabSize: number): TNodeApiResponse => {
  const targetNode = tree[targetUid]
  const targetNodeDepth = getNodeDepth(targetNode.uid)

  let uidOffset: number = 0
  uids.map((uid) => {
    const node = tree[uid]

    const parentNode = tree[node.parentUid as TNodeUid]
    const parentNodeDepth = getNodeDepth(parentNode.uid)

    let validChildIndex: number = 0
    if (parentNode.uid === targetNode.uid) {
      for (const childUid of targetNode.children) {
        if (childUid === node.uid) break
        tree[childUid].data.valid && validChildIndex++
      }
    }

    if (treeType === 'html') {
      // delete before text format node
      let prevUid = getPrevSiblingNodeUid(tree, node)
      const prevNode = tree[prevUid]
      if (prevNode && (prevNode.data as THtmlNodeData).isFormatText) {
        uidOffset++
        delete tree[prevUid]
      }
      parentNode.children = parentNode.children.filter(childUid => prevUid === '' || childUid !== prevUid)
    }

    // remove itself from parent
    parentNode.children = parentNode.children.filter(childUid => childUid !== uid)
    parentNode.isEntity = parentNode.children.length === 0

    // move node inside target
    node.parentUid = targetUid
    targetNode.isEntity = false

    if (isBetween) {
      // insert the node at the specific position of the parent
      let inserted = false
      let childIndex = position
      parentNode.uid === targetNode.uid && validChildIndex < childIndex && childIndex--

      let index = -1

      targetNode.children = targetNode.children.reduce((prev, cur) => {
        tree[cur].data.valid && index++
        if (index === childIndex && !inserted) {
          inserted = true
          prev.push(uid)
        }
        if (cur === uid) return prev

        prev.push(cur)
        return prev
      }, [] as TNodeUid[])

      !inserted && targetNode.children.push(uid)
    } else {
      targetNode.children.push(uid)
    }

    if (treeType === 'html') {
      // add text-format nodes before & after the node
      let hasOffset: boolean = false
      hasOffset = addFormatTextBeforeNode(tree, node, uidOffset, osType, tabSize)
      hasOffset && uidOffset++
      hasOffset = addFormatTextAfterNode(tree, node, uidOffset, osType, tabSize)
      hasOffset && uidOffset++

      // indent the nodes
      if (targetNodeDepth !== parentNodeDepth) indentNode(tree, node, tabSize * (targetNodeDepth - parentNodeDepth), osType)
    }
  })

  // reset the uids
  const { newTree, convertedUids: _convertedUids } = resetNodeTreeUids(tree, treeType)
  const convertedUids: [TNodeUid, TNodeUid][] = []
  for (const [prev, cur] of _convertedUids) {
    convertedUids.push([prev, cur])
  }
  return { tree: newTree, convertedUids }
}

/**
 * copy the nodes and paste them inside the target node
 * @param tree 
 * @param targetUid 
 * @param isBetween 
 * @param position 
 * @param uids 
 * @param osType 
 * @param treeType 
 * @param tabSize 
 * @returns 
 */
export const copyNode = (tree: TNodeTreeData, targetUid: TNodeUid, isBetween: boolean, position: number, uids: TNodeUid[], osType: TOsType, treeType: TNodeTreeContext, tabSize: number): TNodeApiResponse => {
  const targetNode = tree[targetUid]
  const targetNodeDepth = getNodeDepth(targetNode.uid)

  let uidOffset = 0
  uids.map((uid) => {
    // duplicate root-node
    const newNode: TNode = JSON.parse(JSON.stringify(tree[uid]))
    const parentNodeDepth = getNodeDepth(newNode.parentUid as TNodeUid)
    const newUid = generateNodeUid(targetUid, targetNode.children.length + 1 + uidOffset)
    if (treeType === 'html') {
      replaceHtmlNodeInAppAttribName(newNode, newUid)
    }
    newNode.uid = newUid
    newNode.parentUid = targetUid
    if (isBetween) {
      // insert the node at the specific position of the parent
      let inserted = false
      let childIndex = position

      let index = -1

      targetNode.children = targetNode.children.reduce((prev, cur) => {
        tree[cur].data.valid && index++
        if (index === childIndex && !inserted) {
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

    // duplicate sub nodes and add them to tree
    const nodes = [newNode]
    while (nodes.length) {
      const node = nodes.shift() as TNode
      node.children = node.children.map((childUid, childIndex) => {
        const childNode = JSON.parse(JSON.stringify(tree[childUid]))
        const newChildUid = generateNodeUid(node.uid, childIndex + 1)
        if (treeType === 'html') {
          replaceHtmlNodeInAppAttribName(childNode, newChildUid)
        }
        childNode.uid = newChildUid
        childNode.parentUid = node.uid
        nodes.push(childNode)
        return newChildUid
      })
      tree[node.uid] = node
    }

    if (treeType === 'html') {
      // add format text nodes before and after the "uid-node"
      let hasOffset: boolean = false
      hasOffset = addFormatTextBeforeNode(tree, newNode, uidOffset, osType, tabSize)
      hasOffset && uidOffset++
      hasOffset = addFormatTextAfterNode(tree, newNode, uidOffset, osType, tabSize)
      hasOffset && uidOffset++

      // indent the nodes
      if (targetNodeDepth !== parentNodeDepth) indentNode(tree, newNode, tabSize * (targetNodeDepth - parentNodeDepth), osType)
    }
  })

  // reset the uids
  const { newTree, convertedUids: _convertedUids } = resetNodeTreeUids(tree, treeType)
  const convertedUids: [TNodeUid, TNodeUid][] = []
  for (const [prev, cur] of _convertedUids) {
    convertedUids.push([prev, cur])
  }
  return { tree: newTree, convertedUids }
}

/**
 * duplicate the current node inside its parent
 * @param tree 
 * @param uids 
 * @param osType 
 * @param treeType 
 * @param tabSize 
 * @returns 
 */
export const duplicateNode = (tree: TNodeTreeData, uids: TNodeUid[], osType: TOsType, treeType: TNodeTreeContext, tabSize: number): TNodeApiResponse => {
  const uidOffset: {
    [parentNodeUid: TNodeUid]: number
  } = {}
  uids.map((uid) => {
    const node = tree[uid]

    // insert the duplicated node to the parent
    const parentNode = tree[node.parentUid as TNodeUid]
    uidOffset[parentNode.uid] === undefined ? uidOffset[parentNode.uid] = 0 : null
    let newUid: TNodeUid = ''
    parentNode.children = parentNode.children.reduce((prev, cur) => {
      prev.push(cur)
      if (cur === node.uid) {
        newUid = generateNodeUid(parentNode.uid, parentNode.children.length + 1 + uidOffset[parentNode.uid])
        prev.push(newUid)
      }
      return prev
    }, [] as TNodeUid[])

    // duplicate sub nodes and add them to the tree
    const subUids = getSubNodeUids(node.uid, tree)
    subUids.map((subUid) => {
      const newSubUid = newUid + subUid.slice(node.uid.length)
      const subNode = tree[subUid]
      tree[newSubUid] = {
        uid: newSubUid,
        parentUid: subNode.parentUid !== parentNode.uid ? newUid + subNode.parentUid?.slice(node.uid.length) : parentNode.uid,
        name: subNode.name,
        isEntity: subNode.isEntity,
        children: subNode.children.map(childUid => newUid + childUid.slice(node.uid.length)),
        data: subNode.data,
      }
    })

    if (treeType === 'html') {
      let hasOffset: boolean = false
      // add format-text-node before the duplicated node
      hasOffset = addFormatTextBeforeNode(tree, tree[newUid], uidOffset[parentNode.uid], osType, tabSize)
      hasOffset && uidOffset[parentNode.uid]++
    }
  })

  // reset the uids
  const { newTree, convertedUids: _convertedUids } = resetNodeTreeUids(tree, treeType)
  const convertedUids: [TNodeUid, TNodeUid][] = []
  for (const [prev, cur] of _convertedUids) {
    convertedUids.push([prev, cur])
  }
  return { tree: newTree, convertedUids }
}

/**
 * update node's data
 * @param tree 
 * @param uid 
 * @param data 
 */
export const updateNode = (tree: TNodeTreeData, uid: TNodeUid, data: any) => {
  tree[uid].data = data
}

/**
 * overwrite node with given node
 * @param tree 
 * @param node 
 */
export const replaceNode = (tree: TNodeTreeData, node: TNode) => {
  tree[node.uid] = node
}

/**
 * parse file content
 * @param type 
 * @param content 
 * @param referenceData 
 * @param osType 
 * @returns 
 */
export const parseFile = (type: TFileType, content: string, referenceData: TNodeReferenceData, osType: TOsType): TFileParserResponse => {
  if (type === "html") {
    return parseHtml(content, referenceData as THtmlReferenceData, osType)
  } else {
    return {
      formattedContent: '',
      tree: {},
    }
  }
}

/**
 * serialize file content from the tree
 * @param type 
 * @param tree 
 * @param referenceData 
 * @returns 
 */
export const serializeFile = (type: TFileType, tree: TNodeTreeData, referenceData: TNodeReferenceData): string => {
  if (type === "html") {
    const { html } = serializeHtml(tree, referenceData as THtmlReferenceData)
    return html
  }
  return ''
}