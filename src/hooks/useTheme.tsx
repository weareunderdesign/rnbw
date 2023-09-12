import { useState, useEffect, useContext } from "react";

import { getSystemTheme } from "@_services/global";
import { MainContext } from "@_redux/main";

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
  const { theme: _theme } = useContext(MainContext);
  const [theme, setTheme] = useState<"vs-dark" | "light">();

  useEffect(() => {
    setTheme(getCurrentTheme(_theme));
  }, [_theme]);

  return {
    theme,
  };
};
