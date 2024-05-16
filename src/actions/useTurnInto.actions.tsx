import useRnbw from "@_services/useRnbw";
import { Range, editor } from "monaco-editor";

// helperModel added to update the code in the codeViewInstanceModel
// once when the action is executed, this improves the History Management
const helperModel = editor.createModel("", "html");

export default function useTurnInto() {
  const rnbw = useRnbw();
  const selectedElements = rnbw.elements.getSelectedElements();

  function turnInto(tagName: string) {
    selectedElements.forEach((uid) => {
      //replace the tag name
      const node = rnbw.elements.getElement(uid);
      if (node) {
        const { startCol, startLine, endCol, endLine } =
          node.data.sourceCodeLocation;

        const edit = {
          range: new Range(startLine, startCol, endLine, endCol),
          text: `<${tagName}>${node.data.content}</${tagName}>`,
        };
        helperModel.applyEdits([edit]);
      }
    });
  }

  const config = {
    name: "Turn Into",
    action: turnInto,
    description: "Turn selected elements into a new tag",
    shortcuts: ["cmd+shift+t"],
  };

  return config;
}
