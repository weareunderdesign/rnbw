import { generateNodeUid } from '@_node/apis';
import {
    Element,
    Text as TextElement,
} from 'domhandler';
import { Node, NodeTree, NodeData, NodeId, FreshNode } from '@craftjs/core'
import parse, { DOMNode } from 'html-react-parser';

import { Container, Text } from './components/selectors';

const convertStylesStringToObject = (stringStyles: string): Object => typeof stringStyles == "string" ? stringStyles
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

        return value ? { ...acc, [camelCaseProperty]: value } : acc
    }, {}) : {}

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
        return element.type == "text"
            ? (element as unknown as TextElement).data
            : (element as unknown as Element).name
    }

    let root_child_cnt = 0

    parse(content, {
        replace: (node: DOMNode) => {

            // console.log(node, node.type)
            if (node.type == "comment" || node.type == "doctype" || node.type == "cdata" || node.type == "script" || node.type == "directive") {
                return;
            }
            if (node.type == "text") {
                const converted_string = (node as unknown as TextElement).data.replace(/(\n|\t)/g, ' ').replace(/\s+/g, ' ').split(' ').filter(s => !!s).join(' ');
                // console.log(JSON.stringify((node as unknown as Text).data), converted_string.length)
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
            pid != "ROOT" ? (nodetree[pid].data as any).nodes.push(cid) : {}
            nodetree[cid] = {
                id: cid,
                data: {
                    type: node.type != "text" ?  getName(node) : Text,
                    props: {
                        children: node.type === "text" ? getName(node) : [],
                        style: node.type !== "text" ? convertStylesStringToObject((node as Element).attribs["style"]) : {},
                    } as Record<string, any>,
                    parent: pid,
                    nodes: [],
                }
            }

            uids.set(node, cid)
            /*@ts-ignore*/
            node.type === "text" ? nodetree[cid].data.props["text"] = (node as TextElement).data : {}
        }
    })

    // filter HTML tag, start <body> tag

    return nodetree
}