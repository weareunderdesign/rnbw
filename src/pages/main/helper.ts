import {
  clearFileTreeViewState,
  setCurrentFileUid,
  setFileTree,
  setInitialFileUidToOpen,
  setProject,
} from "@_redux/main/fileTree";
import { FileTree_Event_ClearActionType } from "@_redux/main/fileTree/event";
import {
  clearNodeTreeViewState,
  setNodeTree,
  setValidNodeTree,
} from "@_redux/main/nodeTree";
import {
  NodeTree_Event_ClearActionType,
  setCurrentFileContent,
} from "@_redux/main/nodeTree/event";
import { setIframeSrc } from "@_redux/main/stageView";
import { TCmdkReferenceData } from "@_types/main";
import { useDispatch } from "react-redux";

export const addDefaultCmdkActions = (
  cmdkReferenceData: TCmdkReferenceData,
) => {
  // Clear
  cmdkReferenceData["Clear"] = {
    Name: "Clear",
    Icon: "",
    Description: "",
    "Keyboard Shortcut": [
      {
        cmd: true,
        shift: true,
        alt: false,
        key: "KeyR",
        click: false,
      },
    ],
    Group: "default",
    Context: "all",
  };
  // Jumpstart
  cmdkReferenceData["Jumpstart"] = {
    Name: "Jumpstart",
    Icon: "",
    Description: "",
    "Keyboard Shortcut": [
      {
        cmd: false,
        shift: false,
        alt: false,
        key: "KeyJ",
        click: false,
      },
    ],
    Group: "default",
    Context: "all",
  };
  // Actions
  cmdkReferenceData["Actions"] = {
    Name: "Actions",
    Icon: "",
    Description: "",
    "Keyboard Shortcut": [
      {
        cmd: false,
        shift: false,
        alt: false,
        key: "KeyW",
        click: false,
      },
    ],
    Group: "default",
    Context: "all",
  };
  // File Save
  cmdkReferenceData["Save"] = {
    Name: "Save",
    Icon: "",
    Description: "",
    "Keyboard Shortcut": [
      {
        cmd: true,
        shift: false,
        alt: false,
        key: "KeyS",
        click: false,
      },
    ],
    Group: "default",
    Context: "all",
  };
};

export const clearProjectSession = () => {
  const dispatch = useDispatch();

  dispatch(
    setProject({
      context: "idb",
      name: "",
      handler: null,
      favicon: null,
    }),
  );
  dispatch(setFileTree({}));
  dispatch(setInitialFileUidToOpen(""));
  dispatch(setCurrentFileUid(""));
  dispatch(setCurrentFileContent(""));
  dispatch(clearFileTreeViewState());
  dispatch({ type: FileTree_Event_ClearActionType });

  clearFileSession();
};

export const clearFileSession = () => {
  const dispatch = useDispatch();

  dispatch(setNodeTree({}));
  dispatch(setValidNodeTree({}));
  dispatch(clearNodeTreeViewState());
  dispatch({ type: NodeTree_Event_ClearActionType });

  dispatch(setIframeSrc(null));
};
