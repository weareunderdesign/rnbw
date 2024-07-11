import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { SVGIconI } from "@src/components";
import { setActivePanel, setShowActionsPanel } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";

export const PanelButton = () => {
  const dispatch = useDispatch();
  const { showActionsPanel } = useAppState();
  const [isHover, setIsHovered] = useState(false);
  const [isButtonHover, setIsButtonHover] = useState(false);

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

  const buttonStyle: React.CSSProperties = {
    visibility: (!isHover && showActionsPanel) ? 'hidden' : 'visible',
    padding: '4px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isButtonHover ? 'var(--color-secondary-background)' : 'transparent',
    borderRadius: isButtonHover ? '4px' : '0',
    cursor: 'pointer',
  };

  return (
    <div
      style={buttonStyle}
      onClick={(e) => {
        e.stopPropagation();
        dispatch(setShowActionsPanel(!showActionsPanel));
        dispatch(setActivePanel("none"));
      }}
      onMouseEnter={() => setIsButtonHover(true)}
      onMouseLeave={() => setIsButtonHover(false)}
    >
      <SVGIconI {...{ class: "icon-xs" }}>
        raincons/{showActionsPanel ? "left" : "right"}
      </SVGIconI>
    </div>
  );
};