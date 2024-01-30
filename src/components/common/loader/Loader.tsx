import React, { useEffect, useRef, useState } from "react";
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar";
import { useAppState } from "@_redux/useAppState";

const refreshRate = 800;
const initialProgress = 20;

export const Loader = () => {
  const { loading, theme } = useAppState();
  const loaderRef = useRef<LoadingBarRef>(null);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(initialProgress);

  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      return;
    }
    if (loading > 0) {
      loaderRef.current?.continuousStart(progress, refreshRate);
    } else {
      const timeoutId = setTimeout(() => {
        loaderRef.current?.complete();
        setProgress(initialProgress);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
    const intervalId = setInterval(() => {
      if (loading > 0) {
        setProgress((prevProgress) => Math.min(prevProgress + 10, 90));
      } else {
        clearInterval(intervalId);
      }
    }, refreshRate);

    return () => clearInterval(intervalId);
  }, [loading]);

  return (
    <LoadingBar
      ref={loaderRef}
      color={theme === "Light" ? "#000" : "#fff"}
      height={4}
      shadow={false}
      transitionTime={150}
      waitingTime={300}
      containerStyle={{
        mixBlendMode: theme === "Light" ? "normal" : "difference",
      }}
    />
  );
};
