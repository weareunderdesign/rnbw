import { TOS } from '@_types/main';

import {
  parseHtml,
  serializeHtml,
  THtmlParserResponse,
  THtmlReferenceData,
} from './html';
import {
  TAddNodePayload,
  TCopyNodePayload,
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
 * return its parent node uid
 * @param uid 
 */
export const getParentUid = (uid: TUid): TUid => {
  const arr = uid.split('?')
  arr.pop()
  return arr.join('?')
}

/**
 * return entry name from the "uid"
 * @param uid 
 * @returns 
 */
export const getEntryName = (uid: TUid): string => {
  const arr = uid.split('?')
  const entryName: string = arr.pop() as string
  return entryName
}

/**
 * generate the new uid inside p_uid
 * @param p_uid 
 * @param nodeIndex 
 * @returns 
 */
export const generateNodeUid = (p_uid: TUid, nodeIndex: number | string): TUid => {
  return p_uid + "?" + nodeIndex
}

/**
 * sort the nodes by name-asc
 * @param _nodes 
 */
export const sortNodesByAsc = (_nodes: TNode[]): TNode[] => {
  let nodes = [..._nodes]

  return nodes.sort((a: TNode, b: TNode) => {
    return a.isEntity && !b.isEntity ? 1 :
      !a.isEntity && b.isEntity ? -1 :
        a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0
  })
}

/**
 * it sorts the uids by dfs and return it
 * @param _uids 
 */
export const getDfsUids = (_uids: TUid[]): TUid[] => {
  let uids = [..._uids]
  return uids.sort((a, b) => {
    if (a === 'ROOT') return -1
    if (b === 'ROOT') return 1

    const arr_a: string[] = a.split('?')
    const arr_b: string[] = b.split('?')
    for (let index = 1; index < arr_a.length; ++index) {
      const aa = parseInt(arr_a[index])
      const ab = parseInt(arr_b[index] !== undefined ? arr_b[index] : '0')
      if (aa === ab) continue
      return aa > ab ? 1 : -1
    }

    return -1
  })
}

/**
 * it sorts the uids by bfs and return it
 * @param uids 
 */
export const getBfsUids = (_uids: TUid[]): TUid[] => {
  let uids = [..._uids]
  return uids.sort((a, b) => {
    if (a === 'ROOT') return -1
    if (b === 'ROOT') return 1

    const arr_a: string[] = a.split('?')
    const arr_b: string[] = b.split('?')

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

  const validatedUids: { [uid: TUid]: boolean } = {}

  // validate the uids generally
  _uids.map((uid) => {
    const arr = uid.split('?')
    let _uid = ''
    arr.map((_arr) => {
      _uid += `${_uid === '' ? '' : '?'}${_arr}`
      if (validatedUids[_uid] === true) {
        delete validatedUids[_uid]
      }
    })
    const deletedUids: TUid[] = []
    Object.keys(validatedUids).map((validatedUid) => {
      if (validatedUid.startsWith(uid)) {
        deletedUids.push(validatedUid)
      }
    })
    deletedUids.map((deletedUid) => {
      delete validatedUids[deletedUid]
    })

    validatedUids[uid] = true
  })

  _uids = Object.keys(validatedUids)

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
export const resetTreeUids = (tree: TTree): { newTree: TTree, convertedUids: Map<TUid, TUid> } => {
  // get converted uids
  const nodes: TNode[] = [tree['ROOT']]
  const convertedUids: Map<TUid, TUid> = new Map<TUid, TUid>()
  while (nodes.length) {
    const node = nodes.shift() as TNode
    node.children = node.children.map((c_uid, index) => {
      const expectedUid = generateNodeUid(node.uid, index + 1)
      c_uid !== expectedUid && convertedUids.set(c_uid, expectedUid)

      tree[c_uid].p_uid = node.uid
      tree[c_uid].uid = expectedUid
      nodes.push(tree[c_uid])

      return expectedUid
    })
  }

  // update the tree with convertedUids
  const newTree: TTree = {}
  Object.keys(tree).map((uid) => {
    const node = tree[uid]
    // replace the className in the node
    const { data } = node
    data.attribs !== undefined && data.attribs.class !== undefined ? data.attribs.class = data.attribs.class.replace(`rnbwdev-rainbow-component-${uid.replace(/\?/g, '-')}`, `rnbwdev-rainbow-component-${node.uid.replace(/\?/g, '-')}`) : null
    newTree[node.uid] = JSON.parse(JSON.stringify(node))
  })

  return { newTree, convertedUids }
}

/**
 * get the prev uid of "uid" based on the tree view naming rule
 * @param tree 
 * @param node 
 * @returns 
 */
export const getBeforeUid = (tree: TTree, node: TNode): TUid => {
  const parentNode = tree[node.p_uid as TUid]
  let beforeUid: TUid = ''
  for (const c_uid of parentNode.children) {
    if (c_uid === node.uid) break
    beforeUid = c_uid
  }
  return beforeUid
}

/**
 * add text-format node before the "node"
 * @param tree 
 * @param node 
 */
export const addFormatTextBeforeNode = (tree: TTree, node: TNode, os: TOS, uidOffset: number = 0): boolean => {
  // get node index inside the parentNode
  const parentNode = tree[node.p_uid as TUid]
  let childIndex: number = 0
  for (const c_uid of parentNode.children) {
    if (c_uid === node.uid) break
    childIndex++
  }

  // format text node
  const tabSize = 2
  const nodeDepth = parentNode.uid.split('?').length - 1
  let formatTextNode: TNode = {
    uid: generateNodeUid(parentNode.uid, parentNode.children.length + 1 + uidOffset),
    p_uid: parentNode.uid,
    name: 'text',
    isEntity: true,
    children: [],
    data: {
      valid: false,
      isFormatText: true,

      type: 'text',
      name: undefined,
      data: (os === 'Windows' ? `\r\n` : `\n`) + ' '.repeat((nodeDepth) * tabSize),
      attribs: undefined,

      // startLineNumber: '',
      // startColumn: '',
      // endLineNumber: '',
      // endColumn: '',

      // html: '',
    },
  }

  // add before format text node
  let hasOffset: boolean = false
  if (childIndex === 0) {
    tree[formatTextNode.uid] = formatTextNode
    parentNode.children.splice(childIndex, 0, formatTextNode.uid)
  } else {
    const beforeNode = tree[parentNode.children[childIndex - 1]]
    if (beforeNode.data.isFormatText === false) {
      tree[formatTextNode.uid] = formatTextNode
      parentNode.children.splice(childIndex, 0, formatTextNode.uid)
    } else {
      hasOffset = true
      delete tree[beforeNode.uid]
      tree[formatTextNode.uid] = formatTextNode
      parentNode.children.splice(childIndex - 1, 1, formatTextNode.uid)
    }
  }
  return hasOffset
}

/**
 * add text-format node after the "node"
 * @param tree 
 * @param node 
 */
export const addFormatTextAfterNode = (tree: TTree, node: TNode, os: TOS, uidOffset: number = 0): boolean => {
  // get node index inside the parentNode
  const parentNode = tree[node.p_uid as TUid]
  let childIndex: number = 0
  for (const c_uid of parentNode.children) {
    if (c_uid === node.uid) break
    childIndex++
  }

  // format text node
  const tabSize = 2
  const nodeDepth = parentNode.uid.split('?').length - 1
  let formatTextNode: TNode = {
    uid: generateNodeUid(parentNode.uid, parentNode.children.length + 1 + uidOffset),
    p_uid: parentNode.uid,
    name: 'text',
    isEntity: true,
    children: [],
    data: {
      valid: false,
      isFormatText: true,

      type: 'text',
      name: undefined,
      data: (os === 'Windows' ? `\r\n` : `\n`) + ' '.repeat((nodeDepth) * tabSize),
      attribs: undefined,

      // startLineNumber: '',
      // startColumn: '',
      // endLineNumber: '',
      // endColumn: '',

      // html: '',
    },
  }

  // add after format text node
  let hasOffset: boolean = false
  if (childIndex === parentNode.children.length - 1) {
    formatTextNode.data.data = (os === 'Windows' ? `\r\n` : `\n`) + ' '.repeat((nodeDepth - 1) * tabSize)
    tree[formatTextNode.uid] = formatTextNode
    parentNode.children.push(formatTextNode.uid)
  } else {
    const afterNode = tree[parentNode.children[childIndex + 1]]
    if (afterNode.data.isFormatText === false) {
      tree[formatTextNode.uid] = formatTextNode
      parentNode.children.splice(childIndex + 1, 0, formatTextNode.uid)
    } else {
      hasOffset = true
      delete tree[afterNode.uid]
      tree[formatTextNode.uid] = formatTextNode
      parentNode.children.splice(childIndex + 1, 1, formatTextNode.uid)
    }
  }
  return hasOffset
}

/**
 * indent all of the sub nodes of the "node" by offset "indentSize"
 * @param tree 
 * @param node 
 * @param indentSize 
 */
export const indentNode = (tree: TTree, node: TNode, indentSize: number, os: TOS) => {
  const uids: TUid[] = getSubUids(node.uid, tree)
  uids.map((uid) => {
    const node = tree[uid]
    if (node.data.isFormatText) {
      const text = node.data.data
      const textParts = text.split(os === 'Windows' ? `\r\n` : `\n`)
      const singleLine = textParts.length === 1
      const lastPart = textParts.pop()
      const newLastPart = ' '.repeat(lastPart.length + indentSize)
      node.data.data = textParts.join(os === 'Windows' ? `\r\n` : `\n`) + (!singleLine ? (os === 'Windows' ? `\r\n` : `\n`) : '') + newLastPart
    }
  })
}

/**
 * add node api
 * this api adds the node just as a child of the target node in the tree
 * @param param0 
 */
export const addNode = ({ tree, targetUid, node, os }: TAddNodePayload): TNodeApiRes => {
  const target = tree[targetUid]
  target.isEntity = false

  node.uid = generateNodeUid(targetUid, target.children.length + 1)
  node.p_uid = targetUid

  tree[node.uid] = node
  target.children.push(node.uid)

  // add text-format nodes before & after the "node"
  let uidOffset: number = 0
  let hasOffset: boolean = false
  hasOffset = addFormatTextBeforeNode(tree, node, os, uidOffset)
  hasOffset && uidOffset++
  hasOffset = addFormatTextAfterNode(tree, node, os, uidOffset)
  hasOffset && uidOffset++

  /* reset the uids */
  const { newTree, convertedUids: _convertedUids } = resetTreeUids(tree)
  const convertedUids: [TUid, TUid][] = []
  for (const [prev, cur] of _convertedUids) {
    convertedUids.push([prev, cur])
  }
  return { tree: newTree, convertedUids }
}

/**
 * remove node api
 * this api removes the nodes from the tree based on the node uids
 * @param param0 
 * @returns 
 */
export const removeNode = ({ tree, nodeUids }: TRemoveNodePayload): TNodeApiRes => {
  const deletedUids: TUid[] = []
  for (const nodeUid of nodeUids) {
    const node = tree[nodeUid]

    // delete before text format node
    const beforeUid = getBeforeUid(tree, node)
    const beforeNode = tree[beforeUid]
    if (beforeNode !== undefined && beforeNode.data.isFormatText === true) {
      delete tree[beforeUid]
    }

    // update parent
    const p_node = tree[node.p_uid as TUid]
    p_node.children = p_node.children.filter(c_uid => c_uid !== nodeUid && (beforeUid === '' || c_uid !== beforeUid))
    p_node.isEntity = p_node.children.length === 0

    // delete nested nodes
    const uids = getSubUids(nodeUid, tree)
    deletedUids.push(...uids)
    for (const uid of uids) {
      delete tree[uid]
    }
  }

  /* reset the uids */
  const { newTree, convertedUids: _convertedUids } = resetTreeUids(tree)
  const convertedUids: [TUid, TUid][] = []
  for (const [prev, cur] of _convertedUids) {
    convertedUids.push([prev, cur])
  }
  return { tree: newTree, deletedUids, convertedUids }
}

/**
 * move(cut & paste) node api
 * this api moves the nodes inside the parent node
 * @param param0 
 * @returns 
 */
export const moveNode = ({ tree, isBetween, parentUid, position, uids, os }: TMoveNodePayload): TNodeApiRes => {
  const parentNode = tree[parentUid]
  const parentNodeDepth = parentNode.uid.split('?').length - 1
  const tabSize = 2

  let uidOffset: number = 0
  uids.map((uid) => {
    const node = tree[uid]

    const p_node = tree[node.p_uid as TUid]
    const p_nodeDepth = p_node.uid.split('?').length - 1

    let _childIndex: number = 0
    if (p_node.uid === parentNode.uid) {
      for (const c_uid of parentNode.children) {
        if (c_uid === node.uid) break
        tree[c_uid].data.valid === true && _childIndex++
      }
    }

    // delete before text format node
    let beforeUid = getBeforeUid(tree, node)
    const beforeNode = tree[beforeUid]
    if (beforeNode !== undefined && beforeNode.data.isFormatText === true) {
      uidOffset++
      delete tree[beforeUid]
    }

    p_node.children = p_node.children.filter(c_uid => c_uid !== uid && (beforeUid === '' || c_uid !== beforeUid))
    p_node.isEntity = p_node.children.length === 0

    node.p_uid = parentUid
    parentNode.isEntity = false
    if (isBetween) {
      /* push the node at the specific position of the parent.children */
      let pushed = false
      let childIndex = position
      if (p_node.uid === parentNode.uid) {
        if (_childIndex < childIndex) {
          childIndex--
        }
      }
      let index = -1

      parentNode.children = parentNode.children.reduce((prev, cur) => {
        if (tree[cur].data.valid === true) {
          index++
        }
        if (index === childIndex && !pushed) {
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

    // add format text nodes before and after the "uid-node"
    let hasOffset: boolean = false
    hasOffset = addFormatTextBeforeNode(tree, node, os, uidOffset)
    hasOffset && uidOffset++
    hasOffset = addFormatTextAfterNode(tree, node, os, uidOffset)
    hasOffset && uidOffset++

    // indent the nodes
    if (parentNodeDepth !== p_nodeDepth) {
      indentNode(tree, node, tabSize * (parentNodeDepth - p_nodeDepth), os)
    }
  })

  /* reset the uids */
  const { newTree, convertedUids: _convertedUids } = resetTreeUids(tree)
  const convertedUids: [TUid, TUid][] = []
  for (const [prev, cur] of _convertedUids) {
    convertedUids.push([prev, cur])
  }
  return { tree: newTree, convertedUids }
}

/**
 * copy(duplicate) the uids under the tragetUid in the tree
 * @param param0 
 */
export const copyNode = ({ tree, targetUid, uids, os }: TCopyNodePayload): TNodeApiRes => {
  const targetNode = tree[targetUid]
  const targetNodeDepth = targetNode.uid.split('?').length - 1
  const tabSize = 2

  let uidOffset = 0
  uids.map((uid) => {
    const newNode: TNode = JSON.parse(JSON.stringify(tree[uid]))
    const parentNodeDepth = (newNode.p_uid as TUid).split('?').length - 1
    const newUid = generateNodeUid(targetUid, targetNode.children.length + 1 + uidOffset)

    newNode.uid = newUid
    newNode.p_uid = targetUid
    targetNode.children.push(newUid)

    const nodes: TNode[] = [newNode]
    while (nodes.length > 0) {
      const node = nodes.shift() as TNode
      node.children = node.children.map((childUid, childIndex) => {
        const childNode = JSON.parse(JSON.stringify(tree[childUid]))
        const newChildUid = generateNodeUid(node.uid, childIndex + 1)
        childNode.uid = newChildUid
        childNode.p_uid = node.uid
        nodes.push(childNode)
        return newChildUid
      })
      tree[node.uid] = node
    }

    // add format text nodes before and after the "uid-node"
    let hasOffset: boolean = false
    hasOffset = addFormatTextBeforeNode(tree, newNode, os, uidOffset)
    hasOffset && uidOffset++
    hasOffset = addFormatTextAfterNode(tree, newNode, os, uidOffset)
    hasOffset && uidOffset++

    // indent the nodes
    if (targetNodeDepth !== parentNodeDepth) {
      indentNode(tree, newNode, tabSize * (targetNodeDepth - parentNodeDepth), os)
    }
  })

  /* reset the uids */
  const { newTree, convertedUids: _convertedUids } = resetTreeUids(tree)
  const convertedUids: [TUid, TUid][] = []
  for (const [prev, cur] of _convertedUids) {
    convertedUids.push([prev, cur])
  }
  return { tree: newTree, convertedUids }
}

/**
 * duplicate(copy & paste) node api
 * this api duplicates the nodes inside the parent node
 * @param param0 
 * @returns 
 */
export const duplicateNode = ({ tree, node, os }: TDuplicateNodePayload): TNodeApiRes => {
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

  /* add text format node before the "node" */
  addFormatTextBeforeNode(tree, tree[newUid], os)

  /* reset the uids */
  const { newTree, convertedUids: _convertedUids } = resetTreeUids(tree)
  const convertedUids: [TUid, TUid][] = []
  for (const [prev, cur] of _convertedUids) {
    convertedUids.push([prev, cur])
  }
  return { tree: newTree, convertedUids }
}

/**
 * update the data of the node in the tree based on the uid
 * @param param0 
 */
export const updateNode = ({ tree, uid, data }: TUpdateNodePayload) => {
  tree[uid].data = data
}

/**
 * replace node api
 * this api replaces the node in the tree - it can also use for rename
 * @param param0 
 */
export const replaceNode = ({ tree, node }: TReplaceNodePayload) => {
  // replace node in the tree
  tree[node.uid] = node
}

/**
 * parse file api
 * this api parses the file content based on the type and return the tree data
 * @param param0 
 * @returns 
 */
export const parseFile = ({ type, content, referenceData, os }: TParseFilePayload): THtmlParserResponse | TTree => {
  if (type === "html") {
    return parseHtml(content, referenceData as THtmlReferenceData, os)
  }
  return {}
}

/**
 * searialize file api
 * this api searializes the file content based on the type and tree data
 * @param param0 
 * @returns 
 */
export const serializeFile = ({ type, tree, referenceData }: TSearializeFilePayload): string => {
  if (type === "html") {
    return serializeHtml(tree, referenceData as THtmlReferenceData)
  }
  return ''
}