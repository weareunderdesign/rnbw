import { useEffect } from "react";

import { useDispatch } from "react-redux";

import { LogAllow } from "@_constants/global";
import { setOsType, setTheme } from "@_redux/global";
import { setDoingFileAction, TProjectContext } from "@_redux/main/fileTree";
import { isChromeOrEdge } from "@_services/global";

import { setSystemTheme } from "../helper";

interface IUseInit {
  importProject: (
    fsType: TProjectContext,
    projectHandle?: FileSystemDirectoryHandle | null | undefined,
  ) => Promise<void>;
  onNew: () => Promise<void>;
}
export const useInit = ({ importProject, onNew }: IUseInit) => {
  const dispatch = useDispatch();

  // detect os
  useEffect(() => {
    LogAllow && console.log("navigator: ", navigator.userAgent);
    if (navigator.userAgent.indexOf("Mac OS X") !== -1) {
      dispatch(setOsType("Mac"));
    } else if (navigator.userAgent.indexOf("Linux") !== -1) {
      dispatch(setOsType("Linux"));
    } else {
      dispatch(setOsType("Windows"));
    }
  }, []);

  // browser
  useEffect(() => {
    if (!isChromeOrEdge()) {
      const message = `Browser is unsupported. rnbw works in the latest versions of Google Chrome and Microsoft Edge.`;
      if (!window.confirm(message)) return;
    }

    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    window.document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }, []);

  // theme
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    LogAllow && console.log("storedTheme: ", storedTheme);
    if (storedTheme) {
      document.documentElement.setAttribute("data-theme", storedTheme);
      dispatch(setTheme(storedTheme === "dark" ? "Dark" : "Light"));
    } else {
      setSystemTheme();
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", setSystemTheme);
    }

    return () =>
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", setSystemTheme);
  }, []);

  // newbie
  useEffect(() => {
    const newbie = localStorage.getItem("newbie");
    const isNewbie = newbie === null ? true : false;
    LogAllow && console.log("isNewbie: ", isNewbie);
    if (!isNewbie) {
      localStorage.setItem("newbie", "false");
      // load idb project
      (async () => {
        dispatch(setDoingFileAction(true));
        try {
          await importProject("idb");
          LogAllow && console.log("loaded idb project");
        } catch (err) {
          LogAllow && console.log("failed to load idb project");
        }
        dispatch(setDoingFileAction(false));
      })();
    } else {
      onNew();
    }
  }, []);

  useEffect(() => {
    window.history.replaceState(null, "", "/");
  }, []);
};
