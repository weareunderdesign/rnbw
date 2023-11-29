import { useFileTreeEvent, useHms } from "./hooks";
import { useNodeTreeEvent } from "./hooks";
import { useSaveCommand } from "./hooks";

export const useProcessor = () => {
  useHms();
  useFileTreeEvent();
  useNodeTreeEvent();
  useSaveCommand();
};
