import { TOsType, TTheme } from "@_redux/global";

export const isChromeOrEdge = (): boolean => {
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf("Chrome") > -1) {
    return true;
  } else if (userAgent.indexOf("Edg") > -1) {
    return true;
  }
  return false;
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
export const getSystemTheme = (): TTheme => {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "Dark";
  } else {
    return "Light";
  }
};
