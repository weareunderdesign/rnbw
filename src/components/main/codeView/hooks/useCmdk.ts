import { useCallback, useContext, useEffect } from "react";

import { html_beautify } from "js-beautify";

import { MainContext } from "@_redux/main";
import { useAppState } from "@_redux/useAppState";

const useCmdk = () => {
  const { activePanel, currentCommand } = useAppState();
  const { monacoEditorRef } = useContext(MainContext);

  const onFormat = useCallback(() => {
    const model = monacoEditorRef.current?.getModel();
    if (!model) return;

    const content = html_beautify(model.getValue());
    model.setValue(content);
  }, []);

  useEffect(() => {
    if (!currentCommand || activePanel !== "code") return;

    switch (currentCommand.action) {
      case "Format":
        onFormat();
        break;
      default:
        break;
    }
  }, [currentCommand]);
};

export default useCmdk;
