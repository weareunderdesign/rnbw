import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { SVGIconI } from "@_components/common";
import { setShowActionsPanel } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";

export const PanelButton = () => {
  const dispatch = useDispatch();
  const { showActionsPanel } = useAppState();
  const [isHover, setIsHovered] = useState(false);

  useEffect(() => {
    const actionPanel = document.getElementById("ActionsPanel");

    if (!actionPanel) return;

    const handleMouseEnter = () => {
      setIsHovered(true);
    };
    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    actionPanel.addEventListener("mouseenter", handleMouseEnter);
    actionPanel.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      actionPanel.removeEventListener("mouseenter", handleMouseEnter);
      actionPanel.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      className={`action-button ${!isHover && showActionsPanel ? "action-button-hidden" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        dispatch(setShowActionsPanel(!showActionsPanel));
      }}
    >
      <SVGIconI {...{ class: "icon-xs" }}>
        {showActionsPanel ? "left" : "right"}
      </SVGIconI>
    </div>
  );
};
