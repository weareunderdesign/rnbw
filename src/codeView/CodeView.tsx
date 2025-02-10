import React, { useCallback } from "react";

import { useDispatch } from "react-redux";

import { setActivePanel } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import RnbwEditor from "./RnbwEditor";

export default function CodeView() {
  const dispatch = useDispatch();
  const { activePanel, codeErrors } = useAppState();

  const onPanelClick = useCallback(() => {
    activePanel !== "code" && dispatch(setActivePanel("code"));
  }, [activePanel]);

  return (
    <div
      id="CodeView"
      onDragCapture={(e) => {
        e.preventDefault();
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      style={{
        width: "100%",
        height: "100%",
        zIndex: 999,
        overflow: "hidden",
        ...(codeErrors
          ? {
              outlineWidth: "1px",
              outlineStyle: "solid",
              outlineOffset: "-1px",
              outlineColor: "var(--color-negative)",
            }
          : {}),
        transition: "0.3s all",
        borderLeft: 0,
      }}
      className={`border-left background-primary ${codeErrors && "border"}`}
      onClick={onPanelClick}
    >
      <RnbwEditor />
    </div>
  );
}
