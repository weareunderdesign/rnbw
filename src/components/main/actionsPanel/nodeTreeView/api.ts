import {
  Element,
  Text,
} from 'domhandler';
import parse, { DOMNode } from 'html-react-parser';

import {
  FileContent,
  FileExtension,
} from '@gtypes/ff';
import {
  FNFile,
  FNHtmlObject,
  FNNodeActionAddPayload,
  FNNodeActionDuplicatePayload,
  FNNodeActionMovePayload,
  FNNodeActionRemovePayload,
  FNNodeActionRenamePayload,
  FNObject,
} from '@gtypes/fn';
import { UID } from '@gtypes/global';
import { generateUID } from '@services/global';

// Parser/Serializer
const parseHTML = (content: FileContent): FNFile => {

    let root: FNFile = {};
    let uids: Map<DOMNode, string> = new Map<DOMNode, string>;

    const root_element: FNHtmlObject = {
        uid: "root",
        parentUID: "",
        name: "root",
        children: [],
        data: null,
        nodeType: '',
        elementType: ''
    }
    root["root"] = root_element
    const getName = (element: DOMNode) => {
        return element.type == "text"
            ? (element as unknown as Text).data
            : (element as unknown as Element).name
    }
    parse(content, {
        replace: (node: DOMNode) => {
            if (node.type == "text") {
                const converted_string = (node as unknown as Text).data.replace(/(\n|\t)/g, ' ').replace(/\s+/g, ' ').split(' ').filter(s => !!s).join(' ');
                console.log(JSON.stringify((node as unknown as Text).data), converted_string.length)
                if (converted_string.length == 0) return;
                (node as unknown as Text).data = converted_string
            }
            if (node.parent == null) {
                const CID = generateUID()
                root[CID] = {
                    uid: CID,
                    parentUID: "root",
                    name: getName(node),
                    children: [],
                    data: node,
                    nodeType: node.type
                } as FNObject
                root["root"].children?.push(CID)
                uids.set(node, CID)
            } else {
                const CID = generateUID()
                const PID = uids.get(node.parent) as UID
                root[CID] = {
                    uid: CID,
                    parentUID: PID,
                    name: getName(node),
                    children: [],
                    data: node,
                    nodeType: node.type
                } as FNObject
                root[PID].children?.push(CID)
                uids.set(node, CID)
            }
        }
    })
    // parsed_ele(content)
    // const parseElement = (element: string | JSX.Element | JSX.Element[], PID: string) => {
    //     const getName = (element: string | JSX.Element | JSX.Element[]) => {
    //         return typeof element == typeof "" ? element : element == null ? 'null' : (element as JSX.Element).type
    //     }
    //     const CID = generateUID()
    //     let item: FNHtmlObject = {
    //         uid: CID,
    //         parentUID: PID,
    //         name: getName(element),
    //         children: [],
    //         data: element,
    //         nodeType: getName(element),
    //         elementType: ""
    //     }
    //     root[CID] = item
    //     root[PID].children?.push(CID)

    //     if (typeof element == 'string') {
    //         (root[CID] as FNHtmlObject).nodeType = (element as unknown as string);
    //         console.log("string1", element);
    //     } else {
    //         console.log(Object.keys(element))
    //         if (element.hasOwnProperty("$$typeof") == true) {
    //             console.log("object", element);
    //             const props = (element as JSX.Element).props;
    //             if (props.hasOwnProperty("children") == true) {
    //                 const children = props.children;
    //                 console.log(children)
    //                 if (Array.isArray(children)) {
    //                     children.map((child_element: string | JSX.Element | JSX.Element[]) => {
    //                         console.log("child", child_element)
    //                         parseElement(child_element, CID)
    //                     })
    //                 } else if (children == null) {
    //                     console.log("no children");
    //                 } else {
    //                     console.log("element", children);
    //                     parseElement(children, CID)
    //                 }
    //             }
    //         } else {
    //             (root[CID] as FNHtmlObject).nodeType = (element as unknown as string);
    //             console.log("string2", element);
    //         }
    //     }
    // }
    // root["root"] = {
    //     uid: "root",
    //     parentUID: "",
    //     name: "root",
    //     children: [],
    // }
    // if (Array.isArray(root_element) == true) {
    //     (root_element as []).map((child_element: string | JSX.Element | JSX.Element[]) => {
    //         parseElement(child_element, "root")
    //     })
    // } else {
    //     parseElement(root_element, "root")
    // }
    return root
}
export const parseFileContent = (fileType: FileExtension, content: FileContent): FNFile => {
    if (fileType === "html") {
        return parseHTML(content)
    }
    return {}
}
const serializeFile = (data: FNFile): FileContent => {
    let html = ""
    const root: FNHtmlObject = data["root"] as FNHtmlObject

    // const getHTMLAttributes = (element: Element) => {
    //     let attributes = element.getAttributeNames();

    //     return attributes.reduce((result, attribute) => {
    //         const value = element.getAttribute(attribute)
    //         return value == null ? `${result} `.trim() : `${result} ${attribute}="${value}"`.trim()
    //     }, '')
    // }
    const getHTMLFromFNObject = (UID: string, level: number) => {
        const element: FNHtmlObject = data[UID] as FNHtmlObject
        let element_html: string = ""
        if (element.nodeType == 'text') {
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
    console.log(html)
    return html
}
export const serializeFileContent = (fileType: FileExtension, data: FNFile): FileContent => {
    if (fileType == "html") {
        return serializeFile(data)
    }
    return ''
}

// Node Actions
export const addFN = ({ uid, fnNode, data }: FNNodeActionAddPayload): FNFile => {
    let newData = data
    newData[uid].children?.push(fnNode.uid)
    newData[fnNode.uid] = fnNode
    return newData
}
export const removeFN = ({ fnNode, data }: FNNodeActionRemovePayload): FNFile => {
    let newData = data
    newData[fnNode.parentUID].children = newData[fnNode.parentUID].children?.filter((childUID: string) => childUID !== fnNode.uid)
    // data[fnNode.uid] = undefined
    delete newData[fnNode.uid]
    return newData
}
export const moveFN = ({ uid, fnNode, data }: FNNodeActionMovePayload): FNFile => {
    const changed_data = removeFN({ fnNode, data })
    console.log(changed_data)
    const final_data = addFN({ uid, fnNode, data: changed_data })
    console.log(final_data)
    return final_data
}
export const duplicateFN = ({ uid, fnNode, data }: FNNodeActionDuplicatePayload): FNFile => {
    fnNode.uid = generateUID()
    return addFN({ uid, fnNode, data })
}
export const renameFN = ({ uid, name, data }: FNNodeActionRenamePayload): FNFile => {
    data[uid].name = name;
    return data
}