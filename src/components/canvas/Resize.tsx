import React, { useRef, useState, useEffect, FC, useCallback } from "react";
import { Direction, ResizeProps } from "./type";
import "./index.css";

export const Resize: FC<ResizeProps> = ({ children, scale }) => {
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
        panel.style.height = `${height - scaleMovement(movementY)}px`;
        panel.style.top = `${y + scaleMovement(movementY)}px`;
      };
      const resizeRight = () => {
        panel.style.width = `${width + scaleMovement(movementX)}px`;
      };
      const resizeBottom = () => {
        panel.style.height = `${height + scaleMovement(movementY)}px`;
      };
      const resizeLeft = () => {
        panel.style.width = `${width - scaleMovement(movementX)}px`;
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
        {Object.values(Direction).map((direction) => (
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
