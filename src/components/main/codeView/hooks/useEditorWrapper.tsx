import { useRef, useEffect } from "react";
import { editor } from "monaco-editor";
import { debounce } from "lodash";

const resetEditorLayout = (
  monacoEditor: editor.IStandaloneCodeEditor | null,
  editorWrapper: HTMLDivElement | null,
) => {
  if (!monacoEditor) return;
  monacoEditor.layout({ width: 0, height: 0 });
  window.requestAnimationFrame(() => {
    const wrapperRect = editorWrapper?.getBoundingClientRect();
    wrapperRect &&
      monacoEditor.layout({
        width: wrapperRect.width - 18,
        height: wrapperRect.height - 18,
      });
  });
};
export default function useEditorWrapper(
  monacoEditor: editor.IStandaloneCodeEditor | null,
) {
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const debounced = debounce(
      () => resetEditorLayout(monacoEditor, editorWrapperRef.current),
      100,
    );
    const resizeObserver = new ResizeObserver(debounced);

    editorWrapperRef.current &&
      resizeObserver.observe(editorWrapperRef.current);
    return () => {
      editorWrapperRef.current &&
        resizeObserver.unobserve(editorWrapperRef.current);
    };
  }, [monacoEditor]);

  return { editorWrapperRef };
}
