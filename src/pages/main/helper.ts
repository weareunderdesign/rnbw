import { Dispatch } from "react";

import { RootNodeUid } from "@_constants/main";
import { TNodeTreeData, TNodeUid } from "@_node/types";
import {
  clearFileTreeViewState,
  expandFileTreeNodes,
  setFileTree,
  setInitialFileUidToOpen,
  setPrevFileUid,
  setRenderableFileUid,
  setProject,
} from "@_redux/main/fileTree";
import { FileTree_Event_ClearActionType } from "@_redux/main/fileTree/event";
import { clearNodeTreeViewState, setNodeTree } from "@_redux/main/nodeTree";
import {
  NodeTree_Event_ClearActionType,
  NodeTree_Event_JumpToPastActionType,
  setCurrentFileUid,
} from "@_redux/main/nodeTree/event";
import { setIframeSrc } from "@_redux/main/stageView";
import {
  TCmdkGroupData,
  TCmdkKeyMap,
  TCmdkReference,
  TCmdkReferenceData,
  THtmlReferenceData,
} from "@_types/main";
import { AnyAction } from "@reduxjs/toolkit";
import { THtmlNodeData } from "@_node/node";
import { TFileNodeData, TFileNodeTreeData, createURLPath } from "@_node/index";
import {
  setActivePanel,
  setNavigatorDropdownType,
} from "@_redux/main/processor";
import { AnyFunction } from "./types";
import { toast } from "react-toastify";
import { NavigateFunction } from "react-router-dom";
import { TFilesReference } from "@rnbws/rfrncs.design";
import { FileNode } from "@_redux/main";

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
  // Search
  cmdkReferenceData["Search"] = {
    Name: "Search",
    Icon: "",
    Description: "",
    "Keyboard Shortcut": [
      {
        cmd: false,
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
  dispatch(setRenderableFileUid(""));
  dispatch(clearFileTreeViewState());
  dispatch({ type: FileTree_Event_ClearActionType });

  clearFileSession(dispatch);
};
export const clearFileSession = (dispatch: Dispatch<AnyAction>) => {
  dispatch(setNodeTree({}));
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
}: {
  fileTree: TFileNodeTreeData;
  fFocusedItem: TNodeUid;
  filesRef: TFilesReference[];
  data: TCmdkGroupData;
  cmdkSearchContent: string;
  groupName: string;
}) => {
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
    (element: TCmdkReference) => element.Featured || !!cmdkSearchContent,
  );
  if (data["Files"].length === 0) {
    delete data["Files"];
  }
};
export const elementsCmdk = ({
  validNodeTree,
  nFocusedItem,
  htmlReferenceData,
  data,
  groupName,
  isMove = false,
}: {
  validNodeTree: TNodeTreeData;
  nFocusedItem: TNodeUid;
  htmlReferenceData: THtmlReferenceData;
  data: TCmdkGroupData;
  groupName: string;
  isMove?: boolean;
}) => {
  let flag = true;
  for (const x in validNodeTree) {
    if (validNodeTree[x].displayName === "html") {
      flag = false;
    }
  }

  if (!flag) {
    const htmlNode = validNodeTree[nFocusedItem];
    if (htmlNode && htmlNode.parentUid && htmlNode.parentUid !== RootNodeUid) {
      const parentNode = validNodeTree[htmlNode.parentUid!];
      const refData =
        htmlReferenceData.elements[
          isMove ? htmlNode.displayName : parentNode.displayName
        ];

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
    } else if (htmlNode?.displayName === "html") {
      //@ts-expect-error - FIXME: fix this
      data["Elements"] = ["head", "body"];
    }
  } else {
    data["Elements"] = [];
    const tagRef = htmlReferenceData.elements["html"];
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

  if (data["Elements"].length === 0) {
    delete data["Elements"];
  }
};

export const isWebComponentDblClicked = ({
  nodeData,
  htmlReferenceData,
}: {
  nodeData: THtmlNodeData;
  htmlReferenceData: THtmlReferenceData;
}) => {
  // check the element is wc
  let found = false;
  if (nodeData && htmlReferenceData.elements[nodeData.nodeName] === undefined)
    found = true;
  return found;
};
export const convertToFileNodes = (data: TFileNodeTreeData): FileNode[] => {
  const result: FileNode[] = [];
  for (const key in data) {
    const node = data[key];
    if (node.data.kind === "file") {
      result.push({
        type: "file",
        name: node.data.name,
        path: node.data.path,
      });
    }
  }
  return result;
};
export const filterFiles = (
  fileTree: TFileNodeTreeData,
  query: string,
): string[] => {
  const results: string[] = [];
  const fileNodes = convertToFileNodes(fileTree);

  function searchTree(node: FileNode, path: string = "") {
    if (
      node.type === "file" &&
      node.path.toLowerCase().includes(query.toLowerCase())
    ) {
      results.push(node.path);
    } else if (node.type === "directory" && node.children) {
      node.children.forEach((child) =>
        searchTree(child, `${path}/${node.name}`),
      );
    }
  }

  fileNodes.forEach((root) => searchTree(root));
  return results;
};

export const onWebComponentDblClick = ({
  wcName,
  fileTree,
  validNodeTree,
  dispatch,
  expandedItemsObj,
  navigate,
}: {
  wcName: string;
  fileTree: TFileNodeTreeData;
  validNodeTree: TNodeTreeData;
  dispatch: Dispatch<AnyAction>;
  expandedItemsObj: {
    [uid: TNodeUid]: true;
  };
  navigate: NavigateFunction;
}) => {
  let exist = false;
  let filePath = "";
  for (const x in fileTree) {
    const defineRegex = /customElements\.define\(\s*['"]([\w-]+)['"]/;
    if (
      (fileTree[x].data as TFileNodeData).content &&
      (fileTree[x].data as TFileNodeData).ext === "js"
    ) {
      const match = (fileTree[x].data as TFileNodeData).content.match(
        defineRegex,
      );
      if (match) {
        // check web component
        if (wcName === match[1].toLowerCase()) {
          const fileName = (fileTree[x].data as TFileNodeData).name;
          let src = "";
          for (const i in validNodeTree) {
            if (
              (validNodeTree[i].data as THtmlNodeData).nodeName === "script"
            ) {
              src = (validNodeTree[i].data as THtmlNodeData).attribs.src;
              if (src.search(fileName + ".js") !== -1) break;
            }
          }
          if (src !== "") {
            if (
              src.startsWith("http") ||
              src.startsWith("https") ||
              src.startsWith("//")
            ) {
              toast.error("rnbw couldn't find it's source file");
              break;
            } else {
              dispatch(setNavigatorDropdownType("project"));
              dispatch(setActivePanel("code"));
              filePath = createURLPath(
                fileTree[x].uid,
                RootNodeUid,
                fileTree[RootNodeUid]?.displayName,
              );
              // expand path to the uid
              const _expandedItems: string[] = [];
              let _file = fileTree[x];
              while (_file && _file.uid !== RootNodeUid) {
                _file = fileTree[_file.parentUid as string];
                if (
                  _file &&
                  !_file.isEntity &&
                  (!expandedItemsObj[_file.uid] ||
                    expandedItemsObj[_file.uid] === undefined)
                )
                  _expandedItems.push(_file.uid);
              }
              dispatch(expandFileTreeNodes(_expandedItems));

              exist = true;
              navigate(filePath);
              break;
            }
          }
        }
      }
    }
  }
  if (!exist) {
    toast.error("rnbw couldn't find it's source file");
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

export function debounce<F extends AnyFunction>(
  func: F,
  wait: number,
): (...args: Parameters<F>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function debounced(...args: Parameters<F>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export const getObjKeys = <T>(obj: { [key: string]: T }): string[] => {
  return Object.keys(obj);
};
