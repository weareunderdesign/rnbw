import { useContext } from "react";

import { MainContext } from "@_redux/main";
import { useSelector } from "react-redux";
import { AppState } from "@_redux/_root";
import { validNodeTreeSelector } from "@_redux/main/nodeTree";
import { themeSelector } from "@_redux/global";
import { StageNodeIdAttr } from "@_node/html";

export interface IUseChangeIframThemeProps {
  contentRef: HTMLIFrameElement | null;
}

export const useChangeIframeTheme = ({
  contentRef,
}: IUseChangeIframThemeProps) => {
  const validNodeTree = useSelector(validNodeTreeSelector);
  const theme = useSelector(themeSelector);

  const changeIframeTheme = () => {
    let uid = "-1";
    for (let x in validNodeTree) {
      if (
        validNodeTree[x].data.name === "html" &&
        validNodeTree[x].data.type === "tag"
      ) {
        uid = validNodeTree[x].uid;
        break;
      }
    }
    const ele = contentRef?.contentWindow?.document?.querySelector(
      `[${StageNodeIdAttr}="${uid}"]`,
    );
    if (contentRef) {
      if (theme !== "Light") {
        ele?.setAttribute("data-theme", "dark");
      } else {
        ele?.setAttribute("data-theme", "light");
      }
    }
  };

  return {
    changeIframeTheme,
  };
};
