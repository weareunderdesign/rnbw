/* eslint-disable react/prop-types */
import React, { useCallback, useContext, useEffect, useMemo } from "react";

import { DraggingPositionItem } from "react-complex-tree";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import { RootNodeUid } from "@src/rnbwTSX";
import { TreeView } from "@src/components";
import {
  getNormalizedPath,
  createURLPath,
  TFileNodeData,
  confirmFileChanges,
} from "@_api/file";
import { _path } from "@_api/file/nohostApis";
import { TNode, TNodeUid } from "@_api/types";
import { MainContext } from "@_redux/main";
import {
  addInvalidFileNodes,
  removeInvalidFileNodes,
  setFileTree,
  setHoveredFileUid,
} from "@_redux/main/fileTree";
import { setActivePanel } from "@_redux/main/processor";
import { useAppState } from "@_redux/useAppState";
import { generateQuerySelector } from "../../rnbw";

import {
  useCmdk,
  useNodeActionsHandler,
  useNodeViewState,
  useSync,
  useWorkspaceInit,
} from "./hooks";
import { useSaveCommand } from "@src/processor/hooks";
import { debounce, getObjKeys } from "@src/helper";
import {
  Container,
  ItemArrow,
  ItemTitle,
  TreeItem,
} from "@src/sidebarView/treeComponents";
import { NodeIcon } from "./workspaceComponents/NodeIcon";
import { TFilesReference } from "@rnbws/rfrncs.design";
import useRnbw from "@_services/useRnbw";

const AutoExpandDelayOnDnD = 1 * 1000;
export default function WorkspaceTreeView() {
  const dispatch = useDispatch();
  const {
    initialFileUidToOpen,
    currentFileUid,
    fileTree,
    fFocusedItem: focusedItem,
    fExpandedItemsObj,
    fSelectedItemsObj,
    linkToOpen,
    autoSave,
    activePanel,
    renderableFileUid,
    filesReferenceData,
    currentProjectFileHandle,
    recentProject,
    invalidFileNodes,
    hoveredFileUid,
  } = useAppState();
  const rnbw = useRnbw();

  const { importProject } = useContext(MainContext);
  const navigate = useNavigate();
  const { project, "*": rest } = useParams();

  const { focusedItemRef, fileTreeViewData } = useSync();
  const { cb_focusNode, cb_selectNode, cb_expandNode, cb_collapseNode } =
    useNodeViewState({ invalidFileNodes });
  const { cb_readNode } = useNodeActionsHandler();
  const { onSaveCurrentFile } = useSaveCommand();

  useCmdk();
  useWorkspaceInit();

  // open default initial html file
  useEffect(() => {
    if (initialFileUidToOpen !== "" && fileTree[initialFileUidToOpen]) {
      cb_focusNode(initialFileUidToOpen);
      cb_selectNode([initialFileUidToOpen]);
      cb_readNode(initialFileUidToOpen);
    }
  }, [initialFileUidToOpen]);

  // handlle links-open
  const openFile = useCallback(
    (uid: TNodeUid) => {
      if (currentFileUid === uid) return;
      // focus/select/read the file
      cb_focusNode(uid);
      cb_selectNode([uid]);
      cb_readNode(uid);
      const newURL = createURLPath(
        uid,
        RootNodeUid,
        fileTree[RootNodeUid]?.displayName,
      );
      navigate(newURL);
    },
    [fileTree, cb_focusNode, cb_selectNode, cb_readNode, currentFileUid],
  );
  useEffect(() => {
    if (!linkToOpen || linkToOpen === "") return;

    const node = fileTree[currentFileUid];
    if (node === undefined) return;
    const parentNode = fileTree[node.parentUid!];
    if (parentNode === undefined) return;

    const { isAbsolutePath, normalizedPath } = getNormalizedPath(linkToOpen);
    if (isAbsolutePath) {
      window.open(normalizedPath, "_blank")?.focus();
    } else {
      const fileUidToOpen = _path.join(parentNode.uid, normalizedPath);
      openFile(fileUidToOpen);
    }
  }, [linkToOpen]);

  useEffect(
    function RevertWcOpen() {
      if (activePanel === "stage") {
        openFile(renderableFileUid);
      }
    },
    [activePanel],
  );

  const onPanelClick = useCallback(() => {
    activePanel !== "file" && dispatch(setActivePanel("file"));
  }, [activePanel]);

  const openFromURL = useCallback(async () => {
    if (!project) return;
    const pathName = `${RootNodeUid}/${rest}`;
    const isCurrentProject = currentProjectFileHandle?.name === project;
    const isDifferentFile = currentFileUid !== pathName;

    if (isCurrentProject && isDifferentFile) {
      openFile(pathName);
    } else if (!isCurrentProject) {
      const index = recentProject.findIndex(
        (_recentProject) => _recentProject.name === project,
      );

      if (index >= 0) {
        const projectContext = recentProject[index].context;
        const projectHandler = recentProject[index].handler;
        if (projectHandler && currentFileUid !== projectHandler.name) {
          confirmFileChanges(fileTree) &&
            importProject(projectContext, projectHandler, true);
        }
        openFile(pathName);
      }
    }
  }, [project, rest, recentProject]);

  useEffect(() => {
    openFromURL();
  }, [openFromURL]);

  useEffect(() => {
    const pathName = `${RootNodeUid}/${rest}`;
    if (pathName === currentFileUid) return;
    cb_selectNode([currentFileUid]);
    const newURL = createURLPath(
      currentFileUid,
      RootNodeUid,
      fileTree[RootNodeUid]?.displayName,
    );
    navigate(newURL);
  }, [currentFileUid]);
  return (
    <div
      id="FileTreeView"
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
      }}
      onClick={onPanelClick}
    >
      <style>
        {`
          #FileTreeView ul > li {
            line-height: 100%;
            padding: 0px;
            overflow: hidden;
          }
        `}
      </style>

      <TreeView
        width={"100%"}
        height={"auto"}
        info={{ id: "file-tree-view" }}
        data={fileTreeViewData}
        focusedItem={focusedItem}
        expandedItems={getObjKeys(fExpandedItemsObj)}
        selectedItems={getObjKeys(fSelectedItemsObj)}
        renderers={{
          renderTreeContainer: (props) => <Container {...props} />,
          renderItemsContainer: (props) => <Container {...props} />,

          renderItem: (props) => {
            // rename the newly created file (newly added item in the file tree is invalid by default)
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
              async (e: React.MouseEvent) => {
                e.stopPropagation();
                try {
                  if (fileTree[currentFileUid]?.data?.changed && autoSave) {
                    onSaveCurrentFile();
                  }
                  // Skip click-event from an inline rename input
                  const targetId = e.target && (e.target as HTMLElement).id;
                  if (targetId === "FileTreeView-RenameInput") {
                    return;
                  }

                  if (!props.context.isFocused) {
                    props.context.focusItem();
                    focusedItemRef.current = props.item.index as TNodeUid;
                  }
                  if (e.shiftKey) {
                    props.context.selectUpTo();
                  } else if (e.ctrlKey) {
                    props.context.isSelected
                      ? props.context.unselectItem()
                      : props.context.addToSelectedItems();
                  } else {
                    props.context.selectItem();
                    if (props.item.isFolder) {
                      props.context.toggleExpandedState();
                    } else {
                      props.context.primaryAction();
                    }
                  }

                  dispatch(setActivePanel("file"));

                  openFile(props.item.index as TNodeUid);
                } catch (error) {
                  console.error(error);
                }
              },
              [props.item, props.context, fileTree, autoSave, currentFileUid],
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
            const onDragEnter = () => {
              if (!props.context.isExpanded) {
                debouncedExpand(props.item.index as TNodeUid);
              }
            };

            const onMouseEnter = useCallback(
              () =>
                hoveredFileUid !== props.item.index &&
                dispatch(setHoveredFileUid(props.item.index as TNodeUid)),
              [props.item.index, hoveredFileUid],
            );
            const onMouseLeave = useCallback(
              () => hoveredFileUid && dispatch(setHoveredFileUid("")),
              [hoveredFileUid],
            );

            return (
              <TreeItem
                {...props}
                key={`FileTreeView-${props.item.index}${props.item.data.data.nodeName}`}
                id={`FileTreeView-${generateQuerySelector(
                  props.item.index.toString(),
                )}`}
                invalidFileNodes={invalidFileNodes}
                eventHandlers={{
                  onClick: onClick,
                  onMouseEnter: onMouseEnter,
                  onMouseLeave: onMouseLeave,
                  onFocus: () => {},
                  onDragStart: onDragStart,
                  onDragEnter: onDragEnter,
                }}
                nodeIcon={
                  <>
                    <NodeIcon
                      item={props.item}
                      fileReferenceData={fileReferenceData}
                    />
                    {props.title}
                  </>
                }
                
              />
            );
          },
          renderItemArrow: ({ item, context }) => (
            <ItemArrow item={item} context={context} />
          ),
          renderItemTitle: ({ title, item }) => {
            const fileOrDirectoryTitle = title;
            const fileExt = item?.data?.data?.ext
              ? `.${item?.data?.data?.ext}`
              : "";
            const fileOrDirTitle = fileOrDirectoryTitle + fileExt;

            return (
              <ItemTitle
                title={fileOrDirTitle}
                isChanged={
                  fileTree[item.data.uid] &&
                  (fileTree[item.data.uid].data as TFileNodeData).changed
                }
              />
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
                <form
                  {...props.formProps}
                  className={"align-center justify-start"}
                >
                  <input
                    id={"FileTreeView-RenameInput"}
                    {...props.inputProps}
                    ref={props.inputRef}
                    className={`text-s`}
                    style={{
                      outline: "none",
                      margin: "0",
                      border: "none",
                      padding: "0",
                      background: "transparent",
                      height: "12px",
                    }}
                    onChange={onChange}
                    onBlur={onBlur}
                  />
                  <button ref={props.submitButtonRef} className={"hidden"} />
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
            /* if the item is invalid which a newly created item is by default
            make it valid */

            const uid = item.index as TNodeUid;
            if (invalidFileNodes[uid]) {
              dispatch(removeInvalidFileNodes([uid]));
              return;
            }
            dispatch(addInvalidFileNodes([uid]));
          },
          onAbortRenamingItem: (item) => {
            const node = item.data as TNode;
            const nodeData = node.data as TFileNodeData;

            if (!nodeData.valid) {
              // deep clone the file tree and
              const _fileTree = structuredClone(fileTree);

              // find and remove the node whose renaming was aborted
              _fileTree[node.parentUid!].children = _fileTree[
                node.parentUid!
              ].children.filter((c_uid) => c_uid !== node.uid);
              delete _fileTree[item.data.uid];

              // set the new file tree
              dispatch(setFileTree(_fileTree));
            }

            // update the invalid file nodes
            dispatch(removeInvalidFileNodes([node.uid]));
          },
          onRenameItem: (item, entityName) => {
            // cb_renameNode(item, name);
            const node = item.data as TNode;
            const nodeData = node.data as TFileNodeData;

            if (nodeData.valid) {
              //rename the file
              rnbw.files.rename({
                uid: node.uid,
                newName: entityName,
                extension: nodeData.ext,
              });
              const uid = item.index as TNodeUid;
              if (invalidFileNodes[uid]) {
                dispatch(removeInvalidFileNodes([uid]));
                return;
              }
            } else {
              // create a new file/directory
              const parentNode = fileTree[node.parentUid!];
              if (!parentNode) return;

              const isFolder = !node.isEntity;
              if (isFolder) {
                rnbw.files.createFolder({ entityName });
              } else {
                const ext = nodeData.ext;
                rnbw.files.createFile({
                  entityName,
                  extension: ext,
                });
              }
            }
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
            item.data.data.valid && openFile(item.index as TNodeUid);
          },

          onDrop: (items, target) => {
            const targetUid = (target as DraggingPositionItem)
              .targetItem as TNodeUid;
            if (invalidFileNodes[targetUid]) return;
            const uids = items
              .map((item) => item.index as TNodeUid)
              .filter(
                (uid) =>
                  !invalidFileNodes[uid] &&
                  fileTree[uid].parentUid !== targetUid,
              );
            if (uids.length === 0) return;

            rnbw.files.move({
              uids,
              targetUid,
            });
          },
        }}
      />
    </div>
  );
}
