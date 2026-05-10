import { useEffect } from "react";

import { useDispatch } from "react-redux";

import { setDidRedo, setDidUndo } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import { useSaveCommand } from "./useSaveCommand";

export const useHms = () => {
  const dispatch = useDispatch();
  const { didUndo, didRedo, autoSave } = useAppState();
  const { debouncedAutoSave } = useSaveCommand();

  useEffect(() => {
    didUndo && dispatch(setDidUndo(false));
    didRedo && dispatch(setDidRedo(false));
    autoSave && debouncedAutoSave();
  }, [didUndo, didRedo, autoSave]);
};
