import ReactHtmlParser from 'react-html-parser';

import {
  NodeInAppAttribName,
  RootNodeUid,
} from '@_constants/main';
import { AmbiguousReactShortHandMap } from '@_ref/AmbiguousReactShortHandMap';
import { getLineBreakCharacter } from '@_services/global';
import { TOsType } from '@_types/global';

import {
  getNodeChildIndex,
  getNodeDepth,
  getSubNodeUidsByBfs,
  getSubNodeUidsByDfs,
  THtmlNodeData,
  TNode,
  TNodeTreeData,
  TNodeUid,
} from '../';
import {
  THtmlDomNodeData,
  THtmlNodeAttributes,
  THtmlPageSettings,
  THtmlParserResponse,
  THtmlReferenceData,
} from './types';

export const setHtmlNodeInAppAttribName = (node: TNode, newUid: TNodeUid) => {
  const nodeData = node.data as THtmlNodeData
  nodeData.attribs[NodeInAppAttribName] = newUid
}
export const addFormatTextBeforeNode = (tree: TNodeTreeData, node: TNode, uid: TNodeUid, osType: TOsType, tabSize: number): void => {
  const parentNode = tree[node.parentUid as TNodeUid]
  const position = getNodeChildIndex(parentNode, node)
  const parentNodeDepth = getNodeDepth(tree, parentNode.uid)

  // generate text node
  const formatTextNode: TNode = {
    uid,
    parentUid: parentNode.uid,
    name: 'text',
    isEntity: true,
    children: [],
    data: {
      valid: false,
      isFormatText: true,

      type: 'text',
      name: '',
      data: getLineBreakCharacter(osType) + ' '.repeat((parentNodeDepth) * tabSize),
      attribs: { [NodeInAppAttribName]: uid },

      html: '',
      htmlInApp: '',

      startLineNumber: 0,
      startColumn: 0,
      endLineNumber: 0,
      endColumn: 0,
    } as THtmlNodeData,
  }

  // add text node
  tree[uid] = formatTextNode

  // update parent
  if (position === 0) {
    parentNode.children.splice(0, 0, uid)
  } else {
    const prevNode = tree[parentNode.children[position - 1]]
    const prevNodeData = prevNode.data as THtmlNodeData
    if (!prevNodeData.isFormatText) {
      parentNode.children.splice(position, 0, uid)
    } else {
      delete tree[prevNode.uid]
      parentNode.children.splice(position - 1, 1, uid)
    }
  }
}
export const addFormatTextAfterNode = (tree: TNodeTreeData, node: TNode, uid: TNodeUid, osType: TOsType, tabSize: number): void => {
  const parentNode = tree[node.parentUid as TNodeUid]
  const position = getNodeChildIndex(parentNode, node)
  const parentNodeDepth = getNodeDepth(tree, parentNode.uid)

  // generate text node
  const formatTextNode: TNode = {
    uid,
    parentUid: parentNode.uid,
    name: 'text',
    isEntity: true,
    children: [],
    data: {
      valid: false,
      isFormatText: true,

      type: 'text',
      name: '',
      data: getLineBreakCharacter(osType) + ' '.repeat((position === parentNode.children.length - 1 ? parentNodeDepth - 1 : parentNodeDepth) * tabSize),
      attribs: { [NodeInAppAttribName]: uid },

      html: '',
      htmlInApp: '',

      startLineNumber: 0,
      startColumn: 0,
      endLineNumber: 0,
      endColumn: 0,
    } as THtmlNodeData,
  }

  // add text node
  tree[uid] = formatTextNode

  // update parent
  if (position === parentNode.children.length - 1) {
    parentNode.children.push(uid)
  } else {
    const nextNode = tree[parentNode.children[position + 1]]
    const nextNodeData = nextNode.data as THtmlNodeData
    if (!nextNodeData.isFormatText) {
      parentNode.children.splice(position + 1, 0, uid)
    } else {
      delete tree[nextNode.uid]
      parentNode.children.splice(position + 1, 1, uid)
    }
  }
}
export const indentNode = (tree: TNodeTreeData, node: TNode, indentSize: number, osType: TOsType) => {
  const subNodeUids = getSubNodeUidsByBfs(node.uid, tree)
  subNodeUids.map((subNodeUid) => {
    const subNode = tree[subNodeUid]
    const nodeData = subNode.data as THtmlNodeData
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

export const parseHtml = (content: string, htmlReferenceData: THtmlReferenceData, osType: TOsType): THtmlParserResponse => {
  // parse the html content
  let UID = 0
  const tmpTree: TNodeTreeData = {}
  ReactHtmlParser(content, {
    decodeEntities: true,
    transform: (node, index, transform) => {
      node.valid = true
    },
    preprocessNodes: (nodes: THtmlDomNodeData[]) => {
      // build root node
      tmpTree[RootNodeUid] = {
        uid: RootNodeUid,
        parentUid: null,
        name: RootNodeUid,
        isEntity: false,
        children: [],
        data: { valid: true },
      }

      // build depth-1 seed nodes
      const seedNodes: TNode[] = []
      nodes.map((node) => {
        const uid = String(++UID)
        tmpTree[RootNodeUid].children.push(uid)
        tmpTree[uid] = {
          uid,
          parentUid: RootNodeUid,
          name: '',
          isEntity: true,
          children: [],
          data: node,
        }
        seedNodes.push(tmpTree[uid])
      })

      // build the whole node tree from the seed nodes - BFS
      while (seedNodes.length) {
        const node = seedNodes.shift() as TNode
        const nodeData = node.data as THtmlDomNodeData

        if (!nodeData.children) continue

        nodeData.children.map((child: THtmlDomNodeData) => {
          const uid = String(++UID)

          node.children.push(uid)
          node.isEntity = false

          tmpTree[uid] = {
            uid,
            parentUid: node.uid,
            name: '',
            isEntity: true,
            children: [],
            data: child,
          }
          seedNodes.push(tmpTree[uid])
        })
        for (const _child of nodeData.children) {
        }
      }

      return nodes
    },
  })

  // build real tree data and set html page settings
  const tree: TNodeTreeData = {}
  const settings: THtmlPageSettings = {
    scripts: [],
    favicon: [],
  }
  let uids: TNodeUid[] = Object.keys(tmpTree)
  uids.map((uid) => {
    const node = tmpTree[uid]

    // get html page settings info
    if (uid !== RootNodeUid) {
      const nodeData = node.data as THtmlDomNodeData
      if (nodeData.type === 'tag') {
        if (nodeData.name === 'title') {
          settings.title = node.uid
        } else if (nodeData.name === 'link' && nodeData.attribs.rel === 'icon' && nodeData.attribs.href) {
          settings.favicon.push(nodeData.attribs.href)
        }
      } else if (nodeData.type === 'script') {
        settings.scripts.push(tree[uid])
      }
    }

    // build valid node tree
    if (uid === RootNodeUid) {
      tree[uid] = { ...node }
    } else {
      const nodeData = node.data as THtmlDomNodeData

      let isFormatText = false, valid = true
      if (!nodeData.valid) {
        // format text node
        valid = false
        isFormatText = true
      } else {
        // detect general text node
        valid = (nodeData.type !== 'text')
      }

      // set in-app-attribute to nodes
      if (!nodeData.attribs) nodeData.attribs = {}
      nodeData.attribs[NodeInAppAttribName] = uid

      tree[uid] = {
        ...node,
        name: nodeData.name || nodeData.type,
        data: {
          valid,
          isFormatText,

          type: nodeData.type,
          name: nodeData.name,
          data: nodeData.data,
          attribs: nodeData.attribs,
        },
      }
    }
  })

  // set html, htmlInApp to tree nodes
  const { html: formattedContent, htmlInApp: contentInApp } = serializeHtml(tree, htmlReferenceData)

  // set code range to nodes
  const detected: Map<string, number> = new Map<string, number>()
  uids = getSubNodeUidsByDfs(RootNodeUid, tree)
  uids.map((uid) => {
    const node = tree[uid]
    if (!node.data.valid) return

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

  return { formattedContent, contentInApp, tree, nodeMaxUid: String(UID), info: settings }
}
export const serializeHtml = (tree: TNodeTreeData, htmlReferenceData: THtmlReferenceData): THtmlNodeData => {
  const uids = getSubNodeUidsByBfs(RootNodeUid, tree)
  uids.reverse()

  uids.map((uid) => {
    const node = tree[uid]
    const nodeData = node.data as THtmlNodeData

    // merge children html
    let childrenHtml = '', childrenHtmlInApp = ''
    node.children.map((c_uid) => {
      const child = tree[c_uid]
      const childData = child.data as THtmlNodeData
      childrenHtml += childData.html
      childrenHtmlInApp += childData.htmlInApp
    })

    // generate attribs html
    let nodeHtml = '', nodeHtmlInApp = ''
    const attribsHtml = nodeData.attribs === undefined ? '' :
      Object.keys(nodeData.attribs).map(attr => {
        if (attr === NodeInAppAttribName) return

        const attrContent = nodeData.attribs[attr]
        return attrContent === '' ? ` ${attr}` : ` ${attr}="${attrContent}"`
      }).join('')
    const attribsHtmlInApp = nodeData.attribs === undefined ? '' :
      Object.keys(nodeData.attribs).map(attr => {
        const attrContent = nodeData.attribs[attr]
        return attrContent === '' ? ` ${attr}` : ` ${attr}="${attrContent}"`
      }).join('')

    // wrap with the current node
    if (nodeData.type === 'directive') {
      nodeHtml = `<${nodeData.data}>`
      nodeHtmlInApp = `<${nodeData.data}>`
    } else if (nodeData.type === 'comment') {
      nodeHtml = `<!--${nodeData.data}-->`
      nodeHtmlInApp = `<!--${nodeData.data}-->`
    } else if (nodeData.type === 'text') {
      // replace "<" or ">" to "&lt;" and "&gt;"
      nodeHtml = nodeData.data.replace(/</g, `&lt;`).replace(/>/g, `&gt;`)
      nodeHtmlInApp = nodeData.data.replace(/</g, `&lt;`).replace(/>/g, `&gt;`)
    } else if (nodeData.type === 'script' || nodeData.type === 'style') {
      nodeHtml = `<${nodeData.type}${attribsHtml}>${childrenHtml}</${nodeData.type}>`
      nodeHtmlInApp = `<${nodeData.type}${attribsHtmlInApp}>${childrenHtmlInApp}</${nodeData.type}>`
    } else if (nodeData.type === 'tag') {
      const tagName = nodeData.name
      const htmlElementsReferenceData = htmlReferenceData.elements
      const refData = htmlElementsReferenceData[tagName]

      let isEmptyTag = refData && refData.Content === 'None'
      // --------------------- tmp code ---------------------
      if (!isEmptyTag) {
        if (tagName === 'meta' || tagName === 'link'
          || tagName === 'br' || tagName === 'hr'
          || tagName === 'source' || tagName === 'input'
          || tagName === 'area' || tagName === 'col' || tagName === 'wbr') {
          isEmptyTag = true
        }
      }
      // --------------------- tmp code ---------------------

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

    // set html and htmlInApp
    nodeData.html = nodeHtml
    nodeData.htmlInApp = nodeHtmlInApp
  })

  return tree[RootNodeUid].data as THtmlNodeData
}

export const getShortHand = (attrs: THtmlNodeAttributes): THtmlNodeAttributes => {
  const newAttr: THtmlNodeAttributes = {}

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