import { useSelector } from "react-redux";

import { StageNodeIdAttr } from "@_node/file/handlers/constants";
import { themeSelector } from "@_redux/global";
import { validNodeTreeSelector } from "@_redux/main/nodeTree";

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
