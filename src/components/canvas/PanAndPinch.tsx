/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  children: ReactNode;
}

const zoomFactor = { max: 5, min: 0.1 };

const PanAndPinch: FC<Props> = (props) => {
  const [spacePressed, setSpacePressed] = useState(false);
  const [mouseKeyIsDown, setMouseKeyIsDown] = useState(false);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const scrollableRef = useRef<HTMLDivElement>(null);

  const returnZoomMinOrMax = () => {
    const correctionIndex = 0.05;
    if (transform.scale < zoomFactor.min) {
      setTransform({
        ...transform,
        scale: zoomFactor.min + correctionIndex,
      });
    }
    if (transform.scale > zoomFactor.max) {
      setTransform({
        ...transform,
        scale: zoomFactor.max - correctionIndex,
      });
    }
  };

  const handleOnWheel = (e: any) => {
    if (e.ctrlKey || e.metaKey) {
      setTransform((prevState) => ({
        ...transform,
        scale: prevState.scale - e.deltaY / 100,
      }));
      returnZoomMinOrMax();
    }
  };

  const handleOnMouseMove = (e: any) => {
    if (spacePressed && mouseKeyIsDown && scrollableRef.current) {
      const deltaX = e.movementX;
      const deltaY = e.movementY;
      scrollableRef.current.scrollLeft -= deltaX;
      scrollableRef.current.scrollTop -= deltaY;
    }
  };

  const handleOnKeyDown = (e: any) => {
    if (e.code === "Space") {
      setSpacePressed(true);
    }

    const zoomIndex = 0.25;

    if (
      e.key === "-" &&
      transform.scale > zoomFactor.min &&
      transform.scale < zoomFactor.max
    ) {
      setTransform((prevState) => ({
        ...transform,
        scale: prevState.scale - zoomIndex,
      }));
    }

    if (
      e.key === "+" &&
      transform.scale > zoomFactor.min &&
      transform.scale < zoomFactor.max
    ) {
      setTransform((prevState) => ({
        ...transform,
        scale: prevState.scale + zoomIndex,
      }));
    }

    if (e.key === "0" || e.key === "Escape") {
      setTransform({
        x: 0,
        y: 0,
        scale: 1,
      });
    }

    if (e.key >= "1" && e.key <= "9") {
      setTransform({ ...transform, scale: Number(`0.${e.key}`) });
    }
  };

  const handleOnKeyUp = () => {
    setSpacePressed(false);
    returnZoomMinOrMax();
  };

  const handleOnKeyMouseDown = (e: any) => {
    e.isTrusted && e.preventDefault();
    if (e.which === 1) {
      setMouseKeyIsDown(true);
    }
  };

  const handleOnKeyMouseUp = (e: any) => {
    e.isTrusted && e.preventDefault();
    if (e.which === 1) {
      setMouseKeyIsDown(false);
    }
  };

  const handleMessageFromIFrame = (e: any) => {
    switch (e.data.type) {
      case "wheel":
        handleOnWheel(e.data);
        break;
      case "keydown":
        handleOnKeyDown(e.data);
        break;
      case "mouseup":
        e.preventDefault();
        handleOnKeyMouseUp(e.data);
        break;
      case "mousedown":
        e.preventDefault();
        handleOnKeyMouseDown(e.data);
        break;
      case "mousemove":
        handleOnMouseMove(e.data);
        break;
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleOnKeyMouseDown, false);
    document.addEventListener("mouseup", handleOnKeyMouseUp, false);
    window.addEventListener("message", handleMessageFromIFrame);

    // preventing browser zoom, but we can't scroll nodeTree
    // window.addEventListener("wheel", (e: WheelEvent) => e.preventDefault(), {
    //   passive: false,
    // });

    return () => {
      document.removeEventListener("mousedown", handleOnKeyMouseDown, false);
      document.removeEventListener("mouseup", handleOnKeyMouseUp, false);
      window.removeEventListener("message", handleMessageFromIFrame);
    };
  });

  return (
    <div
      style={{
        overflow: "scroll",
        width: "100%",
        height: "100%",
        scrollbarColor: "auto",
      }}
      ref={scrollableRef}
      onWheel={handleOnWheel}
      onMouseMove={handleOnMouseMove}
      onKeyDown={handleOnKeyDown}
      onKeyUp={handleOnKeyUp}
      tabIndex={0}
    >
      <div style={{ width: "2000px", height: "2000px" }}>
        <div
          style={{
            width: "50vw",
            height: "100vh",
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default PanAndPinch;
