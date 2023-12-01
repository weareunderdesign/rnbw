import { TTheme } from "@_redux/global";
import { getSystemTheme } from "@_services/global";

export const getLanguageFromExtension = (extension: string) => {
  if (!!extension) return extension;
  return "plaintext";
};

export const getCodeViewTheme = (theme: TTheme) => {
  let _theme = theme;
  if (theme === "System") {
    _theme = getSystemTheme();
  }

  if (_theme === "Dark") {
    return "vs-dark";
  } else if (_theme === "Light") {
    return "light";
  }
};
