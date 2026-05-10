import React, { useEffect, useRef, useState } from "react";
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar";
import { useAppState } from "@_redux/useAppState";

const refreshRate = 800;
const initialProgress = 20;

export const Loader = () => {
  const { loading } = useAppState();
  const loaderRef = useRef<LoadingBarRef>(null);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(initialProgress);
  const [progressBarLoaded, setProgressBarLoaded] = useState<boolean>(true);

  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      return;
    }
    if (loading > 0) {
      setProgressBarLoaded(false);
      loaderRef.current?.continuousStart(progress, refreshRate);
    } else {
      const timeoutId = setTimeout(() => {
        loaderRef.current?.complete();
        setProgressBarLoaded(true);
        setProgress(initialProgress);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
    const intervalId = setInterval(() => {
      if (loading > 0) {
        setProgress((prevProgress) => Math.min(prevProgress + 10, 90));
        setProgressBarLoaded(false);
      } else {
        clearInterval(intervalId);
      }
    }, refreshRate);

    return () => clearInterval(intervalId);
  }, [loading]);

  return (
    <LoadingBar
      ref={loaderRef}
      color={"#000"}
      height={4}
      shadow={false}
      transitionTime={150}
      waitingTime={300}
      containerStyle={{
        backgroundColor: !progressBarLoaded ? "#fff" : "transparent",
      }}
    />
  );
};
