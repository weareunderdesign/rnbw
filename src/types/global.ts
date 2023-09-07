export type TOsType = "Windows" | "Mac" | "Linux";
export type TTheme = "Light" | "Dark" | "System";
export type TToastType = "success" | "warning" | "info" | "error";
export type TToast = {
  type: TToastType;
  title?: string;
  content: string;
};
