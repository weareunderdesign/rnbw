import * as prettier from "prettier/standalone";
import * as htmlParser from "prettier/plugins/html";
import { Range, editor } from "monaco-editor";
import { useAppState } from "@_redux/useAppState";
import { useContext, useMemo } from "react";
import { MainContext } from "@_redux/main";
import { getObjKeys } from "@_pages/main/helper";
import { LogAllow } from "@_constants/global";
import { html_beautify } from "js-beautify";
import {
  sortUidsByMaxEndIndex,
  sortUidsByMinStartIndex,
} from "@_components/main/actionsPanel/nodeTreeView/helpers";
import { toast } from "react-toastify";

export async function PrettyCode(code: string, startCol: number = 0) {
  try {
    let prettyCode = await prettier.format(code, {
      parser: "html",
      plugins: [htmlParser],
    });

    /*  When prettier receives the code, it formats it as independent code (as a separate file),
      and it does not take into account that you need to keep some initial tabs or spaces
      to make this code look formatted relative to the other code.
         
      The following code checks if the code starts with tabs/spaces and includes
      them in each line to make it consistent with the rest of the code.
      This code also checks for blank lines and removes them. 
      
      startCol - the position from which the line with the code begins. */

    if (startCol > 1) {
      const lines = prettyCode.split("\n");
      const nonEmptyLines = lines.filter((line) => !/^\s*$/.test(line));
      const spaces = " ".repeat(startCol - 1);

      const linesWithSpaces = nonEmptyLines.map((line, index) => {
        return index === 0 ? line : spaces + line;
      });

      prettyCode = linesWithSpaces.join("\n");
    }
    return prettyCode;
  } catch (e) {
    console.error(e);
    //@ts-expect-error - toast.error expects a string
    const msg = e?.message as string;
    if (msg) {
      toast.error(`Failed to format the code: ${msg.split(".")[0]}`);
    }
    return code;
  }
}
export const useElementHelper = () => {
  const { nSelectedItemsObj, validNodeTree } = useAppState();
  const { monacoEditorRef } = useContext(MainContext);

  const selectedItems = useMemo(
    () => getObjKeys(nSelectedItemsObj),
    [nSelectedItemsObj],
  );
  function getEditorModelWithCurrentCode() {
    /*The role of helperModel is to perform all the edit operations in it 
  without affecting the actual codeViewInstanceModel and then apply the changes 
  to the codeViewInstanceModel all at once.*/
    const codeViewInstanceModel = monacoEditorRef.current?.getModel();
    const helperModel = editor.createModel("", "html");
    codeViewInstanceModel &&
      helperModel.setValue(codeViewInstanceModel.getValue());
    return helperModel;
  }
  function checkAllResourcesAvailable() {
    const codeViewInstanceModel = monacoEditorRef.current?.getModel();
    if (selectedItems.length === 0) return false;
    if (!codeViewInstanceModel) {
      LogAllow &&
        console.error(
          `Monaco Editor ${!codeViewInstanceModel ? "" : "Model"} is undefined`,
        );
      return false;
    }
    return true;
  }

  async function copyAndCutNode({
    selectedUids,
    pasteToClipboard = true,
    sortDsc = false,
  }: {
    selectedUids?: string[];
    pasteToClipboard?: boolean;
    sortDsc?: boolean;
  } = {}) {
    const codeViewInstanceModel = monacoEditorRef.current?.getModel();
    const selected = selectedUids || selectedItems;
    const helperModel = getEditorModelWithCurrentCode();

    /* We are sorting nodes from the max to the min because this way the nodes of max index are deleted first and they do not affect the nodes with index lower to them in terms of the source code location*/
    const sortedUids = sortDsc
      ? sortUidsByMaxEndIndex(selected, validNodeTree)
      : sortUidsByMinStartIndex(selected, validNodeTree);
    let copiedCode = "";

    sortedUids.forEach((uid) => {
      const node = validNodeTree[uid];
      if (node) {
        const { startLine, startCol, endLine, endCol } =
          node.data.sourceCodeLocation;
        const text =
          codeViewInstanceModel &&
          codeViewInstanceModel.getValueInRange(
            new Range(startLine, startCol, endLine, endCol),
          );
        copiedCode += text;

        // remove the copied code from the original code
        const edit = {
          range: new Range(startLine, startCol, endLine, endCol),
          text: "",
        };
        helperModel.applyEdits([edit]);
      }
    });
    copiedCode = html_beautify(copiedCode);
    pasteToClipboard &&
      (await window.navigator.clipboard.writeText(copiedCode));
    const updatedCode = helperModel.getValue();
    return {
      sortedUids,
      copiedCode,
      updatedCode,
    };
  }
  return {
    getEditorModelWithCurrentCode,
    checkAllResourcesAvailable,
    copyAndCutNode,
  };
};
