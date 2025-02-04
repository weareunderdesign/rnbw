import useRnbw from "@_services/useRnbw";
import { Range } from "monaco-editor";

import { PrettyCode, useElementHelper } from "@_services/useElementsHelper";
import { useContext } from "react";
import { MainContext } from "@src/_redux/main";
import { notify } from "@src/services/notificationService";

export default function useTurnInto() {
  const rnbw = useRnbw();
  const { monacoEditorRef } = useContext(MainContext);
  const {
    isPastingAllowed,
    sortUidsDsc,
    findNodeToSelectAfterAction,
    setEditorModelValue,
    getEditorModelWithCurrentCode,
  } = useElementHelper();

  const selectedElements = rnbw.elements.getSelectedElements();

  async function turnInto(tagName: string) {
    const sortedUids = sortUidsDsc(selectedElements);
    const codeViewInstanceModel = monacoEditorRef.current?.getModel();
    if (!codeViewInstanceModel) return;

    // Checking if a parent component can have a tag as a child
    const { isAllowed } = isPastingAllowed({
      selectedItems: sortedUids,
      nodeToAdd: [tagName],
      checkFirstParents: true,
    });
    if (!isAllowed) {
      notify("error", `Turn into ${tagName} not allowed`);
      return;
    }

    const helperModel = getEditorModelWithCurrentCode();

    for (const uid of sortedUids) {
      const node = rnbw.elements.getElement(uid);
      if (!node) return;
      const nodeAttribute = rnbw.elements.getElementSettings(uid);

      // Getting existing tag attributes
      const attributeCode = Object.entries(nodeAttribute)
        .map(([attrName, attrValue]) => `${attrName}="${attrValue}"`)
        .join(" ");

      const { startTag, endTag, startLine, startCol, endLine, endCol } =
        node.data.sourceCodeLocation;
      if ((!startTag || !endTag) && node.displayName !== "#text") return;
      const innerCode = codeViewInstanceModel.getValueInRange(
        node.displayName === "#text"
          ? new Range(startLine, startCol, endLine, endCol)
          : new Range(
              startTag.endLine,
              startTag.endCol,
              endTag.startLine,
              endTag.startCol,
            ),
      );
      const newCode = `<${tagName} ${attributeCode}>${innerCode}</${tagName}>`;

      const formattedCode = await PrettyCode({ code: newCode, startCol });

      const edit = {
        range: new Range(startLine, startCol, endLine, endCol),
        text: formattedCode,
      };
      helperModel.applyEdits([edit]);
    }

    setEditorModelValue(helperModel, codeViewInstanceModel);

    await findNodeToSelectAfterAction({
      nodeUids: sortedUids,
      action: {
        type: "replace",
        tagNames: [tagName],
      },
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
