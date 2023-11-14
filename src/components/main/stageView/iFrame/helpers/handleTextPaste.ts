export const handleTextPaste = (
  event: ClipboardEvent,
  isEditing: React.MutableRefObject<boolean>,
  contentRef: HTMLIFrameElement | null,
) => {
  event.preventDefault();
  if (isEditing.current) {
    // @ts-ignore
    const pastedText = (event.clipboardData || window.clipboardData).getData(
      "text",
    );
    const cleanedText = pastedText.replace(
      /<\/?([\w\s="/.':;#-\/\?]+)>/gi,
      (match: any, tagContent: any) => tagContent,
    );
    cleanedText.replaceAll("\n\r", "<br>");
    contentRef?.contentWindow?.document.execCommand(
      "insertText",
      false,
      cleanedText,
    );
    isEditing.current = false;
    setTimeout(() => {
      isEditing.current = true;
    }, 50);
  }
};
