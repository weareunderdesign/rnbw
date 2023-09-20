export const openNewPage = (ele: HTMLElement) => {
	if (ele.tagName !== "A") return;
	const anchorElement = ele as HTMLAnchorElement;
	if (anchorElement.href) {
	  // window.open(anchorElement.href, '_blank', 'noreferrer'); //issue:238
	}
  };