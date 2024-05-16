import useRnbw from "@_services/useRnbw";
import { html_beautify } from "js-beautify";
import { Range, editor } from "monaco-editor";

// helperModel added to update the code in the codeViewInstanceModel
// once when the action is executed, this improves the History Management
const helperModel = editor.createModel("", "html");

export default function useTurnInto() {
  const rnbw = useRnbw();
  const selectedElements = rnbw.elements.getSelectedElements();

  function turnInto(tagName: string) {
    const codeViewInstanceModel = rnbw.files.getEditorRef().current?.getModel();
    if (!codeViewInstanceModel) return;
    helperModel.setValue(codeViewInstanceModel.getValue());

    selectedElements.forEach(async (uid) => {
      const node = rnbw.elements.getElement(uid);
      if (!node) return;
      const nodeAttribute = rnbw.elements.getElementSettings(uid);

      const attributeCode = Object.entries(nodeAttribute)
        .map(([attrName, attrValue]) => `${attrName}="${attrValue}"`)
        .join(" ");

      const { startTag, endTag, startLine, startCol, endLine, endCol } =
        node.data.sourceCodeLocation;
      if (!startTag || !endTag) return;
      const text = codeViewInstanceModel.getValueInRange(
        new Range(
          startTag.endLine,
          startTag.endCol,
          endTag.startLine,
          endTag.startCol,
        ),
      );
      const edit = {
        range: new Range(startLine, startCol, endLine, endCol),
        text: `<${tagName} ${attributeCode}>${text}</${tagName}>`,
      };
      helperModel.applyEdits([edit]);
    });
    const code = html_beautify(helperModel.getValue());
    codeViewInstanceModel.setValue(code);
  }

  const config = {
    name: "Turn Into",
    action: turnInto,
    description: "Turn selected elements into a new tag",
    shortcuts: ["cmd+shift+t"],
  };

  return config;
}
