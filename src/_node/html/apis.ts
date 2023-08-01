import ReactHtmlParser from 'react-html-parser';

import {
  NodeInAppAttribName,
  RootNodeUid,
} from '@_constants/main';
// @ts-ignore
import htmlAttrs from '@_ref/rfrncs/HTML Attributes.csv';
import { getLineBreaker } from '@_services/global';
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
  THtmlParserResponse,
  THtmlReferenceData,
} from './types';

const noNeedClosingTag = ['area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr']
const emptyImage = window.location.origin + "/images/empty-image.svg"
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
      data: getLineBreaker(osType) + ' '.repeat((parentNodeDepth) * tabSize),
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
      data: getLineBreaker(osType) + ' '.repeat((position === parentNode.children.length - 1 ? parentNodeDepth - 1 : parentNodeDepth) * tabSize),
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
      const textParts = text.split(getLineBreaker(osType))
      const singleLine = textParts.length === 1
      const lastPart = textParts.pop()
      const newLastPart = ' '.repeat(lastPart?.length || 0 + indentSize)
      nodeData.data = textParts.join(getLineBreaker(osType)) + (singleLine ? '' : getLineBreaker(osType)) + newLastPart
    }
  })
}

export const parseHtml = (content: string, htmlReferenceData: THtmlReferenceData, osType: TOsType, keepNodeUids: null | boolean = false, nodeMaxUid: TNodeUid = ''): THtmlParserResponse => {
  let _nodeMaxUid = keepNodeUids === false ? 0 : Number(nodeMaxUid)

  // parse the html content
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
        const uid = keepNodeUids ?
          node.attribs ? node.attribs[NodeInAppAttribName] : String(++_nodeMaxUid) as TNodeUid
          : String(++_nodeMaxUid) as TNodeUid

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
          const uid = keepNodeUids ?
            child.attribs ? child.attribs[NodeInAppAttribName] : String(++_nodeMaxUid) as TNodeUid
            : String(++_nodeMaxUid) as TNodeUid

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
      }

      return nodes
    },
  })
  // build real tree data
  const tree: TNodeTreeData = {}
  let uids: TNodeUid[] = Object.keys(tmpTree)
  uids.map((uid) => {
    const node = tmpTree[uid]

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

  // set html, htmlInApp, code range to nodes
  const { html: formattedContent, htmlInApp: contentInApp } = serializeHtml(tree, htmlReferenceData, osType)

  return { formattedContent, contentInApp, tree, nodeMaxUid: String(_nodeMaxUid) as TNodeUid }
}
export const serializeHtml = (tree: TNodeTreeData, htmlReferenceData: THtmlReferenceData, osType: TOsType): THtmlNodeData => {
  // build html, htmlInApp
  let uids = getSubNodeUidsByBfs(RootNodeUid, tree)
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
        if (attr === 'class') {
          const className = (nodeData.attribs['class'] as string).split(' ').filter(className => !!className).join(' ')
          if (className === '') return
          return ` class="${className}"`
        }

        const attrContent = nodeData.attribs[attr] as string
        return attrContent === '' ? ` ${attr}` : ` ${attr}="${attrContent}"`
      }).join('')
    let attribsHtmlInApp = nodeData.attribs === undefined ? '' :
      Object.keys(nodeData.attribs).map(attr => {
        const attrContent = nodeData.attribs[attr]
        return attrContent === '' ? ` ${attr}` : ` ${attr}="${attrContent}"`
      }).join('')

    // if (nodeData.type === 'tag' && nodeData.name === 'img') {
    //   attribsHtmlInApp += attribsHtmlInApp + ` onerror="this.onerror=null; this.src='${emptyImage}'"`
    // }
    // wrap with the current node
    if (nodeData.type === 'directive') {
      nodeHtml = `<${nodeData.data}>`
      nodeHtmlInApp = `<${nodeData.data}>`
    } else if (nodeData.type === 'comment' || nodeData.type === '!--...--') {
      nodeHtml = `<!--${nodeData.data}-->`
      nodeHtmlInApp = ``
    } else if (nodeData.type === 'text') {
      // replace "<" or ">" to "&lt;" and "&gt;", only in app
      nodeHtml = nodeData.data
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
        //issue : #238
        if (tagName === "a") {
          //console event on click
          attribsHtmlInApp = attribsHtmlInApp.replace("href", "onclick");
          nodeHtmlInApp = `<${tagName}${attribsHtmlInApp}
          >
          ${childrenHtmlInApp}</${tagName}>`;
        } else {
          nodeHtmlInApp = `<${tagName}${attribsHtmlInApp}>${childrenHtmlInApp}</${tagName}>`;
        }
      }
    } else {
      nodeHtml = childrenHtml
      nodeHtmlInApp = childrenHtmlInApp
    }

    // set html and htmlInApp
    nodeData.html = nodeHtml.replace('</!--...-->', '')
    if (nodeData.type === 'comment' || nodeData.type === '!--...--') {
      nodeData.htmlInApp = ''
    }
    else{
      nodeData.htmlInApp = nodeHtmlInApp
    }
  })
  // set code range to nodes
  const { html: formattedContent } = tree[RootNodeUid].data as THtmlNodeData
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
    
    const beforeHtmlArr = beforeHtml.split(getLineBreaker(osType))
    const startLineNumber = beforeHtmlArr.length - Number(uid === RootNodeUid)
    const startColumn = (beforeHtmlArr.pop()?.length || 0) + 1 - Number(uid === RootNodeUid)
    
    const contentArr = html.split(getLineBreaker(osType))
    const endLineNumber = startLineNumber + contentArr.length - 1 + Number(uid === RootNodeUid)
    const endColumn = (contentArr.length === 1 ? startColumn : 1) + (contentArr.pop()?.length || 0) + Number(uid === RootNodeUid)

    node.data = {
      ...node.data,
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn,
    }
  })

  return tree[RootNodeUid].data as THtmlNodeData
}
export const parseHtmlCodePart = (content: string, htmlReferenceData: THtmlReferenceData, osType: TOsType, nodeMaxUid: TNodeUid = ''): THtmlParserResponse => {
  let _nodeMaxUid = Number(nodeMaxUid)

  // parse html
  const tmpTree: TNodeTreeData = {}
  ReactHtmlParser(content, {
    decodeEntities: true,
    transform: (node, index, transform) => {
      if ((node as THtmlDomNodeData).type === 'tag' && (htmlReferenceData.elements[(node as THtmlDomNodeData).name] || (node as THtmlDomNodeData).name.indexOf('-') !== -1)) {
        node.valid = true
      }
      else{
        node.valid = false
      }
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
        const uid = String(++_nodeMaxUid) as TNodeUid

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
          const uid = String(++_nodeMaxUid) as TNodeUid

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
      }

      return nodes
    },
  })
  // build real tree data
  const tree: TNodeTreeData = {}
  let uids: TNodeUid[] = Object.keys(tmpTree)
  uids.map((uid) => {
    const node = tmpTree[uid]

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
  // set html, htmlInApp, code range to nodes
  const { html: formattedContent } = serializeHtml(tree, htmlReferenceData, osType)

  return { formattedContent, contentInApp: '', tree, nodeMaxUid: String(_nodeMaxUid) as TNodeUid }
}

export const checkValidHtml = (content: string): boolean => {
  // remove code & pre & script tag's content
  const tmpString = content.replace(/<pre\b[^<]*(?:(?!<\/pre>)<[^<]*)*<\/pre>/gi, '<pre></pre>').replace(/<code\b[^<]*(?:(?!<\/code>)<[^<]*)*<\/code>/gi, '<code></code>').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '<script></script>').replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '<style></style>');
  let hasMismatchedTags = false   
  let openingTags = [];
  let closingTags = [];
  let regex = /<\/?[a-zA-Z0-9]+\b[^>]*>/g; // Matches any HTML tag
  let match = regex.exec(tmpString);
  while (match) {
    let tag = match[0];
    if (tag.startsWith('</')) {
      let _tag = tag.slice(2, -1).split(' ')[0].replace('\n', '')
      if (noNeedClosingTag.find(_item => _tag === _item) === undefined) {
        closingTags.push(_tag);
      }
    } else {
      let _tag = tag.slice(1, -1).split(' ')[0].replace('\n', '')
      if (noNeedClosingTag.find(_item => _tag === _item) === undefined) {
        openingTags.push(_tag);
      }
    }
    match = regex.exec(tmpString);
  }
  if (openingTags.length !== closingTags.length) {
    hasMismatchedTags = true; // Different number of opening and closing tags
  }
  else {
    openingTags.sort()
    closingTags.sort()
    for (let i = 0 ; i < openingTags.length ; i ++) {
      if (openingTags[i] !== closingTags[i])
        hasMismatchedTags = true
    }
  }

  return hasMismatchedTags
}