import { useProcessorUpdate } from "./useProcessorUpdate";
import { useProcessorValidNodeTree } from "./useProcessorValidNodeTree";
import { useSaveCommand } from "./useSaveCommand";

export const useProcessor = () => {
  useProcessorUpdate();
  useProcessorValidNodeTree();
  useSaveCommand();
};
