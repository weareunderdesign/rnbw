import React, {
  FC,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Resize } from "./Resize";
import { MainContext } from "@_redux/main";

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
    setTransform(prevTransform => {
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
      setTransform(prevTransform => ({
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
        overflow: contentSize.width > window.innerWidth || contentSize.height > window.innerHeight ? 'auto' : 'hidden',
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
        className="background-tertiary"
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

export default PanAndPinch;







