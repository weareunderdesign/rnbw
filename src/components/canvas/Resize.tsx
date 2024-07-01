import React, { useRef, useState, useEffect, FC, useCallback } from "react";
import { Direction, ResizeProps } from "./type";

const SizeDisplay: FC<{ width: number; height: number; scale: number }> = ({ width, height, scale }) => {
  return (
    <div
      style={{
        position: 'absolute',
        right: '10px',
        bottom: '10px',
        background: 'rgba(0,0,0,0.5)',
        color: 'white',
        padding: '5px',
        borderRadius: '3px',
        fontSize: '12px',
        transform: `scale(${1 / scale})`,
        transformOrigin: 'bottom right',
      }}
    >
      {`${Math.round(width)} x ${Math.round(height)}`}
    </div>
  );
};

export const Resize: FC<ResizeProps> = ({ children, scale, canvas }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<Direction | "">("");
  const [mouseDown, setMouseDown] = useState(false);
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [currentSize, setCurrentSize] = useState({ width: 0, height: 0 });
  const [isResizing, setIsResizing] = useState(false);

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
        panel.style.top = `${(initialSize.height - newHeight) / 2}px`;
        setCurrentSize(prev => ({ ...prev, height: newHeight }));
      };

      const resizeRight = () => {
        const newWidth = width + scaleMovement(movementX);
        if (newWidth < 100) return;
        panel.style.width = `${newWidth}px`;
        panel.style.left = `${(initialSize.width - newWidth) / 2}px`;
        setCurrentSize(prev => ({ ...prev, width: newWidth }));
      };

      const resizeBottom = () => {
        const newHeight = height + scaleMovement(movementY);
        if (newHeight < 100) return;
        panel.style.height = `${newHeight}px`;
        panel.style.top = `${(initialSize.height - newHeight) / 2}px`;
        setCurrentSize(prev => ({ ...prev, height: newHeight }));
      };

      const resizeLeft = () => {
        const newWidth = width - scaleMovement(movementX);
        if (newWidth < 100) return;
        panel.style.width = `${newWidth}px`;
        panel.style.left = `${(initialSize.width - newWidth) / 2}px`;
        setCurrentSize(prev => ({ ...prev, width: newWidth }));
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
    [scale, scaleMovement, initialSize],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (mouseDown && direction) {
        handleResize(direction, e.movementX, e.movementY);
      }
    },
    [mouseDown, direction, handleResize],
  );

  const handleMouseUp = useCallback(() => {
    setMouseDown(false);
    setIsResizing(false);
  }, []);

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
      setIsResizing(true);
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
    if (panel) {
      const newSize = {
        width: panel.offsetWidth,
        height: panel.offsetHeight,
      };
      setInitialSize(newSize);
      setCurrentSize(newSize);
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
    <div 
      className={`panel ${isResizing ? 'no-select' : ''}`} 
      ref={panelRef}
    >
      <div className="panel__container" style={{ position: 'relative', width: '100%', height: '100%' }}>
        {canvas &&
          Object.values(Direction).map((direction) => (
            <div
              key={direction}
              className={`resizer ${direction}`}
              onMouseDown={handleMouseDown(direction)}
            />
          ))}
        {children}
        {canvas && (
          <SizeDisplay 
            width={currentSize.width} 
            height={currentSize.height} 
            scale={scale} 
          />
        )}
      </div>
    </div>
  );
};
