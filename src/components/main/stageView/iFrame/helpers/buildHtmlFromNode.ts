import { TNodeTreeData } from "@_node/types";

export const buildHtmlFromNode = (node: any, nodeTree: TNodeTreeData) => {
  const { name, children, data } = node;

  let html = `<${name}`;

  if (data && data.attribs) {
    for (const key in data.attribs) {
      html += ` ${key}="${data.attribs[key]}"`;
    }
  }

  html += ">";

  if (data && data.data) {
    html += data.data;
  }

  if (children) {
    for (const childUid of children) {
      const child = nodeTree[childUid];
      if (child) {
        html += buildHtmlFromNode(child, nodeTree);
      }
    }
  }

  html += `</${name}>`;

  return html;
};
