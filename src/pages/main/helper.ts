import { Dispatch } from "react";

import { RootNodeUid } from "@_constants/main";
import { TNodeUid } from "@_node/types";
import {
  clearFileTreeViewState,
  setCurrentFileUid,
  setFileTree,
  setInitialFileUidToOpen,
  setPrevFileUid,
  setPrevRenderableFileUid,
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
  NodeTree_Event_JumpToPastActionType,
} from "@_redux/main/nodeTree/event";
import { setIframeSrc } from "@_redux/main/stageView";
import {
  TCmdkKeyMap,
  TCmdkReference,
  TCmdkReferenceData,
  TFilesReference,
} from "@_types/main";
import { AnyAction } from "@reduxjs/toolkit";

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
export const clearProjectSession = (dispatch: Dispatch<AnyAction>) => {
  dispatch(
    setProject({
      context: "idb",
      name: "",
      favicon: null,
    }),
  );
  dispatch(setFileTree({}));
  dispatch(setInitialFileUidToOpen(""));
  dispatch(setCurrentFileUid(""));
  dispatch(setPrevFileUid(""));
  dispatch(setPrevRenderableFileUid(""));
  dispatch(clearFileTreeViewState());
  dispatch({ type: FileTree_Event_ClearActionType });

  clearFileSession(dispatch);
};
export const clearFileSession = (dispatch: Dispatch<AnyAction>) => {
  dispatch(setNodeTree({}));
  dispatch(setValidNodeTree({}));
  dispatch(clearNodeTreeViewState());
  dispatch({ type: NodeTree_Event_ClearActionType });
  dispatch({ type: NodeTree_Event_JumpToPastActionType, payload: 0 });

  dispatch(setIframeSrc(null));
};
export const getKeyObjectsFromCommand = (command: TCmdkReference) => {
  const shortcuts = (command["Keyboard Shortcut"] as string)?.split(" ");
  const keyObjects: TCmdkKeyMap[] = [];
  shortcuts?.forEach((shortcut) => {
    const keys = shortcut.split("+");
    const keyObj = {
      cmd: false,
      shift: false,
      alt: false,
      key: "",
      click: false,
    };
    keys?.forEach((key) => {
      if (
        key === "cmd" ||
        key === "shift" ||
        key === "alt" ||
        key === "click"
      ) {
        keyObj[key] = true;
      } else {
        keyObj.key = key;
      }
    });
    keyObjects.push(keyObj);
  });
  return keyObjects;
};
export const fileCmdk = ({
  fileTree,
  fFocusedItem,
  filesRef,
  data,
  cmdkSearchContent,
  groupName,
}: any) => {
  const fileNode = fileTree[fFocusedItem];
  if (fileNode) {
    filesRef.map((fileRef: TFilesReference) => {
      fileRef.Name &&
        data["Files"].push({
          Featured: fileRef.Featured === "Yes",
          Name: fileRef.Name,
          Icon: fileRef.Icon,
          Description: fileRef.Description,
          "Keyboard Shortcut": [
            {
              cmd: false,
              shift: false,
              alt: false,
              key: "",
              click: false,
            },
          ],
          Group: groupName,
          Context: `File-${fileRef.Extension}`,
        });
    });
  }
  data["Files"] = data["Files"].filter(
    (element: any) => element.Featured || !!cmdkSearchContent,
  );
  if (data["Files"].length === 0) {
    delete data["Files"];
  }
};
export const elementsCmdk = ({
  nodeTree,
  nFocusedItem,
  htmlReferenceData,
  data,
  cmdkSearchContent,
  groupName,
}: any) => {
  let flag = true;
  for (let x in nodeTree) {
    if (nodeTree[x].displayName === "html") {
      flag = false;
    }
  }

  if (!flag) {
    const htmlNode = nodeTree[nFocusedItem];
    if (htmlNode && htmlNode.parentUid && htmlNode.parentUid !== RootNodeUid) {
      const parentNode = nodeTree[htmlNode.parentUid!];
      const refData = htmlReferenceData.elements[parentNode.displayName];
      if (refData) {
        if (refData.Contain === "All") {
          Object.keys(htmlReferenceData.elements).map((tag: string) => {
            const tagRef = htmlReferenceData.elements[tag];
            if (tagRef !== undefined) {
              data["Elements"].push({
                Featured: tagRef && tagRef.Featured === "Yes" ? true : false,
                Name: tagRef.Name,
                Icon: tagRef.Icon,
                Description: tagRef.Description,
                "Keyboard Shortcut": [
                  {
                    cmd: false,
                    shift: false,
                    alt: false,
                    key: "",
                    click: false,
                  },
                ],
                Group: groupName,
                Context: `Node-${tagRef.Tag}`,
              });
            }
          });
        } else if (refData.Contain === "None") {
          // do nothing
        } else {
          const tagList = refData.Contain.replace(/ /g, "").split(",");
          tagList.map((tag: string) => {
            const pureTag = tag.slice(1, tag.length - 1);
            const tagRef = htmlReferenceData.elements[pureTag];
            if (tagRef !== undefined) {
              data["Elements"].push({
                Featured: tagRef && tagRef.Featured === "Yes" ? true : false,
                Name: tagRef.Name,
                Icon: tagRef.Icon,
                Description: tagRef.Description,
                "Keyboard Shortcut": [
                  {
                    cmd: false,
                    shift: false,
                    alt: false,
                    key: "",
                    click: false,
                  },
                ],
                Group: groupName,
                Context: `Node-${tagRef.Tag}`,
              });
            }
          });
        }
      }
    }
  } else {
    data["Elements"] = [];
    let tagRef = htmlReferenceData.elements["html"];
    tagRef &&
      data["Elements"].push({
        Featured: tagRef && tagRef.Featured === "Yes" ? true : false,
        Name: tagRef.Name.toUpperCase(),
        Icon: tagRef.Icon,
        Description: tagRef.Description,
        "Keyboard Shortcut": [
          {
            cmd: false,
            shift: false,
            alt: false,
            key: "",
            click: false,
          },
        ],
        Group: groupName,
        Context: `Node-${tagRef.Tag}`,
      });
  }
  if (
    data["Elements"].length > 0 &&
    data["Elements"].filter(
      (element: any) => element.Featured || !!cmdkSearchContent,
    ).length > 0
  ) {
    data["Elements"] = data["Elements"].filter(
      (element: any) => element.Featured || !!cmdkSearchContent,
    );
  }
  if (data["Elements"].length === 0) {
    delete data["Elements"];
  }
};
export const scrollToElement = (element: Element, behavior: ScrollBehavior) => {
  element.scrollIntoView({
    block: "nearest",
    inline: "start",
    behavior,
  });
};
export const setSystemTheme = () => {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
  }
};
