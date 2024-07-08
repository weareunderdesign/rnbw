import React, {
  useCallback,
  useMemo,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import { MainContext } from "@_redux/main";
import { setActivePanel } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import IFrame from "./iFrame";

enum Direction {
  TopLeft = "top-left",
  Top = "top",
  TopRight = "top-right",
  Right = "right",
  BottomRight = "bottom-right",
  Bottom = "bottom",
  BottomLeft = "bottom-left",
  Left = "left",
}

interface ResizeProps {
  children: ReactNode;
  scale: number;
  canvas: boolean;
}

const zoomFactor = { max: 10, min: 0.1 };
const zoomIndex = 0.25;

const SizeDisplay: FC<{ width: number; height: number; scale: number }> = ({
  width,
  height,
  scale,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        right: "10px",
        bottom: "10px",
        background: "rgba(0,0,0,0.5)",
        color: "white",
        padding: "5px",
        borderRadius: "3px",
        fontSize: "12px",
        transform: `scale(${1 / scale})`,
        transformOrigin: "bottom right",
      }}
    >
      {`${Math.round(width)} x ${Math.round(height)}`}
    </div>
  );
};

const PanAndPinch: FC<{ children: ReactNode }> = ({ children }) => {
  const [spacePressed, setSpacePressed] = useState(false);
  const [mouseKeyIsDown, setMouseKeyIsDown] = useState(false);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const scrollableRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState(false);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

  const { contentEditableUidRef } = useContext(MainContext);

  useEffect(() => {
    if (transform.scale != 1) {
      setCanvas(true);
    }
    updateContentSize();
  }, [transform.scale]);

  const updateContentSize = () => {
    if (scrollableRef.current) {
      const { clientWidth, clientHeight } = scrollableRef.current;
      setContentSize({
        width: clientWidth * transform.scale,
        height: clientHeight * transform.scale,
      });
    }
  };

  const updateScale = (newScale: number) => {
    setTransform((prevTransform) => {
      const scaleFactor = newScale / prevTransform.scale;
      return {
        scale: newScale,
        x: prevTransform.x * scaleFactor,
        y: prevTransform.y * scaleFactor,
      };
    });
  };

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const newScale = transform.scale - e.deltaY / 100;
      if (newScale > zoomFactor.min && newScale < zoomFactor.max)
        updateScale(newScale);
    }
  };

  const handleOnMouseMove = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (spacePressed && mouseKeyIsDown && scrollableRef.current) {
      const deltaX = e.movementX / transform.scale;
      const deltaY = e.movementY / transform.scale;
      setTransform((prevTransform) => ({
        ...prevTransform,
        x: prevTransform.x - deltaX,
        y: prevTransform.y - deltaY,
      }));
    }
  };

  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const { code, key, isTrusted } = e;
    if (contentEditableUidRef.current) return;
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

  const handleOnKeyMouseDown = (e: MouseEvent) => {
    if (e.which === 1) {
      setMouseKeyIsDown(true);
    }
  };

  const handleOnKeyMouseUp = (e: MouseEvent) => {
    if (e.which === 1) {
      setMouseKeyIsDown(false);
    }
  };

  const handleMessageFromIFrame = (e: MessageEvent) => {
    if (e.data.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
    }
    switch (e.data.type) {
      case "wheel":
        onWheel(e.data);
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

  const handleOnWheel = (e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault(); // Prevent default zoom behavior
    }
    onWheel(e);
  };

  useEffect(() => {
    const scrollContainer = scrollableRef.current;
    if (!scrollContainer) return;

    scrollContainer.addEventListener("mousedown", handleOnKeyMouseDown, false);
    scrollContainer.addEventListener("mouseup", handleOnKeyMouseUp, false);
    scrollContainer.addEventListener("wheel", handleOnWheel, {
      passive: false,
    });
    window.addEventListener("message", handleMessageFromIFrame, false);

    return () => {
      scrollContainer.removeEventListener("mousedown", handleOnKeyMouseDown);
      scrollContainer.removeEventListener("mouseup", handleOnKeyMouseUp);
      scrollContainer.removeEventListener("wheel", handleOnWheel);
      window.removeEventListener("message", handleMessageFromIFrame);
    };
  }, [transform.scale]);

  return (
    <div
      style={{
        overflow:
          contentSize.width > window.innerWidth ||
          contentSize.height > window.innerHeight
            ? "auto"
            : "hidden",
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      ref={scrollableRef}
      onMouseMove={handleOnMouseMove}
      onKeyDown={handleOnKeyDown}
      onKeyUp={handleOnKeyUp}
      tabIndex={0}
    >
      <div
        className="background-secondary"
        style={{
          width: Math.max(contentSize.width, window.innerWidth),
          height: Math.max(contentSize.height, window.innerHeight),
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: canvas ? "50vw" : "100%",
            height: "100vh",
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "center center",
            overflow: "visible",
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

const Resize: FC<ResizeProps> = ({ children, scale, canvas }) => {
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
        // offsetLeft: x,
        // offsetTop: y,
      } = panel;

      const resizeTop = () => {
        const newHeight = height - scaleMovement(movementY);
        if (newHeight < 100) return;
        panel.style.height = `${newHeight}px`;
        panel.style.top = `${(initialSize.height - newHeight) / 2}px`;
        setCurrentSize((prev) => ({ ...prev, height: newHeight }));
      };

      const resizeRight = () => {
        const newWidth = width + scaleMovement(movementX);
        if (newWidth < 100) return;
        panel.style.width = `${newWidth}px`;
        panel.style.left = `${(initialSize.width - newWidth) / 2}px`;
        setCurrentSize((prev) => ({ ...prev, width: newWidth }));
      };

      const resizeBottom = () => {
        const newHeight = height + scaleMovement(movementY);
        if (newHeight < 100) return;
        panel.style.height = `${newHeight}px`;
        panel.style.top = `${(initialSize.height - newHeight) / 2}px`;
        setCurrentSize((prev) => ({ ...prev, height: newHeight }));
      };

      const resizeLeft = () => {
        const newWidth = width - scaleMovement(movementX);
        if (newWidth < 100) return;
        panel.style.width = `${newWidth}px`;
        panel.style.left = `${(initialSize.width - newWidth) / 2}px`;
        setCurrentSize((prev) => ({ ...prev, width: newWidth }));
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

  const panelStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
  };

  const panelContainerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
  };

  const resizerBaseStyle: React.CSSProperties = {
    position: "absolute",
    background: "transparent",
  };

  const resizerStyles: { [key in Direction]: React.CSSProperties } = {
    [Direction.TopLeft]: {
      ...resizerBaseStyle,
      cursor: "nwse-resize",
      height: "25px",
      width: "25px",
      left: 0,
      top: 0,
      zIndex: 1,
    },
    [Direction.Top]: {
      ...resizerBaseStyle,
      cursor: "ns-resize",
      height: "25px",
      width: "100%",
      left: 0,
      top: 0,
    },
    [Direction.TopRight]: {
      ...resizerBaseStyle,
      cursor: "nesw-resize",
      height: "25px",
      width: "25px",
      right: 0,
      top: 0,
      zIndex: 1,
    },
    [Direction.Right]: {
      ...resizerBaseStyle,
      cursor: "ew-resize",
      width: "25px",
      height: "100%",
      right: 0,
      top: 0,
    },
    [Direction.BottomLeft]: {
      ...resizerBaseStyle,
      cursor: "nesw-resize",
      width: "25px",
      height: "25px",
      left: 0,
      bottom: 0,
      zIndex: 1,
    },
    [Direction.Bottom]: {
      ...resizerBaseStyle,
      cursor: "ns-resize",
      width: "100%",
      height: "25px",
      bottom: 0,
      left: 0,
    },
    [Direction.BottomRight]: {
      ...resizerBaseStyle,
      cursor: "nwse-resize",
      width: "25px",
      height: "25px",
      right: 0,
      bottom: 0,
      zIndex: 1,
    },
    [Direction.Left]: {
      ...resizerBaseStyle,
      cursor: "ew-resize",
      width: "25px",
      height: "100%",
      left: 0,
      top: 0,
    },
  };

  return (
    <div
      style={
        {
          ...panelStyle,
          userSelect: isResizing ? "none" : "text",
          WebkitUserSelect: isResizing ? "none" : "text",
          MozUserSelect: isResizing ? "none" : "text",
          msUserSelect: isResizing ? "none" : "text",
        } as React.CSSProperties
      }
      ref={panelRef}
    >
      <div style={panelContainerStyle}>
        {canvas &&
          Object.values(Direction).map((direction) => (
            <div
              key={direction}
              style={resizerStyles[direction]}
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

export default function StageView() {
  const { showCodeView, activePanel } = useAppState();

  const dispatch = useDispatch();
  const onClick = useCallback(() => {
    activePanel !== "stage" && dispatch(setActivePanel("stage"));
  }, [activePanel]);

  return useMemo(() => {
    return (
      <PanAndPinch>
        <div
          id="StageView"
          className={showCodeView ? "" : "view"}
          onClick={onClick}
          style={{
            height: "100%",
          }}
        >
          <IFrame />
        </div>
      </PanAndPinch>
    );
  }, [showCodeView, activePanel, onClick]);
}
