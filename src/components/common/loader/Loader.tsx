import React, { useEffect, useState } from "react";

import { useSelector } from "react-redux";
import LoadingBar from "react-top-loading-bar";

import { themeSelector } from "@_redux/global";

import { LoaderProps } from "./types";

export const Loader = ({ show }: LoaderProps) => {
  const theme = useSelector(themeSelector);

  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let paceTimer: NodeJS.Timer | null = null;

    if (show) {
      paceTimer = setInterval(() => {
        setProgress(progress + 3);
      }, 20);
    } else {
      setProgress(0);
      paceTimer && clearInterval(paceTimer);
    }

    return () => {
      // paceTimer && clearInterval(paceTimer);
    };
  }, [show, progress]);

  return (
    <>
      {show && (
        <LoadingBar
          progress={progress}
          onLoaderFinished={() => setProgress(0)}
          color={theme === "Light" ? "#111" : "#fff"}
          shadow={true}
        />
      )}
    </>
  );
};
