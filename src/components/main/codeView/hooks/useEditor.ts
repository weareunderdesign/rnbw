import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { editor, KeyCode, KeyMod, Selection } from "monaco-editor";
import { useDispatch } from "react-redux";

import { CodeViewSyncDelay_Long, DefaultTabSize } from "@_components/indexConstants";
import { MainContext } from "@_redux/main";
import { setCodeViewTabSize } from "@_redux/main/codeView";
import {
  setCurrentFileContent,
  setNeedToSelectCode,
} from "@_redux/main/nodeTree";
import { useAppState } from "@_redux/useAppState";

import { getCodeViewTheme, getLanguageFromExtension } from "../helpers";
import { TCodeSelection } from "../types";
import { useSaveCommand } from "@_components/main/processor/hooks";
import { setIsCodeTyping } from "@_redux/main/reference";
import { debounce } from "@_components/main/helper";
import { setFileTreeNodes } from "@_redux/main/fileTree";

const useEditor = () => {
  const dispatch = useDispatch();
  const {
    theme: _theme,
    autoSave,
    isCodeTyping,
    wordWrap,
    isContentProgrammaticallyChanged,
    currentFileUid,
    fileTree,
    activePanel,
  } = useAppState();
  const {
    monacoEditorRef,
    setMonacoEditorRef,

    onUndo,
    onRedo,
  } = useContext(MainContext);

  /* we need to keep the state of the app in a ref
  because onChange closure is not updated when the state changes */
  const AppstateRef = useRef({
    theme: _theme,
    autoSave,
    isCodeTyping,
    wordWrap,
    isContentProgrammaticallyChanged,
    currentFileUid,
    fileTree,
    activePanel,
  });

  // theme
  const [theme, setTheme] = useState<"vs-dark" | "light">();

  // language
  const [language, setLanguage] = useState("html");
  const updateLanguage = useCallback((extension: string) => {
    const language = getLanguageFromExtension(extension);
    setLanguage(language);
  }, []);

  const editorConfigs: editor.IEditorConstructionOptions = useMemo(
    () => ({
      contextmenu: true,
      wordWrap: wordWrap ? "on" : "off",
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
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: "on",
      inlineSuggest: { enabled: true },
      quickSuggestions: true,
      snippetSuggestions: "inline",
    }),
    [wordWrap],
  );

  // code selection
  const [codeSelection, _setCodeSelection] = useState<TCodeSelection | null>(
    null,
  );
  const codeSelectionRef = useRef<TCodeSelection | null>(null);
  const isCodeEditingView = useRef(false);

  const setCodeSelection = useCallback(() => {
    const monacoEditor = monacoEditorRef.current;
    const _selection = monacoEditor?.getSelection();
    _setCodeSelection(_selection ? _selection : null);
  }, []);

  // handlerEditorDidMount
  const handleEditorDidMount = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      setMonacoEditorRef(editor);

      // override monaco-editor undo/redo
      editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyZ, () => {
        setUndoRedoToggle((prev) => ({
          action: "undo",
          toggle: !prev.toggle,
        }));
      });
      editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyZ, () => {
        setUndoRedoToggle((prev) => ({
          action: "redo",
          toggle: !prev.toggle,
        }));
      });
      editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyY, () => {
        setUndoRedoToggle((prev) => ({
          action: "redo",
          toggle: !prev.toggle,
        }));
      });

      editor.onDidChangeCursorPosition((event) => {
        const selection = editor.getSelection();
        if (event.source === "mouse") {
          if (selection && selection.isEmpty()) {
            setCodeSelection();
          }
        } else if (event.source === "keyboard") {
          setCodeSelection();
        }
      });
    },
    [setCodeSelection],
  );

  const { debouncedAutoSave } = useSaveCommand();

  // handleOnChange
  const onChange = useCallback(
    (value: string, changedFileUid: string) => {
      if (changedFileUid === AppstateRef.current.currentFileUid) {
        dispatch(setCurrentFileContent(value));
      } else {
        const file = structuredClone(
          AppstateRef.current.fileTree[changedFileUid],
        );
        const fileData = file.data;
        fileData.content = value;
        dispatch(setFileTreeNodes([file]));
      }

      if (!AppstateRef.current.isContentProgrammaticallyChanged) {
        const selectedRange: Selection | null =
          monacoEditorRef.current?.getSelection() || null;
        dispatch(
          setNeedToSelectCode(
            selectedRange
              ? {
                  startLineNumber: selectedRange.startLineNumber,
                  startColumn: selectedRange.startColumn,
                  endLineNumber: selectedRange.endLineNumber,
                  endColumn: selectedRange.endColumn,
                }
              : null,
          ),
        );
      }

      autoSave && debouncedAutoSave();
      AppstateRef.current.isCodeTyping && dispatch(setIsCodeTyping(false));
    },
    [autoSave, debouncedAutoSave],
  );

  const handleKeyDown = () => {
    isCodeEditingView.current = true;
  };

  const longDebouncedOnChange = useCallback(
    debounce(onChange, CodeViewSyncDelay_Long),
    [onChange],
  );

  const handleOnChange = useCallback(
    (value: string | undefined, changedFileUid: string) => {
      if (value === undefined) return;

      if (AppstateRef.current.isContentProgrammaticallyChanged) {
        onChange(value, changedFileUid);
      } else {
        !AppstateRef.current.isCodeTyping && dispatch(setIsCodeTyping(true));
        longDebouncedOnChange(value, changedFileUid);
      }
    },
    [longDebouncedOnChange, onChange],
  );

  // undo/redo
  const [undoRedoToggle, setUndoRedoToggle] = useState<{
    action: "none" | "undo" | "redo";
    toggle: boolean;
  }>({ action: "none", toggle: false });

  useEffect(() => {
    AppstateRef.current = {
      theme: _theme,
      autoSave,
      isCodeTyping,
      wordWrap,
      isContentProgrammaticallyChanged,
      currentFileUid,
      fileTree,
      activePanel,
    };
  }, [
    _theme,
    autoSave,
    isCodeTyping,
    wordWrap,
    isContentProgrammaticallyChanged,
    currentFileUid,
    fileTree,
    activePanel,
  ]);

  // set default tab-size
  useEffect(() => {
    dispatch(setCodeViewTabSize(DefaultTabSize));
  }, []);

  useEffect(() => {
    setTheme(getCodeViewTheme(_theme));
  }, [_theme]);

  useEffect(() => {
    codeSelectionRef.current = codeSelection;
    isCodeEditingView.current = true;
  }, [codeSelection]);

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
    handleKeyDown,
    theme,

    language,
    updateLanguage,

    editorConfigs,

    codeSelection,
  };
};

export default useEditor;
