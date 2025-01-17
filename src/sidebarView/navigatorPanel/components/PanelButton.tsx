import React from "react";
import { useDispatch } from "react-redux";

import { setActivePanel, setShowActionsPanel } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";

export const PanelButton = () => {
  const dispatch = useDispatch();
  const { showActionsPanel } = useAppState();

  return (
    <div
      style={{ display: "none" }}
      onClick={(e) => {
        e.stopPropagation();
        dispatch(setShowActionsPanel(!showActionsPanel));
        dispatch(setActivePanel("none"));
      }}
    />
  );
};
