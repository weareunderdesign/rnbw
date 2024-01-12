import React, { useEffect, useState } from "react";
import LoadingBar from "react-top-loading-bar";
import { useAppState } from "@_redux/useAppState";
const animationDuration = 300;

export const Loader = () => {
  const { theme, loading } = useAppState();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let paceTimer: NodeJS.Timer | null = null;
    if (isVisible) {
      paceTimer = setInterval(() => {
        setProgress(progress + 3);
      }, 100);
    } else {
      setProgress(0);
      paceTimer && clearInterval(paceTimer);
    }
    return () => {
      // paceTimer && clearInterval(paceTimer);
    };
  }, [isVisible, progress]);

  useEffect(() => {
    if (loading > 0) {
      setIsVisible(true);
    } else {
      setTimeout(() => {
        setIsVisible(false);
      }, animationDuration);
    }
  }, [loading]);

  return (
    <>
      {isVisible && (
        <LoadingBar
          progress={loading === 0 ? 100 : progress}
          onLoaderFinished={() => setProgress(0)}
          color={theme === "Light" ? "#111" : "#fff"}
          height={4}
          shadow={true}
          transitionTime={150}
        />
      )}
    </>
  );
};
