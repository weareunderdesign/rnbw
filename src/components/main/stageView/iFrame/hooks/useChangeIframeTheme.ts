import { useContext } from "react";

import { NodeUidAttribNameInApp } from "@_constants/main";
import { MainContext } from "@_redux/main";

export interface IUseChangeIframThemeProps {
  contentRef: HTMLIFrameElement | null;
}

export const useChangeIframeTheme = ({
  contentRef,
}: IUseChangeIframThemeProps) => {
  const { validNodeTree, theme } = useContext(MainContext);

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
      `[${NodeUidAttribNameInApp}="${uid}"]`,
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
