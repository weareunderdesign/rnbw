import ReactHtmlParser from 'react-html-parser';

import {
  generateNodeUid,
  getBfsUids,
  TNode,
  TTree,
  TUid,
} from '../';
import {
  THtmlParserResponse,
  THtmlTagAttributes,
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
  interface ProcessableNode extends HTMLElement { uid: TUid }
  ReactHtmlParser(content, {
    decodeEntities: true,
    transform: (node, index, transform) => {
      node.valid = true
    },
    preprocessNodes: (_nodes: ProcessableNode[]) => {
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
      /* if (data.type === 'directive') {
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
          valid = false
        } else if (data.name === 'title') {
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
      } */

      valid = (data.type !== 'text')
    }

    if (data.attribs === undefined) {
      data.attribs = {}
    }
    if (data.attribs.class === undefined) {
      data.attribs.class = `rnbwdev-rainbow-component-${uid}`
    } else {
      data.attribs.class += ` rnbwdev-rainbow-component-${uid}`
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
  let detected: Map<string, number> = new Map<string, number>()

  uids.map((uid) => {
    const node = tree[uid]

    // set the html range
    const { html } = node.data
    const htmlArr = newContent.split(html)
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

  return { content: newContent, tree }
}

/**
 * It will generate html string from the tree data
 * @param tree 
 * @returns 
 */
export const serializeHtml = (tree: TTree): string => {
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

    const attribsHtml = data.attribs === undefined ? '' : Object.keys(data.attribs).map(attr => {
      if (attr === 'class') {
        const classHtml = data.attribs['class'].split(' ').filter((className: string) => !!className && className !== `rnbwdev-rainbow-component-${uid}`).join(' ')
        return classHtml.length === 0 ? '' : ` class="${classHtml}"`
      }
      if (attr === 'style') {
        // do nothing
      }
      return ` ${attr}="${data.attribs[attr]}"`
    }).join('')

    if (data.type === 'directive') {
      nodeHtml = `<${data.data}>`
    } else if (data.type === 'comment') {
      nodeHtml = `<!--${data.data}-->`
    } else if (data.type === 'text') {
      nodeHtml = data.data.replace(/</g, `&lt;`).replace(/>/g, `&gt;`)
    } else if (data.type === 'script') {
      nodeHtml = `<script${attribsHtml}>` + childrenHtml + `</script>`
    } else if (data.type === 'style') {
      nodeHtml = `<style${attribsHtml}>` + childrenHtml + `</style>`
    } else if (data.type === 'tag') {
      if (data.name === 'title') {
        nodeHtml = `<title>` + childrenHtml + `</title>`
      } else if (data.name === 'meta' || data.name === 'link' || data.name === 'img' || data.name === 'br') {
        nodeHtml = `<${data.name}${attribsHtml} />`
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
 * get shortHand of attrs obj
 * @param attrs 
 */
export const getShortHand = (attrs: THtmlTagAttributes): THtmlTagAttributes => {
  const newAttr: THtmlTagAttributes = {}

  for (const attrName in attrs) {
    if (attrName === 'style') {
      newAttr['style'] = {}

      const style = attrs['style']
      for (const styleName in style) {
        const newStyleName = styleName.replace(/-./g, c => c.substr(1).toUpperCase())
        newAttr['style'][newStyleName] = style[styleName]
      }
    } else {
      const newAttrName = attrName === 'class' ? 'className' :
        attrName === 'charset' ? 'charSet' :
          attrName === 'contenteditable' ? 'contentEditable' :
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
export const getLongHand = (attrs: THtmlTagAttributes): THtmlTagAttributes => {
  return {}
}