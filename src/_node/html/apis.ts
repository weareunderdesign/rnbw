import ReactHtmlParser from 'react-html-parser';

import {
  Button,
  Container,
  Text,
} from '@_components/main/stageView/nodeRenderer';

import {
  generateNodeUid,
  getBfsUids,
  getDfsUids,
  TNode,
  TTree,
  TUid,
} from '../';
import {
  Attributes,
  THtmlInfo,
  THtmlParserResponse,
} from './types';

/**
 * It will parse the content and build the tree data
 * @param content 
 * @returns 
 */
export const parseHtml = (content: string): THtmlParserResponse => {
  const tree: TTree = {}
  const tmpTree: TTree = {}

  // parse html using react-html-parser
  interface ProcessableNode extends HTMLElement {
    uid: TUid,
  }
  type ProcessableNodes = ProcessableNode[]
  ReactHtmlParser(content, {
    decodeEntities: true,
    transform: (node, index, transform) => {
      node.valid = true
    },
    preprocessNodes: (_nodes: ProcessableNodes) => {
      tmpTree['ROOT'] = {
        uid: 'ROOT',
        p_uid: null,
        name: 'ROOT',
        isEntity: false,
        children: [],
        data: {},
      }

      // build the depth-1 seed nodes
      const seedNodes: TNode[] = []
      _nodes.map((_node, _index) => {
        const uid = generateNodeUid('ROOT', _index + 1)
        _node.uid = uid
        tmpTree['ROOT'].children.push(uid)
        tmpTree[uid] = {
          uid,
          p_uid: 'ROOT',
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
        if (_node.data.children === undefined || _node.data.children.length === 0) continue
        _node.data.children.map((_child: ProcessableNode, _index: number) => {
          const uid = generateNodeUid(_node.uid, _index + 1)
          _child.uid = uid
          _node.children.push(uid)
          _node.isEntity = false
          tmpTree[uid] = {
            uid,
            p_uid: _node.uid,
            name: '',
            isEntity: true,
            children: [],
            data: _child,
          }
          seedNodes.push(tmpTree[uid])
        })
      }

      return _nodes
    },
  })

  // validate the nodes
  let uids: TUid[] = Object.keys(tmpTree)
  uids = getDfsUids(uids)

  let info: THtmlInfo = {
    titles: [],
    links: [],
  }

  uids.map((uid) => {
    const node = tmpTree[uid]
    const { data } = node

    // set isFormatText & valid
    let isFormatText: boolean = false
    let valid: boolean = true
    if (uid === 'ROOT') {
      // do nothing
    } else if (data.valid !== true) {
      valid = false
      isFormatText = true
    } else {
      if (data.type === 'directive') {
        valid = false
      } else if (data.type === 'comment') {
        valid = false
      } else if (data.type === 'text') {
        valid = false
      } else if (data.type === 'script') {
        valid = false
      } else if (data.type === 'style') {
        valid = false
      } else if (data.type === 'tag') {
        if (data.name === 'meta') {
          valid = false
        } else if (data.name === 'link') {
          info.links.push(data.attribs)
          valid = false
        } else if (data.name === 'title') {
          let title: string = ''
          if (data.children.length !== 0) {
            title = data.children[0].data
          }
          info.titles.push(title)
          valid = false
        } else if (data.name === 'html') {
          valid = false
        } else if (data.name === 'head') {
          valid = false
        } else {
          // do nothing
        }
      } else {
        // do nothing
      }

      valid = (data.type !== 'text')
    }

    tree[uid] = {
      ...node,
      name: uid === 'ROOT' ? 'ROOT' : (data.name || data.type),
      data: {
        valid,
        isFormatText,
        type: data.type,
        name: data.name,
        data: data.data,
        attribs: data.attribs,
      },
    }
  })

  // set html and its range on codeview
  let newContent = serializeHtml(tree)
  let tmpContent = newContent
  let detected: Map<string, number> = new Map<string, number>()

  uids.map((uid) => {
    const node = tree[uid]

    // set the html range
    const { html } = node.data
    const htmlArr = tmpContent.split(html)
    const detectedCount = detected.get(html) || 0
    const beforeHtml = htmlArr.slice(0, detectedCount + 1).join(html)
    detected.set(html, detectedCount + 1)
    const beforeHtmlArr = beforeHtml.split(`\r\n`)
    const startLineNumber = beforeHtmlArr.length
    const startColumn = (beforeHtmlArr.pop()?.length || 0) + 1
    const contentArr = html.split(`\r\n`)
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

  // remove html props in the tree
  uids.map((uid) => {
    delete tree[uid].data.html
  })

  return { content: newContent, tree, info }
}

/**
 * It will generate html string from the tree data
 * @param tree 
 * @returns 
 */
export const serializeHtml = (tree: TTree): string => {
  let html: string = ``

  let uids: TUid[] = Object.keys(tree)
  uids = getBfsUids(uids)
  uids.reverse()

  uids.map((uid) => {
    const node = tree[uid]

    // collect children html
    let childrenHtml = ``
    node.children.map((c_uid) => {
      const child = tree[c_uid]
      childrenHtml += child.data.html
    })

    // wrap with the current node
    const { data } = node
    let nodeHtml = ``

    const attribsHtml = data.attribs === undefined ? '' : Object.keys(data.attribs).map(attr => ` ${attr}="${data.attribs[attr]}"`).join('')

    if (data.type === 'directive') {
      nodeHtml = `<${data.data}>`
    } else if (data.type === 'comment') {
      nodeHtml = `<!--${data.data}-->`
    } else if (data.type === 'text') {
      nodeHtml = data.data
    } else if (data.type === 'script') {
      nodeHtml = `<script${attribsHtml}>` + childrenHtml + `</script>`
    } else if (data.type === 'style') {
      nodeHtml = `<style${attribsHtml}>` + childrenHtml + `</style>`
    } else if (data.type === 'tag') {
      if (data.name === 'meta' || data.name === 'link' || data.name === 'img') {
        nodeHtml = `<${data.name}${attribsHtml} />`
      } else if (data.name === 'title') {
        nodeHtml = `<title>` + childrenHtml + `</title>`
      } else {
        nodeHtml = `<${data.name}${attribsHtml}>` + childrenHtml + `</${data.name}>`
      }
    } else {
      // do nothing
      nodeHtml = childrenHtml
    }

    node.data.html = nodeHtml
  })

  return tree['ROOT'].data.html
}

/**
 * return custom renderer name from the "name"
 * @param tagName 
 * @returns 
 */
export const getElementType = (tagName: string) => {
  if (tagName === 'ROOT' || tagName === 'html' || tagName === 'head' || tagName === 'body' /* || tagName === 'div' */) return Container
  if (tagName === 'text') return Text
  if (tagName === '!doctype' || tagName === 'comment') return 'invalid'
  return tagName
  
  switch (tagName) {
    case 'ROOT':
    case 'html':
    case 'head':
    case 'body':
    case 'div':
      return Container

    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
    case 'p':
    case 'span':
    // return PlainText

    case 'text':
      return Text

    case 'button':
      return Button

    case '!doctype':
    case 'comment':
      return 'invalid'

    default:
      return tagName
  }
}

/**
 * return if it's canvas or not - means droppable
 * @param tagName 
 * @returns 
 */
export const isCanvas = (tagName: string) => {
  return false
}

/**
 * get shortHand of attrs obj
 * @param attrs 
 */
export const getShortHand = (attrs: Attributes): Attributes => {
  const newAttr: Attributes = {}

  for (const attrName in attrs) {
    if (attrName === 'style') {
      newAttr['style'] = {}

      const style = attrs[attrName]
      for (const styleName in style) {
        const newStyleName = styleName.replace(/-./g, c => c.substr(1).toUpperCase())
        newAttr['style'][newStyleName] = style[styleName]
      }
    } else {
      const newAttrName = attrName === 'class' ? 'className' :
        attrName === 'charset' ? 'charSet' :
          attrName.replace(/-./g, c => c.substr(1).toUpperCase())

      newAttr[newAttrName] = attrs[attrName]
    }
  }

  return newAttr
}

/**
 * get long-hand of attrs obj
 * @param attrs 
 */
export const getLongHand = (attrs: Attributes) => {

}