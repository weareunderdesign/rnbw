import useRnbw from "@_services/useRnbw";
import { Range, editor } from "monaco-editor";

// helperModel added to update the code in the codeViewInstanceModel
// once when the action is executed, this improves the History Management
const helperModel = editor.createModel("", "html");

import * as prettier from "prettier/standalone";
import * as htmlParser from "prettier/plugins/html";
import { sortUidsByMaxEndIndex } from "@_components/main/actionsPanel/nodeTreeView/helpers";
import { useAppState } from "@_redux/useAppState";

async function PrettyCode(code: string) {
  const prettyCode = await prettier.format(code, {
    parser: "html",
    plugins: [htmlParser],
  });

  return prettyCode;
}

export default function useFormatCode() {
  const { validNodeTree } = useAppState();
  const rnbw = useRnbw();
  async function formatCode() {
    const codeViewInstanceModel = rnbw.files.getEditorRef().current?.getModel();
    if (!codeViewInstanceModel) return;

    helperModel.setValue(codeViewInstanceModel.getValue());

    const selectedElements = rnbw.elements.getSelectedElements();
    const sortedUids = sortUidsByMaxEndIndex(selectedElements, validNodeTree);

    const edits = await Promise.all(
      sortedUids.map(async (uid) => {
        const node = rnbw.elements.getElement(uid);
        if (!node) return null;

        const { startLine, startCol, endLine, endCol } =
          node.data.sourceCodeLocation;
        const range = new Range(startLine, startCol, endLine, endCol);

        let text = await PrettyCode(
          codeViewInstanceModel.getValueInRange(range),
        );

        if (startCol > 1) {
          const lines = text.split("\n");
          const nonEmptyLines = lines.filter((line) => !/^\s*$/.test(line));
          const spaces = " ".repeat(startCol - 1);

          const linesWithSpaces = nonEmptyLines.map((line, index) => {
            return index === 0 ? line : spaces + line;
          });

          text = linesWithSpaces.join("\n");
        }

        return { range, text };
      }),
    );

    edits.forEach((edit) => {
      if (edit) {
        helperModel.applyEdits([edit]);
      }
    });

    const code = helperModel.getValue();
    codeViewInstanceModel.setValue(code);
  }

  const config = {
    name: "Format Code",
    action: formatCode,
    description: "Format selected elements code",
    shortcuts: ["cmd+shift+f"],
  };

  return config;
}
