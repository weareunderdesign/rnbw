import { useContext, useEffect } from "react";

import { MainContext } from "@_redux/main";

import { useAppState } from "@_redux/useAppState";
import { html_beautify } from "js-beautify";

export const useCmdk = () => {
  const { activePanel, currentCommand } = useAppState();
  const { monacoEditorRef } = useContext(MainContext);

  const onFormatting = () => {
    const model = monacoEditorRef.current?.getModel();

    if (!model) {
      console.error("Monaco Editor model is undefined");
      return;
    }
    const content = html_beautify(model.getValue());
    model.setValue(content);
  };

  useEffect(() => {
    if (!currentCommand) return;

    if (activePanel !== "node" && activePanel !== "stage") return;

    switch (currentCommand.action) {
      case "Formatting":
        onFormatting();
        break;
      default:
        break;
    }
  }, [currentCommand]);
};
