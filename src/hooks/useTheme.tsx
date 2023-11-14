import { useEffect, useState } from "react";

import { useSelector } from "react-redux";

import { themeSelector } from "@_redux/global";
import { getSystemTheme } from "@_services/global";

export const getCurrentTheme = (theme: string) => {
  if (theme === "Dark") {
    return "vs-dark";
  } else if (theme === "Light") {
    return "light";
  } else {
    return getSystemTheme();
  }
};

export const useTheme = () => {
  const _theme = useSelector(themeSelector);
  const [theme, setTheme] = useState<"vs-dark" | "light">();

  useEffect(() => {
    setTheme(getCurrentTheme(_theme));
  }, [_theme]);

  return {
    theme,
  };
};
