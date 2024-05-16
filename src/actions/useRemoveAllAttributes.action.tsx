import useRnbw from "@_services/useRnbw";
import { Range, editor } from "monaco-editor";

// helperModel added to update the code in the codeViewInstanceModel
// once when the action is executed, this improves the History Management
const helperModel = editor.createModel("", "html");

export default function useRemoveAllAttributes() {
  const rnbw = useRnbw();
  function removeAllAttributes() {
    const selectedElements = rnbw.elements.getSelectedElements();
    selectedElements.forEach((uid) => {
      const node = rnbw.elements.getElement(uid);
      if (node) {
        const { startCol, startLine, endCol, endLine } =
          node.data.sourceCodeLocation;

        const edit = {
          range: new Range(startLine, startCol, endLine, endCol),
          text: `<${node.data.tagName}>${node.data.content}</${node.data.tagName}>`,
        };
        helperModel.applyEdits([edit]);
      }
    });
  }

  const config = {
    name: "Remove All Attributes",
    action: removeAllAttributes,
    description: "Remove all attributes from selected elements",
    shortcuts: ["cmd+alt+a"],
  };

  return config;
}
