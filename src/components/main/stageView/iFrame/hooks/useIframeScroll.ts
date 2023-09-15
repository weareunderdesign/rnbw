import { useCallback, useContext } from "react";

import { NodeInAppAttribName } from "@_constants/main";
import { MainContext } from "@_redux/main";

export interface IUseIframeScrollProps{
	focusedItemRef: React.MutableRefObject<string>,
	contentRef: HTMLIFrameElement | null
}

export const useIframeScroll = ({focusedItemRef, contentRef}:IUseIframeScrollProps) =>{
  const { setCodeViewOffsetTop } = useContext(MainContext);

	const onIframeScroll = useCallback(
		(e: Event) => {
		  if (contentRef && focusedItemRef.current) {
			const newFocusedElement =
			  contentRef?.contentWindow?.document?.querySelector(
				`[${NodeInAppAttribName}="${focusedItemRef.current}"]`,
			  );
			const elementRect = (
			  newFocusedElement as HTMLElement
			)?.getBoundingClientRect();
			if (elementRect) {
			  if (elementRect.y < 0) {
				setCodeViewOffsetTop("calc(66.66vh - 12px)");
			  } else {
				const innerHeight =
				  contentRef?.contentWindow?.document.documentElement.clientHeight;
				const elePosition = elementRect.y + elementRect.height / 2;
				if (innerHeight) {
				  if (elementRect.height < innerHeight / 2) {
					if ((elePosition / innerHeight) * 100 > 66) {
					  setCodeViewOffsetTop("12px");
					}
					if ((elePosition / innerHeight) * 100 < 33) {
					  setCodeViewOffsetTop("calc(66.66vh - 12px)");
					}
				  }
				}
			  }
			}
		  }
		},
		[contentRef],
	  );
	return{
		onIframeScroll
	}  
}