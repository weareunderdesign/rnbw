import {
  Element,
  Text,
} from 'domhandler';
import parse, { attributesToProps, DOMNode } from 'html-react-parser';

import {
  generateNodeUid,
  TNode,
  TTree,
  TUid,
} from '../';

/**
 * It will parse the content and build the tree data
 * @param content 
 * @returns 
 */
export const parseHtml = (content: string): TTree => {
  let root: TTree = {};
  let uids: Map<DOMNode, string> = new Map<DOMNode, string>;

  // root element
  const root_element: TNode = {
    uid: "root",
    p_uid: "",
    name: "root",
    isEntity: false,
    children: [],
    data: null
  }

  root["root"] = root_element

  /**
   * 
   * @param element current DomNode
   * @returns display DOM Name
   */
  const getName = (element: DOMNode) => {
    return element.type == "text"
      ? (element as unknown as Text).data
      : (element as unknown as Element).name
  }

  parse(content, {
    replace: (node: DOMNode) => {
      // We can parse only Element & Text node, the others are removed
      if (node.type == "comment" || node.type == "doctype" || node.type == "cdata" || node.type == "script" || node.type == "directive") {
        return;
      }


      if (node.type == "text") {
        // remove all tabs and lines in text
        const converted_string = (node as unknown as Text).data.replace(/(\n|\t)/g, ' ').replace(/\s+/g, ' ').split(' ').filter(s => !!s).join(' ');
        if (converted_string.length == 0) return;
        (node as unknown as Text).data = converted_string
      }

      let cid: string;
      let pid: string;

      if (node.parent == null) {
        pid = "root"
        cid = generateNodeUid("root", root["root"].children.length + 1)
      } else {
        pid = uids.get(node.parent) as TUid
        cid = generateNodeUid(pid, root[pid].children.length + 1)
      }

      if (node.type == "text") {
        // Text is children of Element tag, this is not node child.
        root[pid].data.children = (node as Text).data;
        return;
      }

      root[cid] = {
        uid: cid,
        p_uid: pid,
        name: getName(node),
        children: [],
        data: { // all attributes converted -> style, classNames, ... 
          ...attributesToProps((node as Element).attribs)
        }, // node props
        isEntity: true
        // nodeType: node.type
      } as TNode

      root[pid].children?.push(cid)
      root[pid].isEntity = false // set node to parent node
      uids.set(node, cid)
    }
  })

  return root
}

/**
 * It will generate html string from the tree data
 * @param tree 
 * @returns 
 */
export const serializeHtml = (data: TTree): string => {
  let html = ""
  const root: TNode = data["root"] as TNode

  /**
   * 
   * @param uid UID of TTree 
   * @param level children deeps, this is used for tabs
   * @returns html
   */
  const getHTMLFromFNObject = (uid: string, level: number) => {

    const element: TNode = data[uid] as TNode
    let element_html: string = ""

    // starting tag
    element_html = "\t".repeat(level) + `<${element.name}`;
    // attributes 
    if (element.data.classNames != undefined) {
      element_html += ` class="` + element.data.classNames + `"`;
    }
    if (element.data.style != undefined) {
      element_html += ` style="`
      Object.keys(element.data.style).map((css_name: string) => {
        const style_name = css_name.replace(/[A-Z]/g, c => '-' + c.substr(0).toLowerCase())
        element_html += `${style_name}:${element.data.style[css_name]};`
      })
      element_html += `"`
    }
    element_html += `>` + "\n"

    // children tages
    element_html += element.children?.reduce((result, item) => {
      return result + getHTMLFromFNObject(item, level + 1)
    }, '');

    if (element.data.children != undefined) {
      // Text is children data
      element_html += element.data.children;
    }

    // end tag
    element_html += "\t".repeat(level) + `</${element.name}>` + "\n"
    
    return element_html
  }

  for (const child of (root.children || [])) {
    html += getHTMLFromFNObject(child, 0)
  }
  return html
}