import useElements from "./useElements";
import useFiles from "./useFiles";

export default function useRnbw() {
  const files = useFiles();
  const elements = useElements();
  return {
    files,
    elements,
  };
}
