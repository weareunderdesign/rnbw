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
  const { cmdkOpen, cmdkPages, currentCmdkPage } = useAppState();

  const [validMenuItemCount, setValidMenuItemCount] = useState<number>();
  const [hoveredMenuItemDescription, setHoverMenuItemDescription] = useState<
    string | null | undefined
  >();

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

        const description =
          currentCmdkPage === "Add" ||
          currentCmdkPage === "Turn into" ||
          currentCmdkPage === "Jumpstart"
            ? document
                .querySelector('.rnbw-cmdk-menu-item[aria-selected="true"]')
                ?.getAttribute("rnbw-cmdk-menu-item-description")
            : "";
        setHoverMenuItemDescription(description);
      }, 10);
    } else {
      // clear cmdk pages and search text when close the modal
      dispatch(setCmdkPages([]));
      dispatch(setCmdkSearchContent(""));
      // setValidMenuItemCount(undefined)
    }

    return () => clearInterval(hoveredMenuItemDetecter);
  }, [cmdkOpen]);

  return {
    validMenuItemCount,
    hoveredMenuItemDescription,
  };
};
