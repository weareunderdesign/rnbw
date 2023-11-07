import { TOsType } from "@_redux/global";

export const isChromeOrEdge = () => {
  const userAgent = navigator.userAgent;

  if (userAgent.indexOf("Chrome") > -1) {
    return true; // Current browser is Chrome
  } else if (userAgent.indexOf("Edg") > -1) {
    return true; // Current browser is Edge
  }

  return false; // Current browser is not Chrome or Edge
};

export const getLineBreaker = (osType: TOsType): string => {
  return osType === "Windows"
    ? "\n"
    : osType === "Mac"
    ? "\n"
    : osType === "Linux"
    ? "\n"
    : "";
};

export const getCommandKey = (
  e: KeyboardEvent | MouseEvent | React.MouseEvent,
  osType: TOsType,
): boolean => {
  return osType === "Windows"
    ? e.ctrlKey
    : osType === "Mac"
    ? e.metaKey
    : osType === "Linux"
    ? e.ctrlKey
    : false;
};

export const getSystemTheme = () => {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "vs-dark";
  } else {
    return "light";
  }
};
