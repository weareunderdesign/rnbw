import React, { useEffect, useRef, useState } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  ImperativePanelHandle,
} from "react-resizable-panels";
import { useAppState } from "@_redux/useAppState";
import { CodeView, ResizablePanelsProps } from "../rnbw";
import RnbwEditor from "@src/codeView/RnbwEditor";

const CODEVIEWWIDTH = 25;

export default function ResizablePanels({
  sidebarView,
  designView,
}: ResizablePanelsProps) {
  const { showActionsPanel, showCodeView } = useAppState();
  const actionsPanelRef = useRef<ImperativePanelHandle>(null);
  const codeViewRef = useRef<ImperativePanelHandle>(null);

  const [isActionPanelHovered, setIsActionPanelHovered] = useState(false);
  const [isCodeViewHovered, setIsCodeViewHovered] = useState(false);
  const defaultActionsPanelWidthRef = useRef(0);
  const defaultCodeViewWidthRef = useRef("0px");

  const wrapperStyle: React.CSSProperties = {
    width: "2px",
    height: "100%",
    position: "absolute",
    zIndex: 10,
  };

  const codeViewWrapperStyle: React.CSSProperties = {
    width: showCodeView ? 0 : "32px",
    overflow: showCodeView ? "hidden" : "visible",
    height: "100%",
    position: "absolute",
    right: "0px",
    zIndex: 10,
  };

  const actionsPanelStyle: React.CSSProperties = {
    width: "240px",
    height: "100%",
    transform: isActionPanelHovered ? "translateX(0px)" : "translateX(-300px)",
  };

  const codeViewStyle: React.CSSProperties = {
    width: isCodeViewHovered ? defaultCodeViewWidthRef.current : "0px",
    overflow: showCodeView ? "hidden" : "visible",
    height: "100%",
    position: "absolute",
    right: "0px",
    zIndex: 10,
  };

  useEffect(() => {
    const handleResize = () => {
      const availableWidth = window.innerWidth;
      const targetWidthInPixels = 240;
      const calculatedWidth = (targetWidthInPixels / availableWidth) * 100;

      // Update actions panel width
      if (actionsPanelRef.current) {
        defaultActionsPanelWidthRef.current = calculatedWidth;
        if (showActionsPanel) {
          actionsPanelRef.current.resize(calculatedWidth);
        }
      }

      // Update code view width
      defaultCodeViewWidthRef.current = `${(CODEVIEWWIDTH * availableWidth) / 100}px`;
      if (codeViewRef.current && showCodeView) {
        codeViewRef.current.resize(CODEVIEWWIDTH);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial calculation

    return () => window.removeEventListener("resize", handleResize);
  }, [showActionsPanel, showCodeView]); // Add dependencies

  useEffect(() => {
    if (!showCodeView) {
      codeViewRef.current?.resize(0);
    }
  }, [showCodeView]);

  useEffect(() => {
    if (!showActionsPanel) {
      actionsPanelRef.current?.resize(0);
    }
  }, [showActionsPanel]);

  return (
    <>
      {!showActionsPanel && (
        <div
          style={wrapperStyle}
          onMouseEnter={() => setIsActionPanelHovered(true)}
          onMouseLeave={() => setIsActionPanelHovered(false)}
        >
          <div style={actionsPanelStyle}>{sidebarView}</div>
        </div>
      )}

      <div
        style={codeViewWrapperStyle}
        onMouseEnter={() => setIsCodeViewHovered(true)}
        onMouseLeave={() => setIsCodeViewHovered(false)}
      >
        <div style={codeViewStyle}>
          <CodeView>
            <RnbwEditor instanceId="preview" />
          </CodeView>
        </div>
      </div>

      <PanelGroup
        autoSaveId="rnbw-panel-group"
        style={{ height: "100vh" }}
        direction="horizontal"
      >
        <Panel
          ref={actionsPanelRef}
          id="rnbw-actions-panel"
          minSize={showActionsPanel ? defaultActionsPanelWidthRef.current : 0}
          order={1}
        >
          {sidebarView}
        </Panel>
        <PanelResizeHandle style={{ width: 0 }} />

        <Panel order={2} id="rnbw-design-view" minSize={10}>
          {designView}
        </Panel>

        <PanelResizeHandle style={{ width: 3 }} />
        <Panel
          ref={codeViewRef}
          id="rnbw-code-view"
          minSize={showCodeView ? CODEVIEWWIDTH : 0}
          order={3}
          onMouseEnter={() => setIsCodeViewHovered(true)}
          onMouseLeave={() => setIsCodeViewHovered(false)}
        >
          <CodeView>
            <RnbwEditor instanceId="editor" />
          </CodeView>
        </Panel>
      </PanelGroup>
    </>
  );
}
