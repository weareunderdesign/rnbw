export type TToast = {
    id?: string;
    type: "primary" | "success" | "warning" | "danger";
    title?: string;
    message: string;
    delayAnimation?: boolean;
    onCloseToast?: () => void;
  };
  