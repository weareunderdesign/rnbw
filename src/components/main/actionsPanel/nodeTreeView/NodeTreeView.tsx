import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import cx from "classnames";
import { useDispatch, useSelector } from "react-redux";

import { SVGIconI, TreeView } from "@_components/common";
import { TreeViewData } from "@_components/common/treeView/types";
import { RootNodeUid } from "@_constants/main";
import {
  StageNodeIdAttr,
  TFileNodeData,
  THtmlElementsReference,
  THtmlNodeData,
} from "@_node/index";
import { TNode, TNodeUid } from "@_node/types";
import { osTypeSelector, themeSelector } from "@_redux/global";
import { MainContext } from "@_redux/main";
import {
  currentFileUidSelector,
  expandFileTreeNodes,
  fileTreeSelector,
  fileTreeViewStateSelector,
  setInitialFileUidToOpen,
} from "@_redux/main/fileTree";
import {
  hoveredNodeUidSelector,
  nodeTreeViewStateSelector,
  setHoveredNodeUid,
  validNodeTreeSelector,
} from "@_redux/main/nodeTree";
import {
  navigatorDropdownTypeSelector,
  setActivePanel,
  setNavigatorDropdownType,
} from "@_redux/main/processor";
import { getCommandKey } from "@_services/global";
import { addClass, removeClass } from "@_services/main";

import { useCmdk } from "./hooks/useCmdk";
import { useNodeActions } from "./hooks/useNodeActions";
import { useNodeTreeCallback } from "./hooks/useNodeTreeCallback";
import { useNodeViewState } from "./hooks/useNodeViewState";
import { Container } from "./nodeTreeComponents/Container";
import { DragBetweenLine } from "./nodeTreeComponents/DragBetweenLine";
import { ItemArrow } from "./nodeTreeComponents/ItemArrow";
import { ItemTitle } from "./nodeTreeComponents/ItemTitle";
import { NodeTreeViewProps } from "./types";

const AutoExpandDelay = 1 * 1000;

export const NodeTreeView = (props: NodeTreeViewProps) => {
  const dispatch = useDispatch();

  const osType = useSelector(osTypeSelector);
  const theme = useSelector(themeSelector);

  const navigatorDropdownType = useSelector(navigatorDropdownTypeSelector);

  const fileTree = useSelector(fileTreeSelector);
  const currentFileUid = useSelector(currentFileUidSelector);

  const { focusedItem, expandedItems, selectedItems } = useSelector(
    nodeTreeViewStateSelector,
  );

  const { expandedItemsObj } = useSelector(fileTreeViewStateSelector);
  const hoveredNodeUid = useSelector(hoveredNodeUidSelector);

  const validNodeTree = useSelector(validNodeTreeSelector);

  const {
    addRunningActions,
    removeRunningActions,

    htmlReferenceData,
    // toasts
    parseFileFlag,
    setParseFile,
  } = useContext(MainContext);
  // -------------------------------------------------------------- sync --------------------------------------------------------------
  // outline the hovered item
  const hoveredItemRef = useRef<TNodeUid>(hoveredNodeUid);

  useEffect(() => {
    if (hoveredItemRef.current === hoveredNodeUid) return;

    const curHoveredElement = document.querySelector(
      `#NodeTreeView-${hoveredItemRef.current}`,
    );
    curHoveredElement?.setAttribute(
      "class",
      removeClass(curHoveredElement.getAttribute("class") || "", "outline"),
    );
    const newHoveredElement = document.querySelector(
      `#NodeTreeView-${hoveredNodeUid}`,
    );
    newHoveredElement?.setAttribute(
      "class",
      addClass(newHoveredElement.getAttribute("class") || "", "outline"),
    );

    hoveredItemRef.current = hoveredNodeUid;
  }, [hoveredNodeUid]);

  // scroll to the focused item
  const focusedItemRef = useRef<TNodeUid>(focusedItem);

  useEffect(() => {
    if (focusedItemRef.current === focusedItem) return;

    const focusedElement = document.querySelector(
      `#NodeTreeView-${focusedItem}`,
    );
    setTimeout(
      () =>
        focusedElement?.scrollIntoView({
          block: "nearest",
          inline: "start",
          behavior: "auto",
        }),
      50,
    );

    const newFocusedElement = document
      .getElementsByTagName("iframe")[0]
      ?.contentWindow?.document?.querySelector(
        `[${StageNodeIdAttr}="${focusedItem}"]`,
      );
    setTimeout(
      () =>
        newFocusedElement?.scrollIntoView({
          block: "nearest",
          inline: "start",
          behavior: "smooth",
        }),
      100,
    );

    focusedItemRef.current = focusedItem;
  }, [focusedItem]);

  // build nodeTreeViewData
  const nodeTreeViewData = useMemo(() => {
    const data: TreeViewData = {};
    for (const uid in validNodeTree) {
      const node = validNodeTree[uid];
      data[uid] = {
        index: node.uid,
        data: node,
        children: node.children,
        isFolder: !node.isEntity,
        canMove: uid !== RootNodeUid,
        canRename: uid !== RootNodeUid,
      };
    }
    return data;
  }, [validNodeTree]);

  // node view state handlers
  const { cb_expandNode } = useNodeViewState(focusedItemRef.current);

  // cmdk
  useCmdk();

  // -------------------------------------------------------------- own --------------------------------------------------------------
  const onPanelClick = useCallback(() => {
    dispatch(setActivePanel("node"));

    navigatorDropdownType !== null && dispatch(setNavigatorDropdownType(null));
  }, [navigatorDropdownType]);

  // ------------------------------------------------------------- open wc -------------------------------------------------------------
  const openWebComponent = useCallback(
    (item: TNodeUid) => {
      // check the element is wc
      const nodeData = validNodeTree[item].data as THtmlNodeData;
      let exist = false;
      if (
        nodeData &&
        htmlReferenceData.elements[nodeData.name] === undefined &&
        nodeData.type === "tag"
      ) {
        const wcName = nodeData.name;
        for (let x in fileTree) {
          const defineRegex = /customElements\.define\(\s*['"]([\w-]+)['"]/;
          if (
            (fileTree[x].data as TFileNodeData).content &&
            (fileTree[x].data as TFileNodeData).ext === ".js"
          ) {
            const match = (fileTree[x].data as TFileNodeData).content.match(
              defineRegex,
            );
            if (match) {
              // check web component
              if (wcName === match[1].toLowerCase()) {
                const fileName = (fileTree[x].data as TFileNodeData).name;
                let src = "";
                for (let i in validNodeTree) {
                  if (
                    (validNodeTree[i].data as THtmlNodeData).type ===
                      "script" &&
                    (validNodeTree[i].data as THtmlNodeData).html.search(
                      fileName + ".js",
                    ) !== -1
                  ) {
                    src = (validNodeTree[i].data as THtmlNodeData).attribs.src;
                    break;
                  }
                }
                if (src !== "") {
                  if (src.startsWith("http") || src.startsWith("//")) {
                    alert("rnbw couldn't find it's source file");
                    break;
                  } else {
                    dispatch(setInitialFileUidToOpen(fileTree[x].uid));
                    dispatch(setNavigatorDropdownType("project"));
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
                    break;
                  }
                }
              }
            }
          }
        }

        if (!exist) {
          alert("rnbw couldn't find it's source file");
        }
      }
    },
    [htmlReferenceData, validNodeTree, fileTree],
  );

  const isDragging = useRef<boolean>(false);

  const callbacks = useNodeTreeCallback(
    focusedItemRef.current,
    isDragging.current,
  );

  const dragAndDropConfig = {
    canDragAndDrop: true,
    canDropOnFolder: true,
    canDropOnNonFolder: true,
    canReorderItems: true,
  };

  const searchConfig = {
    canSearch: false,
    canSearchByStartingTyping: false,
    canRename: false,
  };

  return currentFileUid !== "" ? (
    <div
      id="NodeTreeView"
      style={{
        // position: 'absolute',
        top: 41,
        left: 0,
        width: "100%",
        height: "calc(100% - 41px)",
        overflow: "auto",
      }}
      onClick={onPanelClick}
    >
      <TreeView
        width={"100%"}
        height={"auto"}
        info={{ id: "node-tree-view" }}
        data={nodeTreeViewData}
        focusedItem={focusedItem}
        selectedItems={selectedItems}
        expandedItems={expandedItems}
        renderers={{
          renderTreeContainer: (props) => <Container {...props} />,
          renderItemsContainer: (props) => <Container {...props} />,

          renderItem: (props) => {
            const htmlElementReferenceData =
              useMemo<THtmlElementsReference>(() => {
                const node = props.item.data as TNode;
                const refData =
                  htmlReferenceData.elements[
                    node.displayName === "#documentType"
                      ? "!DOCTYPE"
                      : node.displayName
                  ];

                return refData;
              }, []);

            const spanStyles: React.CSSProperties = {
              width: "calc(100% - 32px)",
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            };

            const treeViewRef = useRef<HTMLHeadingElement | any>(null);
            useEffect(() => {
              if (props.context.isSelected) {
                setTimeout(() => {
                  treeViewRef?.current?.click();
                }, 500);
              }
            }, []);

            const onClick = useCallback(
              (e: React.MouseEvent) => {
                e.stopPropagation();

                !props.context.isFocused &&
                  addRunningActions(["nodeTreeView-focus"]);
                addRunningActions(["nodeTreeView-select"]);

                !props.context.isFocused && props.context.focusItem();

                e.shiftKey
                  ? props.context.selectUpTo()
                  : getCommandKey(e, osType)
                  ? props.context.isSelected
                    ? props.context.unselectItem()
                    : props.context.addToSelectedItems()
                  : props.context.selectItem();

                setActivePanel("node");

                navigatorDropdownType !== null &&
                  dispatch(setNavigatorDropdownType(null));
              },
              [props.context, navigatorDropdownType],
            );

            const onDoubleClick = useCallback(
              (e: React.MouseEvent) => {
                e.stopPropagation();
                openWebComponent(props.item.index as TNodeUid);
              },
              [props.item],
            );

            const onMouseEnter = useCallback((e: React.MouseEvent) => {
              const ele = e.target as HTMLElement;
              let _uid: TNodeUid | null = ele.getAttribute("id");
              // for the elements which are created by js. (ex: Web Component)
              let newHoveredElement: HTMLElement = ele;
              if (_uid === null || _uid === undefined) return;
              _uid = _uid?.substring(13, _uid.length);
              while (!_uid) {
                const parentEle = newHoveredElement.parentElement;
                if (!parentEle) break;

                _uid = parentEle.getAttribute(StageNodeIdAttr);
                !_uid ? (newHoveredElement = parentEle) : null;
              }

              // set hovered item
              if (_uid && _uid !== hoveredNodeUid) {
                dispatch(setHoveredNodeUid(_uid));
              }
            }, []);

            const onMouseLeave = useCallback(() => {
              dispatch(setHoveredNodeUid(""));
            }, []);

            const onDragStart = (e: React.DragEvent) => {
              const img = new Image();
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setDragImage(
                img,
                window.outerWidth,
                window.outerHeight,
              );
              props.context.startDragging();

              isDragging.current = true;
            };
            const onDragEnter = (e: React.DragEvent) => {
              if (!props.context.isExpanded) {
                setTimeout(
                  () => cb_expandNode(props.item.index as TNodeUid),
                  AutoExpandDelay,
                );
              }
              // e.dataTransfer.effectAllowed = 'move'
            };

            return (
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
                  id={`NodeTreeView-${props.item.index}`}
                  className={cx(
                    "justify-stretch",
                    "padding-xs",
                    "outline-default",

                    props.context.isSelected &&
                      "background-tertiary outline-none",
                    !props.context.isSelected &&
                      props.context.isFocused &&
                      "outline",

                    props.context.isDraggingOver && "outline",
                    props.context.isDraggingOverParent && "",
                  )}
                  style={{
                    flexWrap: "nowrap",
                    paddingLeft: `${props.depth * 18}px`,
                  }}
                  {...props.context.itemContainerWithoutChildrenProps}
                  {...props.context.interactiveElementProps}
                  ref={treeViewRef}
                  onClick={onClick}
                  onDoubleClick={onDoubleClick}
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                  onFocus={() => {}}
                  onDragStart={onDragStart}
                  onDragEnter={onDragEnter}
                >
                  <div className="gap-s padding-xs" style={{ width: "100%" }}>
                    {props.arrow}

                    {htmlElementReferenceData ? (
                      <SVGIconI {...{ class: "icon-xs" }}>
                        {htmlElementReferenceData["Icon"]}
                      </SVGIconI>
                    ) : props.item.data.name === "!--...--" ||
                      props.item.data.name === "comment" ? (
                      <div className="icon-xs">
                        <SVGIconI {...{ class: "icon-xs" }}>bubble</SVGIconI>
                      </div>
                    ) : (
                      <div className="icon-xs">
                        <SVGIconI {...{ class: "icon-xs" }}>component</SVGIconI>
                      </div>
                    )}

                    {htmlElementReferenceData ? (
                      <span
                        className="text-s justify-stretch"
                        style={spanStyles}
                      >
                        {htmlElementReferenceData["Name"]}
                      </span>
                    ) : props.item.data.name === "!--...--" ||
                      props.item.data.name === "comment" ? (
                      <span
                        className="text-s justify-stretch"
                        style={spanStyles}
                      >
                        comment
                      </span>
                    ) : (
                      props.title
                    )}
                  </div>
                </div>

                {props.context.isExpanded ? <div>{props.children}</div> : null}
              </li>
            );
          },

          renderItemArrow: (props) => (
            <ItemArrow {...props} addRunningActions={addRunningActions} />
          ),
          renderItemTitle: (props) => <ItemTitle {...props} />,
          renderDragBetweenLine: (props) => <DragBetweenLine {...props} />,
        }}
        props={{
          ...dragAndDropConfig,
          ...searchConfig,
        }}
        callbacks={callbacks}
      />
    </div>
  ) : (
    <></>
  );
};

export default NodeTreeView;
