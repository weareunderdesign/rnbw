/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, ReactNode, useEffect, useRef, useState } from "react";
import { Resize } from "./Resize";

interface Props {
  children: ReactNode;
}

const zoomFactor = { max: 10, min: 0.1 };
const zoomIndex = 0.25;

const PanAndPinch: FC<Props> = ({ children }) => {
  const [spacePressed, setSpacePressed] = useState(false);
  const [mouseKeyIsDown, setMouseKeyIsDown] = useState(false);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const scrollableRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState(false);

  useEffect(() => {
    if (transform.scale != 1) {
      setCanvas(true);
    }
  }, [transform.scale]);

  const updateScale = (newScale: number) => {
    setTransform((prevState) => ({
      ...prevState,
      scale: newScale,
    }));
  };

  const handleOnWheel = (e: any) => {
    if (e.ctrlKey || e.metaKey) {
      const newScale = transform.scale - e.deltaY / 100;
      if (newScale > zoomFactor.min && newScale < zoomFactor.max)
        updateScale(newScale);
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
    const { code, key, isTrusted } = e;
    if (code === "Space") {
      if (isTrusted) e.preventDefault();
      setSpacePressed(true);
    }

    switch (key) {
      case "-":
      case "+":
        {
          const scaleChange = key === "-" ? -zoomIndex : zoomIndex;
          const newScale = transform.scale + scaleChange;
          if (newScale > zoomFactor.min && newScale < zoomFactor.max) {
            updateScale(newScale);
          }
        }
        break;

      case "0":
      case "Escape":
        setTransform({ x: 0, y: 0, scale: 1 });
        setCanvas(false);
        break;

      default: {
        const numberKey = Number(key);
        if (numberKey >= 1 && numberKey <= 9) {
          updateScale(Number(`0.${key}`));
        }
        break;
      }
    }
  };

  const handleOnKeyUp = () => {
    setSpacePressed(false);
  };

  const handleOnKeyMouseDown = (e: any) => {
    if (e.which === 1) {
      setMouseKeyIsDown(true);
    }
  };

  const handleOnKeyMouseUp = (e: any) => {
    if (e.which === 1) {
      setMouseKeyIsDown(false);
    }
  };

  const handleMessageFromIFrame = (e: any) => {
    switch (e.data.type) {
      case "wheel":
        e.preventDefault();
        handleOnWheel(e.data);
        break;
      case "keydown":
        handleOnKeyDown(e.data);
        break;
      case "mouseup":
        handleOnKeyMouseUp(e.data);
        break;
      case "mousedown":
        handleOnKeyMouseDown(e.data);
        break;
      case "mousemove":
        handleOnMouseMove(e.data);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    scrollableRef.current?.addEventListener(
      "mousedown",
      handleOnKeyMouseDown,
      false,
    );
    scrollableRef.current?.addEventListener(
      "mouseup",
      handleOnKeyMouseUp,
      false,
    );
    window.addEventListener("message", handleMessageFromIFrame, false);

    return () => {
      scrollableRef.current?.removeEventListener(
        "mousedown",
        handleOnKeyMouseDown,
      );
      scrollableRef.current?.removeEventListener("mouseup", handleOnKeyMouseUp);
      window.removeEventListener("message", handleMessageFromIFrame);
    };
  }, [transform.scale]);

  return (
    <div
      style={{
        overflow: "scroll",
        width: "100%",
        height: "100%",
        scrollbarColor: canvas ? "auto" : "unset",
      }}
      ref={scrollableRef}
      onWheel={handleOnWheel}
      onMouseMove={handleOnMouseMove}
      onKeyDown={handleOnKeyDown}
      onKeyUp={handleOnKeyUp}
      tabIndex={0}
    >
      <div style={{ width: canvas ? "2000px" : "100%", height: "2000px" }}>
        <div
          style={{
            width: "50vw",
            height: "100vh",
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          <Resize canvas={canvas} scale={transform.scale}>
            {children}
          </Resize>
        </div>
      </div>
    </div>
  );
};

export default PanAndPinch;
