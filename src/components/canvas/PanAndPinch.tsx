/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, ReactNode, useEffect, useState } from "react";

interface Props {
  children: ReactNode;
  panSpeedRatio?: number;
  zoomFactor?: {
    max: number;
    min: number;
  };
  test?: boolean;
}

const tetsModeStyles = {
  wrapper: {
    background: "rgba(0,0,0,0.1)",
  },
  container: {
    border: "3px solid #0044ff",
  },
};

const PanAndPinch: FC<Props> = (props) => {
  const [spacePressed, setSpacePressed] = useState(false);
  const [mouseKeyIsDown, setMouseKeyIsDown] = useState(false);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });

  const returnZoomMinOrMax = () => {
    const correctionIndex = 0.05;
    if (props.zoomFactor === undefined) return;
    if (transform.scale < props.zoomFactor.min) {
      setTransform({
        ...transform,
        scale: props.zoomFactor.min + correctionIndex,
      });
    }
    if (transform.scale > props.zoomFactor.max) {
      setTransform({
        ...transform,
        scale: props.zoomFactor.max - correctionIndex,
      });
    }
  };

  // HANDLE ON MOUSE WHEEL (FOR TRACKPADS)
  const handleOnWheel = (e: any) => {
    // DETECT PAN

    if (e.deltaX !== 0 || e.deltaY !== 0) {
      setTransform((prevState) => ({
        ...transform,
        x: prevState.x - e.deltaX / props.panSpeedRatio!,
        y: prevState.y - e.deltaY / props.panSpeedRatio!,
      }));
    }

    // DETECT PINCH
    if (e.ctrlKey || e.metaKey) {
      setTransform((prevState) => ({
        ...transform,
        scale: prevState.scale - e.deltaY / 100,
      }));
      returnZoomMinOrMax();
    }
  };

  // ON MOUSE MOVE
  const handleOnMouseMove = (e: any) => {
    if (spacePressed && mouseKeyIsDown) {
      if (e.movementX !== 0 || e.movementY > 0) {
        setTransform((prevState) => ({
          ...transform,
          x: prevState.x + e.movementX / props.panSpeedRatio!,
          y: prevState.y + e.movementY / props.panSpeedRatio!,
        }));
      }
    }
  };

  // ON SPACE PRESSED
  const handleOnKeyDown = (e: any) => {
    // IF SPACE PRESSED
    if (e.keyCode === 32) {
      setSpacePressed(true);
    }

    // PLUS/MINUS KEYS
    const zoomIndex = 0.5;
    if (props.zoomFactor === undefined) return;

    // IF MINUS PRESSED
    if (
      e.keyCode === 189 &&
      transform.scale > props.zoomFactor.min &&
      transform.scale < props.zoomFactor.max
    ) {
      setTransform((prevState) => ({
        ...transform,
        scale: prevState.scale - zoomIndex,
      }));
    }

    // IF PLUS PRESSED
    if (
      e.keyCode === 187 &&
      transform.scale > props.zoomFactor.min &&
      transform.scale < props.zoomFactor.max
    ) {
      setTransform((prevState) => ({
        ...transform,
        scale: prevState.scale + zoomIndex,
      }));
    }

    // IF ZERO PRESSED
    if (e.keyCode === 48) {
      setTransform({
        x: 0,
        y: 0,
        scale: 1,
      });
    }
  };

  const handleOnKeyUp = () => {
    setSpacePressed(false);
    returnZoomMinOrMax();
  };

  // ON MOUSE PRESSED
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
  // USE EFFECT
  useEffect(() => {
    document.addEventListener("mousedown", handleOnKeyMouseDown, false);
    document.addEventListener("mouseup", handleOnKeyMouseUp, false);
    window.addEventListener("wheel", (e: WheelEvent) => e.preventDefault(), {
      passive: false,
    });

    return () => {
      document.removeEventListener("mousedown", handleOnKeyMouseDown, false);
      document.removeEventListener("mouseup", handleOnKeyMouseUp, false);
    };
  });

  return (
    <div
      style={{
        ...(props.test ? tetsModeStyles.wrapper : {}),
        overflow: "scroll",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        // width: "1000px",
        // height: "1000px",
      }}
      onWheel={handleOnWheel}
      onMouseMove={handleOnMouseMove}
      onKeyDown={handleOnKeyDown}
      onKeyUp={handleOnKeyUp}
      tabIndex={0}
    >
      <div
        style={{
          ...(props.test ? tetsModeStyles.container : {}),
          width: "fit-content",
          height: "fit-content",
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {props.children}
      </div>
    </div>
  );
};

PanAndPinch.defaultProps = {
  panSpeedRatio: 1.4,
  test: false,
  zoomFactor: {
    max: 3,
    min: 0.3,
  },
} as Partial<Props>;

export default PanAndPinch;
