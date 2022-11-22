import {
  Element,
  Text,
} from 'domhandler';
import parse, { DOMNode } from 'html-react-parser';

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

  const root_element: TNode = {
    uid: "root",
    p_uid: "",
    name: "root",
    isEntity: false,
    children: [],
    data: null
  }
  root["root"] = root_element
  const getName = (element: DOMNode) => {
    return element.type == "text"
      ? (element as unknown as Text).data
      : (element as unknown as Element).name
  }
  parse(content, {
    replace: (node: DOMNode) => {
      console.log(node, node.type)
      if (node.type == "comment" || node.type == "doctype" || node.type == "cdata" || node.type == "script" || node.type == "directive") {
        return;
      }
      if (node.type == "text") {
        const converted_string = (node as unknown as Text).data.replace(/(\n|\t)/g, ' ').replace(/\s+/g, ' ').split(' ').filter(s => !!s).join(' ');
        console.log(JSON.stringify((node as unknown as Text).data), converted_string.length)
        if (converted_string.length == 0) return;
        (node as unknown as Text).data = converted_string
      }
      if (node.parent == null) {
        const CID = generateNodeUid("root", root["root"].children.length + 1)
        root[CID] = {
          uid: CID,
          p_uid: "root",
          name: getName(node),
          children: [],
          data: node,
          isEntity: node.type !== 'text'
          // nodeType: node.type
        } as TNode
        root["root"].children?.push(CID)
        uids.set(node, CID)
      } else {
        const PID = uids.get(node.parent) as TUid
        const CID = generateNodeUid(PID, root[PID].children.length + 1)
        root[CID] = {
          uid: CID,
          p_uid: PID,
          name: getName(node),
          children: [],
          data: node,
          isEntity: node.type !== 'text',
          // nodeType: node.type
        } as TNode
        root[PID].children?.push(CID)
        uids.set(node, CID)
      }
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
  console.log(data)
  const getHTMLFromFNObject = (UID: string, level: number) => {
    const element: TNode = data[UID] as TNode
    let element_html: string = ""
    console.log("UID:", UID, "data:", data[UID])
    if (element.isEntity === false) {
      element_html = "\t".repeat(level) + element.name + "\n";
    }
    else {
      element_html = "\t".repeat(level) + `<${element.name}>` + "\n"
      element_html += element.children?.reduce((result, item) => {
        return result + getHTMLFromFNObject(item, level + 1)
      }, '');
      element_html += "\t".repeat(level) + `</${element.name}>` + "\n"
    }
    return element_html
  }

  for (const child of (root.children || [])) {
    html += getHTMLFromFNObject(child, 0)
  }
  return html
}