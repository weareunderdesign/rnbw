import { useEffect } from "react";
import { useAppState } from "@_redux/useAppState";

export const useFileTreeEvent = () => {
  const { fileAction } = useAppState();

  useEffect(() => {}, [fileAction]);
};
