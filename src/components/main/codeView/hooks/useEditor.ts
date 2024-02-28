import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { debounce } from "lodash";
import { editor, KeyCode, KeyMod } from "monaco-editor";
import { useDispatch } from "react-redux";

import {
  CodeViewSyncDelay,
  CodeViewSyncDelay_Long,
  DefaultTabSize,
} from "@_constants/main";
import { MainContext } from "@_redux/main";
import { setCodeViewTabSize } from "@_redux/main/codeView";
import {
  setCurrentFileContent,
  setNeedToSelectCode,
} from "@_redux/main/nodeTree";
import { useAppState } from "@_redux/useAppState";

import { getCodeViewTheme, getLanguageFromExtension } from "../helpers";
import { TCodeSelection } from "../types";
import { useSaveCommand } from "@_pages/main/processor/hooks";
import {
  setIsCodeTyping,
  setIsContentProgrammaticallyChanged,
} from "@_redux/main/reference";

const useEditor = () => {
  const dispatch = useDispatch();
  const {
    theme: _theme,
    autoSave,
    isContentProgrammaticallyChanged,
  } = useAppState();
  const {
    monacoEditorRef,
    setMonacoEditorRef,

    onUndo,
    onRedo,
  } = useContext(MainContext);

  // set default tab-size
  useEffect(() => {
    dispatch(setCodeViewTabSize(DefaultTabSize));
  }, []);

  // theme
  const [theme, setTheme] = useState<"vs-dark" | "light">();
  useEffect(() => {
    setTheme(getCodeViewTheme(_theme));
  }, [_theme]);

  // language
  const [language, setLanguage] = useState("html");
  const updateLanguage = useCallback((extension: string) => {
    const language = getLanguageFromExtension(extension);
    setLanguage(language);
  }, []);

  // editor config variables
  const [wordWrap, setWordWrap] =
    useState<editor.IEditorOptions["wordWrap"]>("on");
  const editorConfigs: editor.IEditorConstructionOptions = useMemo(
    () => ({
      contextmenu: true,
      wordWrap,
      minimap: { enabled: false },
      automaticLayout: true,
      selectionHighlight: false,
      autoClosingBrackets: "always",
      autoIndent: "full",
      autoClosingQuotes: "always",
      autoClosingOvertype: "always",
      autoSurround: "languageDefined",
      codeLens: false,
      formatOnPaste: true,
      formatOnType: true,
      tabCompletion: "on",
    }),
    [wordWrap],
  );

  // code selection
  const [codeSelection, _setCodeSelection] = useState<TCodeSelection | null>(
    null,
  );
  const codeSelectionRef = useRef<TCodeSelection | null>(null);

  useEffect(() => {
    codeSelectionRef.current = codeSelection;
  }, [codeSelection]);

  const setCodeSelection = useCallback(() => {
    const monacoEditor = monacoEditorRef.current;
    const _selection = monacoEditor?.getSelection();
    _setCodeSelection(_selection ? _selection : null);
  }, []);

  // handlerEditorDidMount
  const handleEditorDidMount = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      setMonacoEditorRef(editor);

      //override monaco-editor undo/redo
      editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyZ, () =>
        setUndoRedoToggle((prev) => ({
          action: "undo",
          toggle: !prev.toggle,
        })),
      );
      editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyZ, () =>
        setUndoRedoToggle((prev) => ({
          action: "redo",
          toggle: !prev.toggle,
        })),
      );
      editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyY, () =>
        setUndoRedoToggle((prev) => ({
          action: "redo",
          toggle: !prev.toggle,
        })),
      );

      editor.onDidChangeCursorPosition((event) => {
        (event.source === "mouse" || event.source === "keyboard") &&
          setCodeSelection();
      });
    },
    [setCodeSelection],
  );

  const { debouncedAutoSave } = useSaveCommand();

  // handleOnChange
  const onChange = useCallback(
    (value: string) => {
      dispatch(setCurrentFileContent(value));
      dispatch(
        setNeedToSelectCode(
          codeSelectionRef.current
            ? {
                startLineNumber: codeSelectionRef.current.startLineNumber,
                startColumn: codeSelectionRef.current.startColumn,
                endLineNumber: codeSelectionRef.current.endLineNumber,
                endColumn: codeSelectionRef.current.endColumn,
              }
            : null,
        ),
      );
      dispatch(setIsCodeTyping(false));
      autoSave && debouncedAutoSave();
    },
    [debouncedAutoSave, autoSave],
  );

  const debouncedOnChange = useCallback(
    debounce((value) => {
      onChange(value);
      dispatch(setIsContentProgrammaticallyChanged(false));
    }, CodeViewSyncDelay),
    [onChange],
  );

  const longDebouncedOnChange = useCallback(
    debounce(onChange, CodeViewSyncDelay_Long),
    [onChange],
  );

  const handleOnChange = useCallback(
    (value: string | undefined) => {
      if (value === undefined) return;

      dispatch(setIsCodeTyping(true));

      if (isContentProgrammaticallyChanged) {
        debouncedOnChange(value);
      } else {
        longDebouncedOnChange(value);
      }
    },
    [debouncedOnChange, longDebouncedOnChange],
  );

  // undo/redo
  const [undoRedoToggle, setUndoRedoToggle] = useState<{
    action: "none" | "undo" | "redo";
    toggle: boolean;
  }>({ action: "none", toggle: false });

  useEffect(() => {
    if (undoRedoToggle.action === "undo") {
      onUndo();
    } else if (undoRedoToggle.action === "redo") {
      onRedo();
    }
  }, [undoRedoToggle]);

  return {
    handleEditorDidMount,
    handleOnChange,

    theme,

    language,
    updateLanguage,

    editorConfigs,
    setWordWrap,

    codeSelection,
  };
};

export default useEditor;
