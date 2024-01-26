import React, { useEffect, useRef, useState } from "react";
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar";
import { useAppState } from "@_redux/useAppState";

export const Loader = () => {
  const { loading, theme } = useAppState();

  const loaderRef = useRef<LoadingBarRef>(null);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      return;
    }

    if (loading > 0) {
      loaderRef.current?.continuousStart();
    } else {
      const timeoutId = setTimeout(() => {
        loaderRef.current?.complete();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [loading]);

  return (
    <LoadingBar
      ref={loaderRef}
      color={theme === "Light" ? "#111" : "#fff"}
      height={4}
      shadow={true}
      transitionTime={150}
      waitingTime={300}
      containerStyle={{ mixBlendMode: "difference" }}
    />
  );
};
