import ReactHtmlParser from 'react-html-parser';

import {
  NodeInAppAttribName,
  NodeUidSplitterRegExp,
  RootNodeUid,
} from '@_constants/main';
import { AmbiguousReactShortHandMap } from '@_ref/AmbiguousReactShortHandMap';
import { getLineBreakCharacter } from '@_services/global';
import { TOsType } from '@_types/global';

import {
  generateNodeUid,
  getNodeChildIndex,
  getNodeDepth,
  getSubNodeUidsByBfs,
  getSubNodeUidsByDfs,
  sortNodeUidsByBfs,
  THtmlNodeData,
  TNode,
  TNodeTreeData,
  TNodeUid,
} from '../';
import {
  THtmlParserResponse,
  THtmlProcessableNode,
  THtmlReferenceData,
  THtmlSettings,
  THtmlTagAttributes,
} from './types';

/**
 * replace in-app attrib name with new uid
 * @param node 
 * @param newUid 
 */
export const replaceHtmlNodeInAppAttribName = (node: TNode, newUid: TNodeUid) => {
  const nodeData = node.data as THtmlNodeData
  nodeData.attribs ?
    nodeData.attribs[NodeInAppAttribName] = `${newUid.replace(NodeUidSplitterRegExp, '-')}`
    : null
}

/**
 * add format-text-note before the node
 * @param tree 
 * @param node 
 * @param uidOffset 
 * @param osType 
 * @param tabSize 
 * @returns 
 */
export const addFormatTextBeforeNode = (tree: TNodeTreeData, node: TNode, uidOffset: number, osType: TOsType, tabSize: number): boolean => {
  const parentNode = tree[node.parentUid as TNodeUid]
  const childIndex = getNodeChildIndex(parentNode, node)

  // generate format text node
  const nodeDepth = getNodeDepth(parentNode.uid)
  let formatTextNode: TNode = {
    uid: generateNodeUid(parentNode.uid, parentNode.children.length + 1 + uidOffset),
    parentUid: parentNode.uid,
    name: 'text',
    isEntity: true,
    children: [],
    data: {
      valid: false,
      isFormatText: true,

      type: 'text',
      name: undefined,
      data: getLineBreakCharacter(osType) + ' '.repeat((nodeDepth) * tabSize),
      attribs: undefined,

      startLineNumber: 0,
      startColumn: 0,
      endLineNumber: 0,
      endColumn: 0,

      html: undefined,

      hasOrgClass: false,
    },
  }

  // add before format text node
  let hasOffset: boolean = false
  if (childIndex === 0) {
    tree[formatTextNode.uid] = formatTextNode
    parentNode.children.splice(childIndex, 0, formatTextNode.uid)
  } else {
    const prevNode = tree[parentNode.children[childIndex - 1]]
    const prevNodeData = prevNode.data as THtmlNodeData
    if (!prevNodeData.isFormatText) {
      tree[formatTextNode.uid] = formatTextNode
      parentNode.children.splice(childIndex, 0, formatTextNode.uid)
    } else {
      hasOffset = true
      delete tree[prevNode.uid]
      tree[formatTextNode.uid] = formatTextNode
      parentNode.children.splice(childIndex - 1, 1, formatTextNode.uid)
    }
  }
  return hasOffset
}

/**
 * add format-text-note after the node
 * @param tree 
 * @param node 
 * @param uidOffset 
 * @param osType 
 * @param tabSize 
 * @returns 
 */
export const addFormatTextAfterNode = (tree: TNodeTreeData, node: TNode, uidOffset: number, osType: TOsType, tabSize: number): boolean => {
  const parentNode = tree[node.parentUid as TNodeUid]
  const childIndex = getNodeChildIndex(parentNode, node)

  // format text node
  const nodeDepth = getNodeDepth(parentNode.uid)
  let formatTextNode: TNode = {
    uid: generateNodeUid(parentNode.uid, parentNode.children.length + 1 + uidOffset),
    parentUid: parentNode.uid,
    name: 'text',
    isEntity: true,
    children: [],
    data: {
      valid: false,
      isFormatText: true,

      type: 'text',
      name: undefined,
      data: getLineBreakCharacter(osType) + ' '.repeat((nodeDepth) * tabSize),
      attribs: undefined,

      startLineNumber: 0,
      startColumn: 0,
      endLineNumber: 0,
      endColumn: 0,

      html: undefined,

      hasOrgClass: false,
    },
  }

  // add after format text node
  let hasOffset: boolean = false
  if (childIndex === parentNode.children.length - 1) {
    const formatTextNodeData = formatTextNode.data as THtmlNodeData
    formatTextNodeData.data = getLineBreakCharacter(osType) + ' '.repeat((nodeDepth - 1) * tabSize)
    tree[formatTextNode.uid] = formatTextNode
    parentNode.children.push(formatTextNode.uid)
  } else {
    const nextNode = tree[parentNode.children[childIndex + 1]]
    const nextNodeData = nextNode.data as THtmlNodeData
    if (!nextNodeData.isFormatText) {
      tree[formatTextNode.uid] = formatTextNode
      parentNode.children.splice(childIndex + 1, 0, formatTextNode.uid)
    } else {
      hasOffset = true
      delete tree[nextNode.uid]
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
 * @param osType 
 */
export const indentNode = (tree: TNodeTreeData, node: TNode, indentSize: number, osType: TOsType) => {
  const uids = getSubNodeUidsByBfs(node.uid, tree)
  uids.map((uid) => {
    const node = tree[uid]
    const nodeData = node.data as THtmlNodeData
    if (nodeData.isFormatText) {
      const text = nodeData.data
      const textParts = text.split(getLineBreakCharacter(osType))
      const singleLine = textParts.length === 1
      const lastPart = textParts.pop()
      const newLastPart = ' '.repeat(lastPart?.length || 0 + indentSize)
      nodeData.data = textParts.join(getLineBreakCharacter(osType)) + (singleLine ? '' : getLineBreakCharacter(osType)) + newLastPart
    }
  })
}

/**
 * parse html content
 * @param content 
 * @param htmlReferenceData 
 * @param osType 
 * @returns 
 */
export const parseHtml = (content: string, htmlReferenceData: THtmlReferenceData, osType: TOsType): THtmlParserResponse => {
  const tree: TNodeTreeData = {}
  const tmpTree: TNodeTreeData = {}
  const settings: THtmlSettings = {
    scripts: [],
    favicon: [],
  }
  let UID = 0

  // parse html using react-html-parser
  ReactHtmlParser(content, {
    decodeEntities: true,
    transform: (node, index, transform) => {
      node.valid = true
    },
    preprocessNodes: (_nodes: THtmlProcessableNode[]) => {
      tmpTree[RootNodeUid] = {
        uid: RootNodeUid,
        parentUid: null,
        name: RootNodeUid,
        isEntity: false,
        children: [],
        data: { valid: true },
      }

      // build the depth-1 seed nodes
      const seedNodes: TNode[] = []
      _nodes.map((_node, _index) => {
        const uid = String(++UID)
        _node.valid = true
        _node.uid = uid
        tmpTree[RootNodeUid].children.push(uid)
        tmpTree[uid] = {
          uid,
          parentUid: RootNodeUid,
          name: '',
          isEntity: true,
          children: [],
          data: _node,
        }
        seedNodes.push(tmpTree[uid])
      })

      // build the whole node tree from the seed nodes - BFS
      while (seedNodes.length) {
        const _node = seedNodes.shift() as TNode
        const nodeData = _node.data as THtmlProcessableNode
        if (!nodeData.children) continue

        for (const _child of nodeData.children) {
          const uid = String(++UID);
          (_child as THtmlProcessableNode).uid = uid
          _node.children.push(uid)
          _node.isEntity = false
          tmpTree[uid] = {
            uid,
            parentUid: _node.uid,
            name: '',
            isEntity: true,
            children: [],
            data: _child as THtmlProcessableNode,
          }
          seedNodes.push(tmpTree[uid])
        }
      }

      return _nodes
    },
  })

  // validate the nodes
  let uids: TNodeUid[] = Object.keys(tmpTree)
  uids.map((uid) => {
    const node = tmpTree[uid]
    const data = node.data as THtmlProcessableNode

    // set isFormatText & valid
    let isFormatText = false, valid = true
    if (uid === RootNodeUid) {
      // do nothing
    } else if (!data.valid) {
      // its format text node
      valid = false
      isFormatText = true
    } else {
      // its just text content, not format text node
      valid = (data.type !== 'text')
    }

    // set in-app class name to nodes
    if (!data.attribs) data.attribs = {}
    data.attribs[NodeInAppAttribName] = uid

    const nodeData = {
      valid,
      isFormatText,

      type: data.type,
      name: data.name,
      data: data.data,
      attribs: data.attribs,
    }
    tree[uid] = {
      ...node,
      name: uid === RootNodeUid ? RootNodeUid : (data.name || data.type),
      data: nodeData,
    }

    if (data.type === 'tag') {
      if (data.name === 'title') {
        settings.title = node.uid
      } else if (data.name === 'link' && data.attribs.rel === 'icon' && data.attribs.href) {
        settings.favicon.push(data.attribs.href)
      }
    } else if (data.type === 'script') {
      settings.scripts.push(tree[uid])
    }
  })

  // set html for the nodes
  const { html: formattedContent, htmlInApp: contentInApp } = serializeHtml(tree, htmlReferenceData)

  // set html range for code view
  const detected: Map<string, number> = new Map<string, number>()
  uids = getSubNodeUidsByDfs(RootNodeUid, tree)
  uids.map((uid) => {
    const node = tree[uid]
    if (!node.data.valid) return

    // set the html range
    const { html } = node.data as THtmlNodeData
    const htmlArr = formattedContent.split(html)

    const detectedCount = detected.get(html) || 0
    const beforeHtml = htmlArr.slice(0, detectedCount + 1).join(html)
    detected.set(html, detectedCount + 1)

    const beforeHtmlArr = beforeHtml.split(getLineBreakCharacter(osType))
    const startLineNumber = beforeHtmlArr.length
    const startColumn = (beforeHtmlArr.pop()?.length || 0) + 1

    const contentArr = html.split(getLineBreakCharacter(osType))
    const endLineNumber = startLineNumber + contentArr.length - 1
    const endColumn = (contentArr.length === 1 ? startColumn : 1) + (contentArr.pop()?.length || 0)

    node.data = {
      ...node.data,
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn,
    }
  })

  return { formattedContent, contentInApp, tree, info: settings }
}

/**
 * set html for nodes in the tree and return the whole code
 * @param tree 
 * @param htmlReferenceData 
 * @returns 
 */
export const serializeHtml = (tree: TNodeTreeData, htmlReferenceData: THtmlReferenceData): THtmlNodeData => {
  const uids = sortNodeUidsByBfs(Object.keys(tree))
  uids.reverse()

  uids.map((uid) => {
    const node = tree[uid]

    // collect children html
    let childrenHtml = ``, childrenHtmlInApp = ``
    node.children.map((childUid) => {
      const child = tree[childUid]
      const childData = child.data as THtmlNodeData
      childrenHtml += childData.html
      childrenHtmlInApp += childData.htmlInApp
    })

    // wrap with the current node
    const data = node.data as THtmlNodeData
    let nodeHtml = ``, nodeHtmlInApp = ``

    // validate attribs html
    const attribsHtml = data.attribs === undefined ? '' : Object.keys(data.attribs).map(attr => {
      const attrContent = data.attribs[attr]
      if (attr === NodeInAppAttribName) {
        return
      } else if (attr === 'class') {
        // do nothing
      } else if (attr === 'style') {
        // do nothing
      } else {
        // do nothing
      }
      return attrContent === '' ? ` ${attr}` : ` ${attr}="${attrContent}"`
    }).join('')
    const attribsHtmlInApp = data.attribs === undefined ? '' : Object.keys(data.attribs).map(attr => {
      const attrContent = data.attribs[attr]
      if (attr === NodeInAppAttribName) {
        // do nothing
      } else if (attr === 'class') {
        // do nothing
      } else if (attr === 'style') {
        // do nothing
      } else {
        // do nothing
      }
      return attrContent === '' ? ` ${attr}` : ` ${attr}="${attrContent}"`
    }).join('')

    if (data.type === 'directive') {
      nodeHtml = `<${data.data}>`
      nodeHtmlInApp = `<${data.data}>`
    } else if (data.type === 'comment') {
      nodeHtml = `<!--${data.data}-->`
      nodeHtmlInApp = `<!--${data.data}-->`
    } else if (data.type === 'text') {
      // replace "<" or ">" to "&lt;" and "&gt;"
      nodeHtml = data.data.replace(/</g, `&lt;`).replace(/>/g, `&gt;`)
      nodeHtmlInApp = data.data.replace(/</g, `&lt;`).replace(/>/g, `&gt;`)
    } else if (data.type === 'script' || data.type === 'style') {
      nodeHtml = `<${data.type}${attribsHtml}>${childrenHtml}</${data.type}>`
      nodeHtmlInApp = `<${data.type}${attribsHtmlInApp}>${childrenHtmlInApp}</${data.type}>`
    } else if (data.type === 'tag') {
      const htmlElementsReferenceData = htmlReferenceData.elements
      const tagName = data.name
      let isEmptyTag: boolean = false
      const refData = htmlElementsReferenceData[tagName]

      let isWebComponent = false
      if (refData === undefined) {
        isWebComponent = true
      } else if (refData.Content === 'None') {
        isEmptyTag = true
      }
      data.isWebComponent = isWebComponent

      // need to remove this condition when the reference is perfect
      if (!isEmptyTag) {
        if (tagName === 'meta' || tagName === 'link'
          || tagName === 'br' || tagName === 'hr'
          || tagName === 'source' || tagName === 'input'
          || tagName === 'area' || tagName === 'col' || tagName === 'wbr') {
          isEmptyTag = true
        }
      }

      if (isEmptyTag) {
        nodeHtml = `<${tagName}${attribsHtml}>`
        nodeHtmlInApp = `<${tagName}${attribsHtmlInApp}>`
      } else {
        nodeHtml = `<${tagName}${attribsHtml}>${childrenHtml}</${tagName}>`
        nodeHtmlInApp = `<${tagName}${attribsHtmlInApp}>${childrenHtmlInApp}</${tagName}>`
      }
    } else {
      nodeHtml = childrenHtml
      nodeHtmlInApp = childrenHtmlInApp
    }

    data.html = nodeHtml
    data.htmlInApp = nodeHtmlInApp
  })

  return tree[RootNodeUid].data as THtmlNodeData
}

/**
 * get react short hand of attributes object
 * @param attrs 
 * @returns 
 */
export const getShortHand = (attrs: THtmlTagAttributes): THtmlTagAttributes => {
  const newAttr: THtmlTagAttributes = {}

  for (const attrName in attrs) {
    const attrContent = attrs[attrName]

    if (attrName === 'style') {
      newAttr['style'] = {}

      const styles: string[] = attrContent.replace(/ |\r|\n/g, '').split(';')
      styles.map((style) => {
        const _style = style.split(':')
        if (_style.length === 2) {
          const styleName = _style[0]
          const styleValue = _style[1]
          const newStyleName = styleName.replace(/-./g, c => c.slice(1).toUpperCase())
          newAttr['style'][newStyleName] = styleValue
        }
      })
    } else if (attrName === NodeInAppAttribName) {
      newAttr[attrName] = attrs[attrName]
    } else {
      const newAttrName = AmbiguousReactShortHandMap[attrName] || attrName.replace(/-./g, c => c.slice(1).toUpperCase())
      newAttr[newAttrName] = attrs[attrName]
    }
  }

  return newAttr
}