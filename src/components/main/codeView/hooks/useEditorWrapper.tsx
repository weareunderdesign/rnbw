import { useRef, useEffect, useContext } from "react";
import { editor } from "monaco-editor";
import { debounce } from "lodash";
import { MainContext } from "@_redux/main";
import { useDispatch } from "react-redux";
import { setActivePanel } from "@_redux/main/processor";

const resetEditorLayout = (
  editorWrapper: HTMLDivElement | null,
  monacoEditor: editor.IStandaloneCodeEditor | null,
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

export default function useEditorWrapper() {
  const dispatch = useDispatch();
  const { monacoEditorRef } = useContext(MainContext);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const monacoEditor = monacoEditorRef.current;
  // panel focus handler
  function onPanelClick() {
    dispatch(setActivePanel("code"));
  }

  useEffect(() => {
    const debounced = debounce(
      () => resetEditorLayout(editorWrapperRef.current, monacoEditor),
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

  return { editorWrapperRef, onPanelClick };
}
