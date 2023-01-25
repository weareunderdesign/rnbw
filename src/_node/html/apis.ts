import ReactHtmlParser from 'react-html-parser';

import { TOS } from '@_types/main';

import {
  generateNodeUid,
  getBfsUids,
  TNode,
  TTree,
  TUid,
} from '../';
import {
  THtmlParserResponse,
  THtmlReference,
  THtmlReferenceData,
  THtmlTagAttributes,
} from './types';

/**
 * It will parse the content and build the tree data
 * @param content 
 * @returns 
 */
export const parseHtml = (content: string, htmlReferenceData: THtmlReferenceData, os: TOS): THtmlParserResponse => {
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

    let hasOrgClass: boolean = true

    if (data.attribs === undefined) {
      data.attribs = {}
    }
    if (data.attribs.class === undefined) {
      hasOrgClass = false
      data.attribs.class = `rnbwdev-rainbow-component-${uid.replace(/\?/g, '-')}`
    } else {
      data.attribs.class += ` rnbwdev-rainbow-component-${uid.replace(/\?/g, '-')}`
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
        hasOrgClass,
      },
    }
  })

  // console.log('PARSED TREE', JSON.parse(JSON.stringify(tree)))

  // set html and its range on codeview
  let newContent = serializeHtml(tree, htmlReferenceData)
  // console.log('PARSED TREE with HTML', JSON.parse(JSON.stringify(tree)))
  let detected: Map<string, number> = new Map<string, number>()

  uids.map((uid) => {
    const node = tree[uid]

    if (!node.data.valid) return

    // set the html range
    const { html } = node.data
    const htmlArr = newContent.split(html)
    const detectedCount = detected.get(html) || 0
    const beforeHtml = htmlArr.slice(0, detectedCount + 1).join(html)

    uid !== 'ROOT' && detected.set(html, detectedCount + 1)

    // console.log(beforeHtml, beforeHtml.split(os === 'Windows' ? `\r\n` : `\n`).length)

    const beforeHtmlArr = beforeHtml.split(os === 'Windows' ? `\r\n` : `\n`)
    const startLineNumber = beforeHtmlArr.length
    const startColumn = (beforeHtmlArr.pop()?.length || 0) + 1
    const contentArr = html.split(os === 'Windows' ? `\r\n` : `\n`)
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
export const serializeHtml = (tree: TTree, htmlReferenceData: THtmlReferenceData): string => {
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
      let attrContent: string = data.attribs[attr]
      if (attr === 'class') {
        const classHtml = attrContent.split(' ').filter((className: string) => !!className && className !== `rnbwdev-rainbow-component-${uid.replace(/\?/g, '-')}`).join(' ')
        if (classHtml.length === 0 && data.hasOrgClass === false) return ''
        attrContent = classHtml
      }
      if (attr === 'style') {
        // do nothing
      }
      return attrContent === '' ? ` ${attr}` : ` ${attr}="${attrContent}"`
    }).join('')

    if (data.type === 'directive') {
      nodeHtml = `<${data.data}>`
    } else if (data.type === 'comment') {
      nodeHtml = `<!--${data.data}-->`
    } else if (data.type === 'text') {
      nodeHtml = data.data.replace(/</g, `&lt;`).replace(/>/g, `&gt;`)
    } else if (data.type === 'script' || data.type === 'style') {
      nodeHtml = `<${data.type}${attribsHtml}>${childrenHtml}</${data.type}>`
    } else if (data.type === 'tag') {
      let isEmptyTag: boolean = false

      if (htmlReferenceData[data.name] !== undefined) {
        const refData: THtmlReference = htmlReferenceData[data.name]
        // console.log('SerializeHtml API', refData)
        if (refData.Content === 'None') {
          isEmptyTag = true
          nodeHtml = `<${data.name}${attribsHtml}>`
        }
      }

      if (!isEmptyTag) {
        // need to remove this condition when the reference is perfect
        if (data.name === 'meta' || data.name === 'link'
          || data.name === 'br' || data.name === 'hr'
          || data.name === 'source' || data.name === 'input'
          || data.name === 'area' || data.name === 'col' || data.name === 'wbr') {
          isEmptyTag = true
          nodeHtml = `<${data.name}${attribsHtml}>`
        }
      }

      if (!isEmptyTag) {
        nodeHtml = `<${data.name}${attribsHtml}>${childrenHtml}</${data.name}>`
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

      const styleStr = attrs['style']
      const styles: string[] = styleStr.replace(/ |\r|\n/g, '').split(';')
      styles.map((style: string) => {
        const _style = style.split(':')
        if (_style.length === 2) {
          const styleName = _style[0]
          const styleValue = _style[1]
          const newStyleName = styleName.replace(/-./g, c => c.substr(1).toUpperCase())
          newAttr['style'][newStyleName] = styleValue
        }
      })
    } else {
      const newAttrName = attrName === 'class' ? 'className' :
        attrName === 'data-theme' ? 'datatheme' :
          attrName === 'charset' ? 'charSet' :
            attrName === 'contenteditable' ? 'contentEditable' :
              attrName === 'onsubmit' ? 'onSubmit' :
                attrName === 'for' ? 'htmlFor' :
                  attrName === 'datetime' ? 'dateTime' :
                    attrName === 'srcset' ? 'srcSet' :
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