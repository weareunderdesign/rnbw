export const handleAnchorTagDoubleClick = (
	ele: any
	) => {
	if (ele.tagName === "A" && ele.href ) {
	  // window.open(ele.href, '_blank', 'noreferrer'); // Issue: 238
	}
  };