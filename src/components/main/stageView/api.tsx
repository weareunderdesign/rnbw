import {
  Element,
  Text as TextElement,
} from 'domhandler';
import parse, {
  attributesToProps,
  DOMNode,
} from 'html-react-parser';

import { generateNodeUid } from '@_node/apis';
import {
  FreshNode,
  NodeId,
} from '@craftjs/core';

import {
  Button,
  Container,
  Text,
} from './components/selectors';

const convertStylesStringToObject = (stringStyles: string): Object => {
  const getShortHand = (style: string, ...values: (string | number)[]) => {
    if (values.length === 1) {
      return { [style]: values[0] }
    }
    const _genCss = (...values: (string | number)[]) => ({
      [style + 'Top']: values[0],
      [style + 'Right']: values[1],
      [style + 'Bottom']: values[2],
      [style + 'Left']: values[3],
    })
    if (values.length === 2) {
      return _genCss(values[0], values[1], values[0], values[1])
    }
    if (values.length === 3) {
      return _genCss(values[0], values[1], values[2], values[1])
    }
    return _genCss(values[0], values[1], values[2], values[3])
  }

  const padding = (...values: Array<number | string>) => getShortHand('padding', ...values)
  const margin = (...values: Array<number | string>) => getShortHand('margin', ...values)
  return typeof stringStyles == "string" ? stringStyles
    .split(';')
    .reduce((acc, style) => {
      const colonPosition = style.indexOf(':')

      if (colonPosition === -1) {
        return acc
      }
      const
        camelCaseProperty = style
          .substr(0, colonPosition)
          .trim()
          .replace(/^-ms-/, 'ms-')
          .replace(/-./g, c => c.substr(1).toUpperCase()),
        value = style.substr(colonPosition + 1).trim()
      if (value) {
        switch (camelCaseProperty) {
          case 'padding':
            return { ...acc, ...padding(value) }
          case 'margin':
            return { ...acc, ...margin(value) }
        }
      }
      return value ? { ...acc, [camelCaseProperty]: value } : acc
    }, {}) : {}

}

export const parseHtml = (content: string) => {
  //  nodetree style 
  // "node-a": {
  //     data: {
  //       type: "div",
  //       nodes: ["node-b", "node-c"]
  //     }
  //   },
  //
  let nodetree: Record<string, FreshNode> = {};

  let uids: Map<DOMNode, string> = new Map<DOMNode, NodeId>;
  // Create a new valid Node object from the fresh Node
  const getName = (element: DOMNode) => {
    if (element.type == 'text')
      return Text;
    switch ((element as Element).tagName) {
      case 'button':
        return Button;
      // case 'p': case 'span': case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
      //     return Text;
      case 'div':
        return Container;
      default:
        return (element as Element).tagName
    }
  }
  const isCanvas = (element: DOMNode) => {
    if (element.type == 'text')
      return false;

    if ((element as Element).tagName === 'div') return true;
    return false;
  }

  let root_child_cnt = 0
  let hasHTMLTag: boolean = false
  let body_tag_index: string

  try {
    parse(content, {
      replace: (node: DOMNode) => {
        // console.log(node, node.type)
        if (node.type == "comment" || node.type == "doctype" || node.type == "cdata" || node.type == "script" || node.type == "directive") {
          return;
        }
        if (node.type == "text") {
          const converted_string = (node as unknown as TextElement).data.replace(/(\n|\t)/g, ' ').replace(/\s+/g, ' ').split(' ').filter(s => !!s).join(' ');
          if (converted_string.length == 0) return;
          (node as unknown as TextElement).data = converted_string
        }

        let pid: string
        let cid: string

        if (node.parent == null) {
          cid = generateNodeUid("root", ++root_child_cnt);
          pid = "ROOT"
        } else {
          pid = uids.get(node.parent) as NodeId
          cid = generateNodeUid(pid, (nodetree[pid].data as any).nodes.length + 1);
        }
        if (node.type !== 'text') {
          (node as Element).tagName === 'html' ? hasHTMLTag = true : {};
          (node as Element).tagName === 'body' ? body_tag_index = cid : {};
        }

        if (node.type == "text") {
          (nodetree[pid].data.props as Record<string, any>)["children"] = (node as TextElement).data
          return
        }
        pid != "ROOT" ? (nodetree[pid].data as any).nodes.push(cid) : {}
        const props = attributesToProps((node as Element).attribs);
        // console.log(props)
        nodetree[cid] = {
          id: cid,
          data: {
            type: getName(node),
            props: {
              ...props
            } as Record<string, any>,
            parent: pid,
            nodes: [],
            isCanvas: isCanvas(node)
          },
        }
        uids.set(node, cid)
        // node.type === "text" ? nodetree[cid].data.props["text"] = (node as TextElement).data : {}
      }
    })
  } catch (err) {
    console.log(err)
  }

  // filter HTML tag, start <body> tag
  if (hasHTMLTag) {
    let node_temp_tree: Record<string, FreshNode> = {}
    Object.keys(nodetree).map((key) => {
      if (key.startsWith(body_tag_index) && key != body_tag_index) {
        if (nodetree[key].data.parent === body_tag_index)
          nodetree[key].data.parent = "ROOT"
        node_temp_tree[key] = nodetree[key]
      }
    })
    return node_temp_tree
  }
  return nodetree
}
// const replaceOptions: HTMLReactParserOptions = {
//     replace: (node: DOMNode) => {
//         /*@ts-ignore*/
//         const { name, children } = node;
//         if (children && ["body", "div", "ul", "ol"].includes(name)) {
//             return (
//                 <CraftElement is={Container} canvas>
//                     {
//                         domToReact(children, replaceOptions)
//                     }
//                 </CraftElement>
//             )
//         }
//     }
// };
// export const parseHtml2 = (content: string) => {

//     return parse(content, replaceOptions);

// }