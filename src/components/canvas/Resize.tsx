import React, { useRef, useState, useEffect, FC, useCallback } from "react";
import { Direction, ResizeProps } from "./type";
import "./index.css";

export const Resize: FC<ResizeProps> = ({ children, scale, canvas }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<Direction | "">("");
  const [mouseDown, setMouseDown] = useState(false);

  const scaleMovement = useCallback(
    (movement: number) => movement / scale,
    [scale],
  );

  const handleResize = useCallback(
    (direction: Direction, movementX: number, movementY: number) => {
      const panel = panelRef.current;
      if (!panel) return;

      const {
        offsetWidth: width,
        offsetHeight: height,
        offsetLeft: x,
        offsetTop: y,
      } = panel;

      const resizeTop = () => {
        const newHeight = height - scaleMovement(movementY);
        if (newHeight < 100) return;
        panel.style.height = `${newHeight}px`;
        panel.style.top = `${y + scaleMovement(movementY)}px`;
      };

      const resizeRight = () => {
        const newWidth = width + scaleMovement(movementX);
        if (newWidth < 100) return;
        panel.style.width = `${newWidth}px`;
      };
      const resizeBottom = () => {
        const newHeight = height + scaleMovement(movementY);
        if (newHeight < 100) return;
        panel.style.height = `${newHeight}px`;
      };
      const resizeLeft = () => {
        const newWidth = width - scaleMovement(movementX);
        if (newWidth < 100) return;
        panel.style.width = `${newWidth}px`;
        panel.style.left = `${x + scaleMovement(movementX)}px`;
      };

      const resizeOperations = {
        [Direction.TopLeft]: () => {
          resizeTop();
          resizeLeft();
        },
        [Direction.Top]: resizeTop,
        [Direction.TopRight]: () => {
          resizeTop();
          resizeRight();
        },
        [Direction.Right]: resizeRight,
        [Direction.BottomRight]: () => {
          resizeBottom();
          resizeRight();
        },
        [Direction.Bottom]: resizeBottom,
        [Direction.BottomLeft]: () => {
          resizeBottom();
          resizeLeft();
        },
        [Direction.Left]: resizeLeft,
      };

      const resizeOperation = resizeOperations[direction];
      if (resizeOperation) resizeOperation();
    },
    [scale, scaleMovement],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (mouseDown && direction) {
        handleResize(direction, e.movementX, e.movementY);
      }
    },
    [mouseDown, direction, handleResize],
  );

  const handleMouseUp = useCallback(() => setMouseDown(false), []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [mouseDown, direction, scale]);

  const handleMouseDown = useCallback(
    (direction: Direction) => () => {
      setDirection(direction);
      setMouseDown(true);
    },
    [],
  );

  useEffect(() => {
    const panel = panelRef.current;
    if (!canvas && panel) {
      panel.style.height = "100%";
      panel.style.width = "100%";
      panel.style.top = "0px";
      panel.style.left = "0";
    }
  }, [canvas]);

  const handleMessageFromIFrame = useCallback(
    (e: MessageEvent) => {
      switch (e.data.type) {
        case "mouseup":
          e.preventDefault();
          handleMouseUp();
          break;
        case "mousemove":
          handleMouseMove(e.data);
          break;
        default:
          break;
      }
    },
    [handleMouseMove, handleMouseUp],
  );

  useEffect(() => {
    window.addEventListener("message", handleMessageFromIFrame);
    return () => {
      window.removeEventListener("message", handleMessageFromIFrame);
    };
  }, [handleMessageFromIFrame]);

  return (
    <div className="panel" ref={panelRef}>
      <div className="panel__container">
        {canvas &&
          Object.values(Direction).map((direction) => (
            <div
              key={direction}
              className={`resizer ${direction}`}
              onMouseDown={handleMouseDown(direction)}
            />
          ))}
        {children}
      </div>
    </div>
  );
};
