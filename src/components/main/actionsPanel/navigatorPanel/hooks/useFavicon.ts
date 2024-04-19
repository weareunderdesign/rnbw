import { useEffect, useRef, useState } from "react";

import { useDispatch } from "react-redux";

import { RootNodeUid } from "@_constants/main";
import { setWorkspace } from "@_redux/main/fileTree";
import { useAppState } from "@_redux/useAppState";

import { setWorkspaceFavicon } from "../helpers/";

export const useFavicon = (
  setFaviconFallback: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const dispatch = useDispatch();

  const { workspace, project, currentFileUid, validNodeTree } = useAppState();

  const [systemTheme, setSystemTheme] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark': 'Light')

  const isFirst = useRef(true);
  useEffect(() => {
    isFirst.current = true;
  }, [currentFileUid]);

  useEffect(() => {
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'Dark': 'Light')
    };
     
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', handleSystemThemeChange)


    return () => {
      window.matchMedia('(prefers-color-scheme: dark)')
        .removeEventListener('change', handleSystemThemeChange)
    }
  }, []);

  useEffect(() => {
    setFaviconFallback(false);

    if (currentFileUid === `${RootNodeUid}/index.html`) {
      setWorkspaceFavicon(validNodeTree, project, workspace, (workspace) => {
        dispatch(setWorkspace(workspace));
      });
    }
  }, [validNodeTree]);

  return { 
    systemTheme
  }
};
