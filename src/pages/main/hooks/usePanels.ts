import React, { useCallback, useState } from "react";

export const usePanels = () => {
  const [actionsPanelOffsetTop, setActionsPanelOffsetTop] = useState(12);
  const [actionsPanelOffsetLeft, setActionsPanelOffsetLeft] = useState(12);
  const [actionsPanelWidth, setActionsPanelWidth] = useState(240);

  const [codeViewOffsetBottom, setCodeViewOffsetBottom] = useState("12");
  const [codeViewOffsetTop, setCodeViewOffsetTop] =
    useState("calc(60vh - 12px)");
  const [codeViewOffsetLeft, setCodeViewOffsetLeft] = useState(12);
  const [codeViewHeight, setCodeViewHeight] = useState("40");
  const [codeViewDragging, setCodeViewDragging] = useState(false);

  const dragCodeView = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setCodeViewOffsetTop(
      ((e.clientY / document.documentElement.clientHeight) * 100 < 1
        ? 1
        : (e.clientY / document.documentElement.clientHeight) * 100
      ).toString(),
    );
    if (!codeViewDragging) {
      setCodeViewDragging(true);
    }
  }, []);

  const dragEndCodeView = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const offsetTop = (
      (e.clientY / document.documentElement.clientHeight) * 100 < 1
        ? 1
        : (e.clientY / document.documentElement.clientHeight) * 100
    ).toString();
    setCodeViewOffsetTop(offsetTop);
    setCodeViewDragging(false);
    localStorage.setItem("offsetTop", offsetTop);
  }, []);

  const dropCodeView = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return {
    actionsPanelOffsetTop,
    actionsPanelOffsetLeft,
    actionsPanelWidth,
    codeViewOffsetBottom,
    codeViewOffsetTop,
    codeViewOffsetLeft,
    codeViewHeight,
    codeViewDragging,
    dragCodeView,
    dragEndCodeView,
    dropCodeView,
  };
};
