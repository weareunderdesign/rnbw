import { useCallback, useContext, useEffect } from "react";

import { MainContext } from "@_redux/main";
import { useAppState } from "@_redux/useAppState";

/* eslint-disable @typescript-eslint/no-var-requires */
const Prettier = require("prettier/standalone");
const htmlParser = require("prettier/parser-html");

async function PrettyCode(code: string) {
  const prettyCode = await Prettier.format(code, {
    parser: "html",
    plugins: [htmlParser],
  });
  return prettyCode;
}
const useCmdk = () => {
  const { activePanel, currentCommand } = useAppState();
  const { monacoEditorRef } = useContext(MainContext);

  const onFormat = useCallback(async () => {
    const model = monacoEditorRef.current?.getModel();
    if (!model) return;

    const content = await PrettyCode(model.getValue());
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
