import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import cx from "classnames";
import { debounce } from "lodash";
import { DraggingPositionItem } from "react-complex-tree";
import { useDispatch } from "react-redux";

import { SVGIconI, TreeView } from "@_components/common";
import { _path, getNormalizedPath, TFileNodeData } from "@_node/file";
import { TNode, TNodeUid } from "@_node/types";
import { MainContext } from "@_redux/main";
import { setHoveredFileUid } from "@_redux/main/fileTree";
import { FileTree_Event_ClearActionType } from "@_redux/main/fileTree/event";
import { setActivePanel, setDidRedo, setDidUndo } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import { generateQuerySelector } from "@_services/main";
import { TFilesReference } from "@_types/main";

import {
  useCmdk,
  useFileOperations,
  useInvalidNodes,
  useNodeActionsHandler,
  useNodeViewState,
  useSync,
  useTemporaryNodes,
} from "./hooks";
import { Container, ItemArrow } from "./workSpaceTreeComponents";

const AutoExpandDelayOnDnD = 1 * 1000;
export default function WorkspaceTreeView() {
  const dispatch = useDispatch();
  const {
    osType,
    theme,

    workspace,
    project,
    initialFileUidToOpen,
    currentFileUid,
    fileTree,

    fFocusedItem: focusedItem,
    fExpandedItems: expandedItems,
    fExpandedItemsObj: expandedItemsObj,
    fSelectedItems: selectedItems,
    fSelectedItemsObj: selectedItemsObj,
    hoveredFileUid,

    lastFileAction,

    fileAction,
    linkToOpen,

    navigatorDropdownType,

    activePanel,

    didUndo,
    didRedo,
    currentCommand,
  } = useAppState();
  const { addRunningActions, removeRunningActions, filesReferenceData } =
    useContext(MainContext);

  // invalid - can't do any actions on the nodes
  const { invalidNodes, addInvalidNodes, removeInvalidNodes } =
    useInvalidNodes();
  // temporary - don't display the nodes
  const { temporaryNodes, addTemporaryNodes, removeTemporaryNodes } =
    useTemporaryNodes();
  const { focusedItemRef, fileTreeViewData } = useSync();

  const { cb_collapseNode, cb_expandNode, cb_focusNode, cb_selectNode } =
    useNodeViewState({ invalidNodes });
  const { _create, _delete, _copy, _cut, _rename } = useFileOperations({
    invalidNodes,
    addInvalidNodes,
    removeInvalidNodes,
    temporaryNodes,
    addTemporaryNodes,
    removeTemporaryNodes,
  });
  const openFileUid = useRef<TNodeUid>("");
  const {
    cb_startRenamingNode,
    cb_abortRenamingNode,
    cb_renameNode,
    cb_moveNode,
    cb_readNode,
  } = useNodeActionsHandler({
    invalidNodes,
    addInvalidNodes,
    removeInvalidNodes,
    temporaryNodes,
    addTemporaryNodes,
    removeTemporaryNodes,
    openFileUid,
  });
  useCmdk({
    invalidNodes,
    addInvalidNodes,
    removeInvalidNodes,
    temporaryNodes,
    addTemporaryNodes,
    removeTemporaryNodes,
    openFileUid,
  });

  useEffect(() => {
    if (!didUndo && !didRedo) return;

    // isHms === true ? undo : redo
    if (didUndo) {
      const { type, param1, param2 } = fileAction;
      if (type === "create") {
        _delete([param1]);
      } else if (type === "rename") {
        const { parentUid } = param1;
        const { orgName, newName } = param2;
        const currentUid = `${parentUid}/${newName}`;
        (async () => {
          addTemporaryNodes(currentUid);
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
      } else if (type === "remove") {
      }
    } else {
      const { type, param1, param2 } = lastFileAction;
      if (type === "create") {
        _create(param2);
      } else if (type === "rename") {
        const { uid } = param1;
        const { newName } = param2;
        (async () => {
          addTemporaryNodes(uid);
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
      } else if (type === "remove") {
      }
    }

    dispatch(setDidUndo(false));
    dispatch(setDidRedo(false));
  }, [didUndo, didRedo]);

  // open default initial html file
  useEffect(() => {
    if (initialFileUidToOpen !== "" && fileTree[initialFileUidToOpen]) {
      addRunningActions([
        "fileTreeView-focus",
        "fileTreeView-select",
        "fileTreeView-read",
      ]);

      cb_focusNode(initialFileUidToOpen);
      cb_selectNode([initialFileUidToOpen]);
      cb_readNode(initialFileUidToOpen);
    }
  }, [initialFileUidToOpen]);

  useEffect(() => {
    if (
      fileTree[openFileUid.current] &&
      currentFileUid === openFileUid.current
    ) {
      openFile(openFileUid.current);
    }
  }, [fileTree, currentFileUid]);

  // handlle links-open
  const openFile = useCallback(
    (uid: TNodeUid) => {
      if (currentFileUid === uid) return;
      dispatch({ type: FileTree_Event_ClearActionType });
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
    [fileTree, addRunningActions, cb_focusNode, cb_selectNode, cb_readNode],
  );
  useEffect(() => {
    if (!linkToOpen || linkToOpen === "") return;

    const node = fileTree[currentFileUid];
    if (node === undefined) return;
    const parentNode = fileTree[node.parentUid as TNodeUid];
    if (parentNode === undefined) return;

    const { isAbsolutePath, normalizedPath } = getNormalizedPath(linkToOpen);
    if (isAbsolutePath) {
      window.open(normalizedPath, "_blank")?.focus();
    } else {
      const fileUidToOpen = _path.join(parentNode.uid, normalizedPath);
      openFile(fileUidToOpen);
    }
  }, [linkToOpen]);

  const onPanelClick = useCallback(() => {
    dispatch(setActivePanel("file"));
  }, []);

  return currentFileUid === "" || navigatorDropdownType === "project" ? (
    <>
      <div
        id="FileTreeView"
        style={{
          position: "relative",
          top: 0,
          left: 0,
          width: "100%",
          maxHeight: "calc(50vh - 50px)",
          height: "auto",
          overflow: "auto",

          ...(navigatorDropdownType ? { zIndex: 2 } : {}),
        }}
        className={
          navigatorDropdownType ? "border-bottom background-primary" : ""
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
                      : nodeData.ext
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

                  dispatch(setActivePanel("file"));
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

              const debouncedExpand = useCallback(
                debounce(cb_expandNode, AutoExpandDelayOnDnD),
                [cb_expandNode],
              );
              const onDragEnter = (e: React.DragEvent) => {
                if (!props.context.isExpanded) {
                  debouncedExpand(props.item.index as TNodeUid);
                }
              };

              const onMouseEnter = () =>
                dispatch(setHoveredFileUid(props.item.index as TNodeUid));

              const onMouseLeave = () => dispatch(setHoveredFileUid(""));

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
              const fileOrDirectoryTitle = props?.title;
              const fileExt = !!props.item?.data?.data?.ext
                ? `.${props.item?.data?.data?.ext}`
                : "";
              const fileOrDirTitle = fileOrDirectoryTitle + fileExt;

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
                    {fileOrDirTitle}
                    {fileTree[props.item.data.uid] &&
                      (fileTree[props.item.data.uid].data as TFileNodeData)
                        .changed && (
                        <div
                          className="radius-s foreground-primary"
                          title="unsaved file"
                          style={{ width: "6px", height: "6px" }}
                        />
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
                : removeRunningActions(["fileTreeView-read"]);
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
}
