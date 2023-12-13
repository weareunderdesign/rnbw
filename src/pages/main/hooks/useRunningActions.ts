import { useCallback, useRef } from "react";

import { useDispatch } from "react-redux";

import { setDoingAction } from "@_redux/main/processor";

export const useRunningActions = () => {
  const dispatch = useDispatch();

  const runningActions = useRef<{ [actionName: string]: true }>({});
  const hasRunningAction = useCallback(
    () => (Object.keys(runningActions.current).length === 0 ? false : true),
    [],
  );
  const addRunningActions = useCallback((actionNames: string[]) => {
    let added = false;
    for (const actionName of actionNames) {
      if (!runningActions.current[actionName]) {
        runningActions.current[actionName] = true;
        added = true;
      }
    }
    added && dispatch(setDoingAction(true));
  }, []);
  const removeRunningActions = useCallback(
    (actionNames: string[]) => {
      let removed = false;
      for (const actionName of actionNames) {
        if (runningActions.current[actionName]) {
          delete runningActions.current[actionName];
          removed = true;
        }
      }
      removed && !hasRunningAction() && dispatch(setDoingAction(false));
    },
    [hasRunningAction],
  );

  return {
    addRunningActions,
    removeRunningActions,
  };
};
