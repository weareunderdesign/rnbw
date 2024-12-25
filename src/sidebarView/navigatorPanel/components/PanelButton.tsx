import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { SVGIconI } from "@src/components";
import { setActivePanel, setShowActionsPanel } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";

export const PanelButton = () => {
  const dispatch = useDispatch();
  const { showActionsPanel } = useAppState();
  const [isHover, setIsHovered] = useState(false);

  useEffect(() => {
    const sidebarView = document.getElementById("ActionsPanel");
    if (!sidebarView) return;

    const handleMouseEnter = () => {
      setIsHovered(true);
    };
    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    sidebarView.addEventListener("mouseenter", handleMouseEnter);
    sidebarView.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      sidebarView.removeEventListener("mouseenter", handleMouseEnter);
      sidebarView.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      style={{ display: 'none' }}
      onClick={(e) => {
        e.stopPropagation();
        dispatch(setShowActionsPanel(!showActionsPanel));
        dispatch(setActivePanel("none"));
      }}
    />
  );
};