import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import cx from "classnames";
import { DraggingPositionItem } from "react-complex-tree";
import { useDispatch, useSelector } from "react-redux";

import { SVGIconI, TreeView } from "@_components/common";
import { TreeViewData } from "@_components/common/treeView/types";
import {
  AddFileActionPrefix,
  HmsClearActionType,
  RootNodeUid,
} from "@_constants/main";
import {
  _path,
  getNormalizedPath,
  TFileNodeData,
  TFilesReference,
} from "@_node/file";
import { TNode, TNodeUid } from "@_node/types";
import {
  ffSelector,
  globalSelector,
  MainContext,
  navigatorSelector,
} from "@_redux/main";
import { addClass, generateQuerySelector, removeClass } from "@_services/main";
import {
  useFileOperations,
  useInvalidNodes,
  useNodeActionsHandler,
  useNodeViewState,
  useTemporaryNodes,
  useCmdk,
} from "./hooks";
import { Container, ItemArrow } from "./workSpaceTreeComponents";

const AutoExpandDelay = 1 * 1000;
export default function WorkspaceTreeView() {
  const dispatch = useDispatch();
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const { file } = useSelector(navigatorSelector);
  const { fileAction } = useSelector(globalSelector);
  const { focusedItem, expandedItems, selectedItems } = useSelector(ffSelector);
  const {
    // global action
    addRunningActions,
    removeRunningActions,
    // navigator
    project,
    navigatorDropDownType,
    // node actions
    activePanel,
    setActivePanel,
    // actions panel
    showActionsPanel,
    // file tree view
    initialFileToOpen,
    setInitialFileToOpen,
    ffTree,
    ffHoveredItem,
    setFFHoveredItem,
    isHms,
    setIsHms,
    ffAction,
    currentFileUid,
    // stage view
    linkToOpen,
    // references
    filesReferenceData,
    // cmdk
    currentCommand,
    // non-parse file
    parseFileFlag,
    setParseFile,
    prevFileUid,
  } = useContext(MainContext);
  // -------------------------------------------------------------- node status --------------------------------------------------------------
  //  invalid - can't do any actions on the nodes
  const { invalidNodes } = useInvalidNodes();
  // temporary - don't display the nodes
  const { setTemporaryNodes, removeTemporaryNodes } = useTemporaryNodes();
  // -------------------------------------------------------------- hms --------------------------------------------------------------
  const { _copy, _create, _cut, _delete, _rename } = useFileOperations();

  useEffect(() => {
    if (isHms === null) return;

    // isHms === true ? undo : redo
    if (isHms === true) {
      const { type, param1, param2 } = fileAction;
      if (type === "create") {
        _delete([param1]);
      } else if (type === "rename") {
        const { parentUid } = param1;
        const { orgName, newName } = param2;
        const currentUid = `${parentUid}/${newName}`;
        (async () => {
          setTemporaryNodes(currentUid);
          await _rename(currentUid, orgName);
          removeTemporaryNodes(currentUid);
        })();
      } else if (type === "cut") {
        const _uids: { uid: TNodeUid; parentUid: TNodeUid; name: string }[] =
          param1;
        const _targetUids: TNodeUid[] = param2;

        const uids: TNodeUid[] = [];
        const targetUids: TNodeUid[] = [];

        _targetUids.map((targetUid, index) => {
          const { uid, parentUid, name } = _uids[index];
          uids.push(`${targetUid}/${name}`);
          targetUids.push(parentUid);
        });
        _cut(uids, targetUids);
      } else if (type === "copy") {
        const _uids: { uid: TNodeUid; name: string }[] = param1;
        const _targetUids: TNodeUid[] = param2;

        const uids: TNodeUid[] = [];
        _targetUids.map((targetUid, index) => {
          const { name } = _uids[index];
          uids.push(`${targetUid}/${name}`);
        });
        _delete(uids);
      } else if (type === "delete") {
      }
    } else {
      const { type, param1, param2 } = ffAction;
      if (type === "create") {
        _create(param2);
      } else if (type === "rename") {
        const { uid } = param1;
        const { newName } = param2;
        (async () => {
          setTemporaryNodes(uid);
          await _rename(uid, newName);
          removeTemporaryNodes(uid);
        })();
      } else if (type === "cut") {
        const _uids: { uid: TNodeUid; name: string }[] = param1;
        const targetUids: TNodeUid[] = param2;

        const uids: TNodeUid[] = _uids.map((_uid) => _uid.uid);
        _cut(uids, targetUids);
      } else if (type === "copy") {
        const _uids: { uid: TNodeUid; name: string }[] = param1;
        const targetUids: TNodeUid[] = param2;

        const uids: TNodeUid[] = [];
        const names: string[] = [];
        _uids.map((_uid) => {
          uids.push(_uid.uid);
          names.push(_uid.name);
        });
        _copy(uids, names, targetUids);
      } else if (type === "delete") {
      }
    }

    setIsHms(null);
  }, [isHms]);
  // -------------------------------------------------------------- sync --------------------------------------------------------------
  // outline the hovered item
  const hoveredItemRef = useRef<TNodeUid>(ffHoveredItem);
  useEffect(() => {
    if (hoveredItemRef.current === ffHoveredItem) return;

    const curHoveredElement = document.querySelector(
      `#FileTreeView-${generateQuerySelector(hoveredItemRef.current)}`,
    );
    curHoveredElement?.setAttribute(
      "class",
      removeClass(curHoveredElement.getAttribute("class") || "", "outline"),
    );
    const newHoveredElement = document.querySelector(
      `#FileTreeView-${generateQuerySelector(ffHoveredItem)}`,
    );
    newHoveredElement?.setAttribute(
      "class",
      addClass(newHoveredElement.getAttribute("class") || "", "outline"),
    );

    hoveredItemRef.current = ffHoveredItem;
  }, [ffHoveredItem]);
  // scroll to the focused item
  const focusedItemRef = useRef<TNodeUid>(focusedItem);
  useEffect(() => {
    if (focusedItemRef.current === focusedItem) return;

    const focusedElement = document.querySelector(
      `#FileTreeView-${generateQuerySelector(focusedItem)}`,
    );
    setTimeout(
      () =>
        focusedElement?.scrollIntoView({
          block: "nearest",
          inline: "start",
          behavior: "auto",
        }),
      30,
    );

    focusedItemRef.current = focusedItem;
  }, [focusedItem]);
  // build fileTreeViewData
  const fileTreeViewData = useMemo(() => {
    const data: TreeViewData = {};
    for (const uid in ffTree) {
      const node: TNode = ffTree[uid];
      data[uid] = {
        index: uid,
        data: node,
        children: node.children,
        isFolder: !node.isEntity,
        canMove: uid !== RootNodeUid,
        canRename: uid !== RootNodeUid,
      };
    }
    return data;
  }, [ffTree]);
  // -------------------------------------------------------------- node view state handlers --------------------------------------------------------------
  const { cb_collapseNode, cb_expandNode, cb_focusNode, cb_selectNode } =
    useNodeViewState();
  // -------------------------------------------------------------- project --------------------------------------------------------------
  // open default initial html file
  useEffect(() => {
    if (initialFileToOpen !== "" && ffTree[initialFileToOpen] !== undefined) {
      setInitialFileToOpen("");
      // focus/select/read the initial file
      addRunningActions([
        "fileTreeView-focus",
        "fileTreeView-select",
        "fileTreeView-read",
      ]);
      cb_focusNode(initialFileToOpen);
      cb_selectNode([initialFileToOpen]);
      cb_readNode(initialFileToOpen);
      if (project && file) {
        // remove exist script
        const exist = document.head.querySelector("#custom-plausible");
        if (exist !== null) {
          document.head.removeChild(exist);
        }
        // plausible analytics
        var script = document.createElement("script");
        script.id = "custom-plausible";
        script.textContent =
          `
          plausible('pageview', { u: '` +
          "rnbw.dev/" +
          project.name +
          "/" +
          file.uid.replace("ROOT/", "") +
          `' + window.location.search });
        `;
        document.head.appendChild(script);
      }
    }
  }, [initialFileToOpen]);
  // -------------------------------------------------------------- node actions handlers --------------------------------------------------------------

  const openFileUid = useRef<TNodeUid>("");

  const {
    cb_startRenamingNode,
    cb_abortRenamingNode,
    cb_renameNode,
    cb_moveNode,
    cb_readNode,
  } = useNodeActionsHandler(openFileUid);

  useEffect(() => {
    if (
      ffTree[openFileUid.current] !== undefined &&
      currentFileUid === openFileUid.current
    ) {
      openFile(openFileUid.current);
    }
  }, [ffTree, currentFileUid]);

  // handlle links-open
  const openFile = useCallback(
    (uid: TNodeUid) => {
      if (file.uid === uid) return;
      dispatch({ type: HmsClearActionType });
      // focus/select/read the file
      addRunningActions([
        "fileTreeView-focus",
        "fileTreeView-select",
        "fileTreeView-read",
      ]);
      cb_focusNode(uid);
      cb_selectNode([uid]);
      cb_readNode(uid);
    },
    [ffTree, addRunningActions, cb_focusNode, cb_selectNode, cb_readNode],
  );
  useEffect(() => {
    if (linkToOpen === "") return;

    const node = ffTree[file.uid];
    if (node === undefined) return;
    const parentNode = ffTree[node.parentUid as TNodeUid];
    if (parentNode === undefined) return;

    const { isAbsolutePath, normalizedPath } = getNormalizedPath(linkToOpen);
    if (isAbsolutePath) {
      window.open(normalizedPath, "_blank")?.focus();
    } else {
      const fileUidToOpen = _path.join(parentNode.uid, normalizedPath);
      openFile(fileUidToOpen);
    }
  }, [linkToOpen]);
  // -------------------------------------------------------------- cmdk --------------------------------------------------------------
  const { onDelete, onCut, onCopy, onPaste, onDuplicate, onAddNode } =
    useCmdk(openFileUid);

  useEffect(() => {
    if (isAddFileAction(currentCommand.action)) {
      onAddNode(currentCommand.action);
      return;
    }

    if (activePanel !== "file") return;

    switch (currentCommand.action) {
      case "Cut":
        onCut();
        break;
      case "Copy":
        onCopy();
        break;
      case "Paste":
        onPaste();
        break;
      case "Delete":
        onDelete();
        break;
      case "Duplicate":
        onDuplicate();
        break;
      default:
        break;
    }
  }, [currentCommand]);

  const isAddFileAction = (actionName: string): boolean => {
    return actionName.startsWith(AddFileActionPrefix) ? true : false;
  };

  // -------------------------------------------------------------- own --------------------------------------------------------------
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel("file");
  }, []);

  return useMemo(() => {
    return file.uid === "" || navigatorDropDownType === "project" ? (
      <>
        <div
          id="FileTreeView"
          style={{
            position: "relative",
            top: 0,
            left: 0,
            width: "100%",
            height: "auto",
            overflow: "auto",

            ...(navigatorDropDownType ? { zIndex: 2 } : {}),
          }}
          className={
            navigatorDropDownType ? "border-bottom background-primary" : ""
          }
          onClick={onPanelClick}
        >
          <TreeView
            width={"100%"}
            height={"auto"}
            info={{ id: "file-tree-view" }}
            data={fileTreeViewData}
            focusedItem={focusedItem}
            expandedItems={expandedItems}
            selectedItems={selectedItems}
            renderers={{
              renderTreeContainer: (props) => <Container {...props} />,
              renderItemsContainer: (props) => <Container {...props} />,

              renderItem: (props) => {
                useEffect(() => {
                  const node = props.item.data as TNode;
                  if (!node.data.valid) {
                    props.context.selectItem();
                    props.context.startRenamingItem();
                  }
                }, []);

                const fileReferenceData = useMemo<TFilesReference>(() => {
                  const node = props.item.data as TNode;
                  const nodeData = node.data as TFileNodeData;
                  const refData =
                    filesReferenceData[
                      nodeData.kind === "directory"
                        ? "folder"
                        : nodeData.ext
                        ? nodeData.ext.slice(1)
                        : nodeData.type
                    ];
                  return refData;
                }, []);

                const onClick = useCallback(
                  (e: React.MouseEvent) => {
                    e.stopPropagation();
                    openFileUid.current = props.item.data.uid;
                    // skip click-event from an inline rename input
                    const targetId = e.target && (e.target as HTMLElement).id;
                    if (targetId === "FileTreeView-RenameInput") {
                      return;
                    }

                    addRunningActions(["fileTreeView-select"]);
                    !props.context.isFocused &&
                      addRunningActions(["fileTreeView-focus"]);
                    !e.shiftKey &&
                      !e.ctrlKey &&
                      addRunningActions(
                        props.item.isFolder
                          ? [
                              props.context.isExpanded
                                ? "fileTreeView-collapse"
                                : "fileTreeView-expand",
                            ]
                          : ["fileTreeView-read"],
                      );

                    if (!props.context.isFocused) {
                      props.context.focusItem();
                      focusedItemRef.current = props.item.index as TNodeUid;
                    }
                    e.shiftKey
                      ? props.context.selectUpTo()
                      : e.ctrlKey
                      ? props.context.isSelected
                        ? props.context.unselectItem()
                        : props.context.addToSelectedItems()
                      : [
                          props.context.selectItem(),
                          props.item.isFolder
                            ? props.context.toggleExpandedState()
                            : props.context.primaryAction(),
                        ];

                    setActivePanel("file");
                  },
                  [props.item, props.context],
                );

                const onDragStart = (e: React.DragEvent) => {
                  const target = e.target as HTMLElement;
                  e.dataTransfer.setDragImage(
                    target,
                    window.outerWidth,
                    window.outerHeight,
                  );
                  props.context.startDragging();
                };

                const onDragEnter = () => {
                  if (!props.context.isExpanded) {
                    setTimeout(
                      () => cb_expandNode(props.item.index as TNodeUid),
                      AutoExpandDelay,
                    );
                  }
                };

                const onMouseEnter = () =>
                  setFFHoveredItem(props.item.index as TNodeUid);

                const onMouseLeave = () => setFFHoveredItem("" as TNodeUid);

                return (
                  <>
                    <li
                      className={cx(
                        props.context.isSelected && "background-secondary",

                        props.context.isDraggingOver && "",
                        props.context.isDraggingOverParent && "",

                        props.context.isFocused && "",
                      )}
                      {...props.context.itemContainerWithChildrenProps}
                    >
                      <div
                        id={`FileTreeView-${generateQuerySelector(
                          props.item.index.toString(),
                        )}`}
                        className={cx(
                          "justify-stretch",
                          "padding-xs",
                          "outline-default",
                          "gap-s",

                          props.context.isSelected &&
                            "background-tertiary outline-none",
                          !props.context.isSelected &&
                            props.context.isFocused &&
                            "outline",

                          props.context.isDraggingOver && "outline",
                          props.context.isDraggingOverParent && "",

                          invalidNodes[props.item.data.uid] && "opacity-m",
                        )}
                        style={{
                          flexWrap: "nowrap",
                          paddingLeft: `${props.depth * 18}px`,
                        }}
                        {...props.context.itemContainerWithoutChildrenProps}
                        {...props.context.interactiveElementProps}
                        onClick={onClick}
                        onFocus={() => {}}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        onDragStart={onDragStart}
                        onDragEnter={onDragEnter}
                      >
                        <div
                          className="gap-s padding-xs"
                          style={{
                            width: "fit-content",
                            paddingRight: `0px`,
                          }}
                        >
                          {props.arrow}

                          {fileReferenceData ? (
                            <SVGIconI {...{ class: "icon-xs" }}>
                              {props.item.data?.data.kind === "file" &&
                              props.item.data?.data.name === "index" &&
                              props.item.data?.data.type === "html" &&
                              props.item.data?.parentUid === "ROOT"
                                ? "home"
                                : fileReferenceData &&
                                  fileReferenceData["Icon"] &&
                                  fileReferenceData["Icon"] !== "md"
                                ? fileReferenceData["Icon"]
                                : "page"}
                            </SVGIconI>
                          ) : (
                            <div className="icon-xs">
                              <SVGIconI {...{ class: "icon-xs" }}>
                                {props.item.data?.data.kind === "file"
                                  ? "page"
                                  : "folder"}
                              </SVGIconI>
                            </div>
                          )}
                        </div>

                        {props.title}
                      </div>

                      {props.context.isExpanded ? (
                        <>
                          <div>{props.children}</div>
                        </>
                      ) : null}
                    </li>
                  </>
                );
              },
              renderItemArrow: (props) => <ItemArrow {...props} />,
              renderItemTitle: (props) => {
                return (
                  <>
                    <span
                      className="text-s justify-start gap-s align-center"
                      style={{
                        width: "100%",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {props.title + props.item?.data?.data?.ext}
                      {ffTree[props.item.data.uid] &&
                        (ffTree[props.item.data.uid].data as TFileNodeData)
                          .changed && (
                          <div
                            className="radius-s foreground-primary"
                            title="unsaved file"
                            style={{ width: "6px", height: "6px" }}
                          ></div>
                        )}
                    </span>
                  </>
                );
              },
              renderRenameInput: (props) => {
                const onChange = useCallback(
                  (e: React.ChangeEvent<HTMLInputElement>) => {
                    props.inputProps.onChange && props.inputProps.onChange(e);
                  },
                  [props.inputProps],
                );

                const onBlur = useCallback(
                  (e: React.FocusEvent<HTMLInputElement, Element>) => {
                    props.inputProps.onBlur && props.inputProps.onBlur(e);
                    props.formProps.onSubmit &&
                      props.formProps.onSubmit(
                        new Event(
                          "",
                        ) as unknown as React.FormEvent<HTMLFormElement>,
                      );
                  },
                  [props.inputProps, props.formProps],
                );

                return (
                  <>
                    <form {...props.formProps} className={"box"}>
                      <input
                        id={"FileTreeView-RenameInput"}
                        {...props.inputProps}
                        ref={props.inputRef}
                        className={cx("text-s")}
                        style={{
                          outline: "none",
                          margin: "0",
                          border: "none",
                          padding: "0",
                          background: "transparent",
                        }}
                        onChange={onChange}
                        onBlur={onBlur}
                      />
                      <button
                        ref={props.submitButtonRef}
                        className={"hidden"}
                      ></button>
                    </form>
                  </>
                );
              },
            }}
            props={{
              canDragAndDrop: true,
              canDropOnFolder: true,
              canDropOnNonFolder: false,
              canReorderItems: false,

              canSearch: false,
              canSearchByStartingTyping: false,
              canRename: true,
            }}
            callbacks={{
              onStartRenamingItem: (item) => {
                cb_startRenamingNode(item.index as TNodeUid);
              },
              onAbortRenamingItem: (item) => {
                cb_abortRenamingNode(item);
              },
              onRenameItem: (item, name) => {
                cb_renameNode(item, name);
              },

              onSelectItems: (items) => {
                cb_selectNode(items as TNodeUid[]);
              },
              onFocusItem: (item) => {
                cb_focusNode(item.index as TNodeUid);
              },
              onExpandItem: (item) => {
                cb_expandNode(item.index as TNodeUid);
              },
              onCollapseItem: (item) => {
                cb_collapseNode(item.index as TNodeUid);
              },

              onPrimaryAction: (item) => {
                item.data.data.valid
                  ? cb_readNode(item.index as TNodeUid)
                  : removeRunningActions(["fileTreeView-read"], false);
              },

              onDrop: (items, target) => {
                const targetUid = (target as DraggingPositionItem)
                  .targetItem as TNodeUid;
                if (invalidNodes[targetUid]) return;
                const uids = items
                  .map((item) => item.index as TNodeUid)
                  .filter((uid) => !invalidNodes[uid]);
                if (uids.length === 0) return;

                cb_moveNode(uids, targetUid);
              },
            }}
          />
        </div>
      </>
    ) : (
      <></>
    );
  }, [
    onPanelClick,
    showActionsPanel,
    navigatorDropDownType,
    ffTree,
    fileTreeViewData,
    file,
    focusedItem,
    selectedItems,
    expandedItems,
    addRunningActions,
    removeRunningActions,
    cb_startRenamingNode,
    cb_abortRenamingNode,
    cb_renameNode,
    cb_selectNode,
    cb_focusNode,
    cb_expandNode,
    cb_collapseNode,
    cb_readNode,
    cb_moveNode,
    parseFileFlag,
    setParseFile,
    prevFileUid,
    SVGIconI,
  ]);
}
