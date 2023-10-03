import { useCallback, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

import { HmsClearActionType, NodeInAppAttribName } from "@_constants/main";
import { getValidNodeUids } from "@_node/apis";
import { TFileNodeData } from "@_node/file";
import { TNode, TNodeUid } from "@_node/types";
import {
  MainContext,
  expandFNNode,
  fnSelector,
  focusFNNode,
  selectFFNode,
  selectFNNode,
  setCurrentFile,
} from "@_redux/main";
import { useSetSelectItem, useTextEditing } from ".";

export interface IUseMouseEventsProps {
  externalDblclick: React.MutableRefObject<boolean>;
  linkTagUid: React.MutableRefObject<string>;
  selectedItemsRef: React.MutableRefObject<string[]>;
  mostRecentSelectedNode: React.MutableRefObject<TNode | undefined>;
  focusedItemRef: React.MutableRefObject<string>;
  contentRef: HTMLIFrameElement | null;
  contentEditableUidRef: React.MutableRefObject<string>;
  isEditing: React.MutableRefObject<boolean>;
  dblClickTimestamp: React.MutableRefObject<number>;
  isDblClick: boolean;
}

export const useMouseEvents = ({
  externalDblclick,
  linkTagUid,
  selectedItemsRef,
  mostRecentSelectedNode,
  focusedItemRef,
  contentRef,
  contentEditableUidRef,
  isEditing,
  dblClickTimestamp, // isDblClick,
}: IUseMouseEventsProps) => {
  const firstClickEditableTags = [
    "p",
    "span",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "label",
    "a",
  ];

  const { onDblClick } = useTextEditing({
    contentEditableUidRef,
    contentRef,
    isEditing,
    mostRecentSelectedNode,
    focusedItemRef,
    dblClickTimestamp,
    externalDblclick,
  });

  const dispatch = useDispatch();
  const { focusedItem } = useSelector(fnSelector);
  const {
    // node actions
    setActivePanel,
    navigatorDropDownType,
    setNavigatorDropDownType,
    // file tree view
    ffTree,
    setCurrentFileUid,
    // node tree view
    fnHoveredItem,
    setFNHoveredItem,
    nodeTree,
    // stage view
    setLinkToOpen,
    // other
    osType,
    // toasts
    parseFileFlag,
    setParseFile,
    prevFileUid,
  } = useContext(MainContext);

  const { setFocusedSelectedItems } = useSetSelectItem({
    mostRecentSelectedNode,
    focusedItemRef,
    contentRef,
  });

  // MouseEvents Helpers
  function isOrContainLinkElement(ele: HTMLElement): {
    isLinkTag: boolean;
    linkElement: HTMLElement;
  } {
    let isLinkTag = false;
    let linkElement = ele;
    while (true) {
      if (linkElement.tagName === "A") {
        isLinkTag = true;
        break;
      }
      const parentEle = linkElement.parentElement;
      if (!parentEle) break;

      linkElement = parentEle;
    }
    return {
      isLinkTag,
      linkElement,
    };
  }

  function handleLinkTag(ele: HTMLElement) {
    const { isLinkTag, linkElement } = isOrContainLinkElement(ele);
    if (isLinkTag && linkElement) {
      const uid: TNodeUid | null =
        linkElement.getAttribute(NodeInAppAttribName);
      if (uid !== null) {
        if (uid === linkTagUid.current) {
          const href = linkElement.getAttribute("href");
          href && setLinkToOpen(href);
          linkTagUid.current = "";
        } else {
          linkTagUid.current = uid;
        }
      }
    } else {
      linkTagUid.current = "";
    }
  }

  function findEleOrItsNearestParentWithUid(ele: HTMLElement) {
    let newFocusedElement: HTMLElement = ele;
    let _uid: TNodeUid | null =
      newFocusedElement.getAttribute(NodeInAppAttribName);
    while (!_uid) {
      const parentEle = newFocusedElement.parentElement;
      if (!parentEle) break;
      _uid = parentEle.getAttribute(NodeInAppAttribName);
      !_uid ? (newFocusedElement = parentEle) : null;
    }
    return newFocusedElement;
  }

  function handleSelectofSingleOrMultipleElements(
    e: MouseEvent,
    uid: TNodeUid | null,
  ) {
    let multiple = false;
    if (uid) {
      if (e.shiftKey) {
        let found = false;

        const _selectedItems = selectedItemsRef.current.filter((uid) => {
          uid === uid ? (found = true) : null;
          return uid !== uid;
        });

        !found ? _selectedItems.push(uid) : null;

        setFocusedSelectedItems(
          uid,
          getValidNodeUids(nodeTree, _selectedItems),
        );

        if (_selectedItems.length > 1) multiple = true;
      } else {
        if (uid !== focusedItem) {
          setFocusedSelectedItems(uid);
        }
      }
    }

    return multiple;
  }

  function isEditableElement(ele: HTMLElement) {
    return firstClickEditableTags.includes(ele.tagName.toLowerCase());
  }

  // MouseEvents Handlers
  const onMouseEnter = useCallback((e: MouseEvent) => {}, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      const ele = e.target as HTMLElement;
      let _uid: TNodeUid | null = ele.getAttribute(NodeInAppAttribName);
      // for the elements which are created by js. (ex: Web Component)
      let newHoveredElement: HTMLElement = ele;
      while (!_uid) {
        const parentEle = newHoveredElement.parentElement;
        if (!parentEle) break;

        _uid = parentEle.getAttribute(NodeInAppAttribName);
        !_uid ? (newHoveredElement = parentEle) : null;
      }

      // set hovered item
      if (_uid && _uid !== fnHoveredItem) {
        setFNHoveredItem(_uid);
      }
    },
    [fnHoveredItem],
  );

  const onMouseLeave = (e: MouseEvent) => {
    setFNHoveredItem("");
  };

  const onClick = useCallback(
    (e: MouseEvent) => {
      const ele = e.target as HTMLElement;
      if (!parseFileFlag) {
        const file = ffTree[prevFileUid];
        const uid = prevFileUid;
        const fileData = file.data as TFileNodeData;
        setNavigatorDropDownType("project");
        setParseFile(true);
        dispatch({ type: HmsClearActionType });
        dispatch(
          setCurrentFile({
            uid,
            parentUid: file.parentUid as TNodeUid,
            name: fileData.name,
            content: fileData.contentInApp ? fileData.contentInApp : "",
          }),
        );
        setCurrentFileUid(uid);
        dispatch(selectFFNode([prevFileUid]));

        // select clicked item
        let _uid: TNodeUid | null = ele.getAttribute(NodeInAppAttribName);
        // for the elements which are created by js. (ex: Web Component)
        let newFocusedElement: HTMLElement = ele;
        while (!_uid) {
          const parentEle = newFocusedElement.parentElement;
          if (!parentEle) break;

          _uid = parentEle.getAttribute(NodeInAppAttribName);
          !_uid ? (newFocusedElement = parentEle) : null;
        }
        setTimeout(() => {
          if (_uid) {
            dispatch(focusFNNode(_uid));
            dispatch(selectFNNode([_uid]));
            dispatch(expandFNNode([_uid]));
          }
        }, 100);
      } else {
        externalDblclick.current = true;
        handleLinkTag(ele);

        let _uid: TNodeUid | null = ele.getAttribute(NodeInAppAttribName);
        let isWC = false;
        let newFocusedElement: HTMLElement = ele;
        if (!_uid) {
          // for the elements which are created by js. (ex: Web Component)
          isWC = true;
          newFocusedElement = findEleOrItsNearestParentWithUid(ele);

          _uid = newFocusedElement.getAttribute(NodeInAppAttribName);
        }

        const areMultiple = handleSelectofSingleOrMultipleElements(e, _uid);

        const isEditable = isEditableElement(ele);

        const canEditOnSingleClickConfig = {
          isSingle: !areMultiple,
          isEditable,
          isFocused: _uid === focusedItem,
          isNotAWC: !isWC,
          isNotAlreadyEditingEle: contentEditableUidRef.current !== _uid,
        };

        //check if all the keys have true value
        let canEditOnSingleClick = Object.values(
          canEditOnSingleClickConfig,
        ).every((val) => val === true);

        if (canEditOnSingleClick) {
          // isEditing.current = true;
          // onDblClick(e);
          //TODO: for making a editable element editable on single click once zero-sys is ready
        }
      }

      setActivePanel("stage");
      navigatorDropDownType !== null && setNavigatorDropDownType(null);
    },
    [
      osType,
      focusedItem,
      setFocusedSelectedItems,
      nodeTree,
      parseFileFlag,
      navigatorDropDownType,
    ],
  );

  return {
    onClick,
    onMouseLeave,
    onMouseMove,
    onMouseEnter,
  };
};
