export type TToastType = "success" | "warning" | "info" | "error";
export type TToast = {
  type: TToastType;
  title?: string;
  content: string;
};
