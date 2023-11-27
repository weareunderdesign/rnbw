import { useEffect, useState } from "react";

import { getSystemTheme } from "@_services/global";
import { useAppState } from "@_redux/useAppState";

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
  const { theme: _theme } = useAppState();
  const [theme, setTheme] = useState<"vs-dark" | "light">();

  useEffect(() => {
    setTheme(getCurrentTheme(_theme));
  }, [_theme]);

  return {
    theme,
  };
};
