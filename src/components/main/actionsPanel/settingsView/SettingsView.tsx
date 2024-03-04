import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { StageNodeIdAttr } from "@_node/file";
import { useAppState } from "@_redux/useAppState";
import { NodeActions } from "@_node/node";
import { LogAllow } from "@_constants/global";
import { MainContext } from "@_redux/main";
import { useDispatch } from "react-redux";
import { setActivePanel } from "@_redux/main/processor";

export const SettingsView = () => {
  const { nodeTree, nFocusedItem } = useAppState();
  const { monacoEditorRef } = useContext(MainContext);
  const dispatch = useDispatch();

  let excludedAttributes: string[] = [StageNodeIdAttr];

  const filteredAttributes = useMemo(
    () =>
      Object.entries(nodeTree[nFocusedItem]?.data?.attribs ?? {})
        .filter(([key]) => !excludedAttributes.includes(key))
        .reduce(
          (obj, [key, value]) => {
            obj[key] = value as string | boolean;
            return obj;
          },
          {} as Record<string, string | boolean>,
        ),
    [nFocusedItem, nodeTree],
  );

  const [attrArray, setAttrArray] = useState({ ...filteredAttributes });

  useEffect(() => {
    setAttrArray({ ...filteredAttributes });
  }, [filteredAttributes]);

  const handleBlur = useCallback(
    (attrName: string, attrValue: string) => {
      const codeViewInstance = monacoEditorRef.current;
      const codeViewInstanceModel = codeViewInstance?.getModel();

      if (!codeViewInstance || !codeViewInstanceModel) {
        LogAllow &&
          console.error(
            `Monaco Editor ${!codeViewInstance ? "" : "Model"} is undefined`,
          );
        return;
      }

      NodeActions.addAttr({
        attrName,
        attrValue,
        nodeTree,
        focusedItem: nFocusedItem,
        codeViewInstanceModel,
      });
    },
    [nodeTree, nFocusedItem, monacoEditorRef],
  );

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    key: string,
  ) => {
    setAttrArray({ ...attrArray, [key]: event.target.value });
  };

  return (
    <div id="SettingsView" style={{ padding: "16px 0" }}>
      {Object.keys(filteredAttributes).length > 0 && (
        <ul
          style={{
            display: "grid",
            gridTemplateRows: "repeat(auto-fit,  1fr)",
            height: "100%",
          }}
        >
          {Object.keys(filteredAttributes).map((key) => (
            <li
              key={key}
              className="align-center justify-start padding-s  gap-s"
              style={{ height: "28px" }}
            >
              <span className="text-s" style={{ width: "50px" }}>
                {key}
              </span>

              <input
                className="text-s"
                style={{
                  wordWrap: "break-word",
                  width: "100%",
                  minHeight: "14px",
                  background: "transparent",
                  outline: "none",
                  border: "none",
                }}
                value={(attrArray[key] || "") as string}
                onBlur={() => handleBlur(key, attrArray[key] as string)}
                onChange={(e) => handleChange(e, key)}
                onClick={() => dispatch(setActivePanel("settings"))}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
