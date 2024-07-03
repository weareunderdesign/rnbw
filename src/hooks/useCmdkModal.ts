import { useEffect, useState } from "react";

import { useDispatch } from "react-redux";

import {
  setCmdkOpen,
  setCmdkPages,
  setCmdkSearchContent,
  setCurrentCmdkPage,
} from "@_redux/main/cmdk";
import { useAppState } from "@_redux/useAppState";

export const useCmdkModal = () => {
  const dispatch = useDispatch();
  const { cmdkOpen, cmdkPages } = useAppState();

  const [validMenuItemCount, setValidMenuItemCount] = useState<number>();

  useEffect(() => {
    cmdkPages.length && dispatch(setCmdkOpen(true));
    dispatch(setCurrentCmdkPage([...cmdkPages].pop() || ""));
  }, [cmdkPages]);
  useEffect(() => {
    let hoveredMenuItemDetecter: NodeJS.Timeout;
    if (cmdkOpen) {
      // detect hovered menu item in cmdk modal if its open
      hoveredMenuItemDetecter = setInterval(() => {
        const menuItems = document.querySelectorAll(".rnbw-cmdk-menu-item");
        setValidMenuItemCount(menuItems.length);
      }, 10);
    } else {
      // clear cmdk pages and search text when close the modal
      dispatch(setCmdkPages([]));
      dispatch(setCmdkSearchContent(""));
    }

    return () => clearInterval(hoveredMenuItemDetecter);
  }, [cmdkOpen]);

  return {
    validMenuItemCount,
  };
};
