export const selectAllText = (
	contentRef: HTMLIFrameElement | null,
	ele: HTMLElement
 ) => {
   const range = contentRef?.contentWindow?.document.createRange();
   if (range) {
	 range.selectNodeContents(ele);
	 const selection = contentRef?.contentWindow?.getSelection();
	 selection?.removeAllRanges();
	 selection?.addRange(range);
   }
 };