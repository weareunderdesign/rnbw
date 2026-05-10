export type TGlobalReducerState = {
  osType: TOsType;
  theme: TTheme;
};

export type TOsType = "Windows" | "Mac" | "Linux";
export type TTheme = "Light" | "Dark" | "System";
