import { THtmlDomNode } from "@_node/node";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

export const getPositionFromIndex = (
  editor: monaco.editor.IStandaloneCodeEditor,
  startIndex: number,
  endIndex: number,
) => {
  const position = editor.getModel()?.getPositionAt(startIndex as number);

  const startLineNumber = position?.lineNumber as number;
  const startColumn = position?.column as number;

  const endPosition = editor
    .getModel()
    ?.getPositionAt((endIndex as number) + 1);
  const endLineNumber = endPosition?.lineNumber as number;
  const endColumn = endPosition?.column as number;
  return {
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
  };
};

// Function to generate a stable identifier for a parse5 node
export function getNodeIdentifier(node: THtmlDomNode) {
  // Extract relevant information from the node
  const tag = node.tagName || "";
  const attributes = node.attrs ? JSON.stringify(node.attrs) : "";
  const content = node.value || "";

  // Combine the information to create a stable identifier
  const identifierData = `${tag}${attributes}${content}`;

  // Generate a SHA-256 hash as the stable identifier
  // Convert the string to an ArrayBuffer
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(identifierData);

  // Generate a SHA-256 hash as the stable identifier
  return window.crypto.subtle
    .digest("SHA-256", dataBuffer)
    .then((hashBuffer) => {
      // Convert the hash ArrayBuffer to a hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      return hashHex;
    });
}
