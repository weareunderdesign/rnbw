import { StageNodeIdAttr } from "@_node/file/handlers/constants";
import { useAppState } from "@_redux/useAppState";

export interface IUseChangeIframThemeProps {
  contentRef: HTMLIFrameElement | null;
}

export const useChangeIframeTheme = ({
  contentRef,
}: IUseChangeIframThemeProps) => {
  const { theme, validNodeTree } = useAppState();

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
