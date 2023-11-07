import { useCallback, useContext } from "react";

import { useDispatch, useSelector } from "react-redux";

import { StageNodeIdAttr } from "@_node/html";
import { TNode, TNodeUid } from "@_node/types";
import { AppState } from "@_redux/_root";
import { MainContext } from "@_redux/main";
import {
  expandNodeTreeNodes,
  focusNodeTreeNode,
  selectNodeTreeNodes,
  updateNodeTreeTreeViewState,
} from "@_redux/main/nodeTree";
import { setNeedToReloadIframe } from "@_redux/main/stageView";

import { cloneAndInsertNode, createAndInsertElement } from "../helpers";

export interface IUseSideEffectHandlersProps {
  contentRef: any;
}

export const useSideEffectHandlers = ({
  contentRef,
}: IUseSideEffectHandlersProps) => {
  const dispatch = useDispatch();
  const {
    nodeTree: { nodeTree },
    processor: { clipboardData },
  } = useSelector((state: AppState) => state.main);
  const {
    // global action
    removeRunningActions,
  } = useContext(MainContext);

  const addElement = useCallback(
    (targetUid: TNodeUid, node: TNode, contentNode: TNode | null) => {
      createAndInsertElement(
        targetUid,
        node,
        contentNode,
        contentRef,
        dispatch,
        removeRunningActions,
        setNeedToReloadIframe,
      );
    },
    [removeRunningActions, contentRef, nodeTree],
  );

  const groupElement = useCallback(
    (
      targetUid: TNodeUid,
      node: TNode,
      contentNode: TNode | null,
      deleteUids: TNodeUid[],
    ) => {
      createAndInsertElement(
        targetUid,
        node,
        contentNode,
        contentRef,
        dispatch,
        removeRunningActions,
        setNeedToReloadIframe,
      );

      deleteUids.map((uid) => {
        const ele = contentRef?.current?.contentWindow?.document?.querySelector(
          `[${StageNodeIdAttr}="${uid}"]`,
        );
        ele?.remove();
      });

      setTimeout(() => {
        dispatch(focusNodeTreeNode(node.uid));
        dispatch(selectNodeTreeNodes([node.uid]));
        dispatch(expandNodeTreeNodes([node.uid]));
      }, 200);

      removeRunningActions(["stageView-viewState"]);
    },
    [removeRunningActions, contentRef],
  );

  const removeElements = useCallback(
    (uids: TNodeUid[], deletedUids: TNodeUid[], lastUid: TNodeUid) => {
      uids.map((uid) => {
        const ele = contentRef?.contentWindow?.document?.querySelector(
          `[${StageNodeIdAttr}="${uid}"]`,
        );
        ele?.remove();
      });
      setTimeout(() => {
        if (lastUid && lastUid !== "") {
          dispatch(focusNodeTreeNode(lastUid));
          dispatch(selectNodeTreeNodes([lastUid]));
        }
      }, 200);
      // view state
      dispatch(updateNodeTreeTreeViewState({ deletedUids }));
      removeRunningActions(["stageView-viewState"]);
    },
    [removeRunningActions, contentRef],
  );

  const moveElements = useCallback(
    (
      uids: TNodeUid[],
      targetUid: TNodeUid,
      isBetween: boolean,
      position: number,
    ) => {
      const targetElement = contentRef?.contentWindow?.document?.querySelector(
        `[${StageNodeIdAttr}="${targetUid}"]`,
      );
      const _elements: (Node | undefined)[] = [];

      // remove from org parents
      const _uids = [...uids];
      _uids.reverse();
      _uids.map((uid) => {
        // clone
        const ele = contentRef?.contentWindow?.document?.querySelector(
          `[${StageNodeIdAttr}="${uid}"]`,
        );
        _elements.push(ele?.cloneNode(true));
        ele?.remove();
      });

      // add to new target + position
      _elements.map((_ele) => {
        const refElement = isBetween
          ? contentRef?.contentWindow?.document?.querySelector(
              `[${StageNodeIdAttr}="${targetUid}"] > :nth-child(${
                position + 1
              })`,
            )
          : null;
        _ele && targetElement?.insertBefore(_ele, refElement || null);
      });

      // view state
      setTimeout(() => {
        dispatch(focusNodeTreeNode(uids[uids.length - 1]));
        dispatch(selectNodeTreeNodes(uids));
      }, 100);
      removeRunningActions(["stageView-viewState"]);
    },
    [removeRunningActions, contentRef],
  );

  const copyElements = useCallback(
    (
      uids: TNodeUid[],
      targetUid: TNodeUid,
      isBetween: boolean,
      position: number,
      addedUidMap: Map<TNodeUid, TNodeUid>,
    ) => {
      const targetElement = contentRef?.contentWindow?.document?.querySelector(
        `[${StageNodeIdAttr}="${targetUid}"]`,
      );
      const refElement = isBetween
        ? contentRef?.contentWindow?.document?.querySelector(
            `[${StageNodeIdAttr}="${targetUid}"] > :nth-child(${position + 1})`,
          )
        : null;

      uids.map((uid) => {
        // clone
        const ele = contentRef?.contentWindow?.document?.querySelector(
          `[${StageNodeIdAttr}="${uid}"]`,
        );
        const _ele = ele?.cloneNode(true) as HTMLElement;

        // reset nest's uid
        const newUid = addedUidMap.get(uid);
        newUid && _ele.setAttribute(StageNodeIdAttr, newUid);

        // reset descendant uids
        const childElementList = _ele.querySelectorAll("*");
        childElementList.forEach((childElement) => {
          const childUid = childElement.getAttribute(StageNodeIdAttr);
          if (childUid) {
            const newChildUid = addedUidMap.get(childUid);
            if (newChildUid) {
              childElement.setAttribute(StageNodeIdAttr, newChildUid);
            }
          }
        });

        // update
        targetElement?.insertBefore(_ele, refElement || null);
      });

      // view state
      const newUids = uids
        .map((uid) => addedUidMap.get(uid))
        .filter((uid) => uid) as TNodeUid[];
      setTimeout(() => {
        dispatch(focusNodeTreeNode(newUids[newUids.length - 1]));
        dispatch(selectNodeTreeNodes(newUids));
      }, 100);
      removeRunningActions(["stageView-viewState"]);
    },
    [removeRunningActions, contentRef],
  );

  const copyElementsExternal = useCallback(
    (
      nodes: TNode[],
      targetUid: TNodeUid,
      isBetween: boolean,
      position: number,
      addedUidMap: Map<TNodeUid, TNodeUid>,
    ) => {
      const targetElement = contentRef?.contentWindow?.document?.querySelector(
        `[${StageNodeIdAttr}="${targetUid}"]`,
      );
      const refElement = isBetween
        ? contentRef?.contentWindow?.document?.querySelector(
            `[${StageNodeIdAttr}="${targetUid}"] > :nth-child(${position + 1})`,
          )
        : null;

      nodes.forEach(
        (node) =>
          clipboardData &&
          cloneAndInsertNode(
            node,
            addedUidMap,
            targetElement,
            refElement,
            clipboardData,
          ),
      );

      const newUids = nodes
        .map((node) => addedUidMap.get(node.uid))
        .filter((_nd) => _nd) as TNodeUid[];

      const updateViewState = () => {
        setTimeout(() => {
          dispatch(focusNodeTreeNode(newUids[newUids.length - 1]));
          dispatch(selectNodeTreeNodes(newUids));
        }, 100);
        removeRunningActions(["stageView-viewState"]);
      };
      updateViewState();
    },
    [removeRunningActions, contentRef, clipboardData],
  );

  const duplicateElements = useCallback(
    (uids: TNodeUid[], addedUidMap: Map<TNodeUid, TNodeUid>) => {
      uids.map((uid) => {
        // clone
        const ele = contentRef?.contentWindow?.document?.querySelector(
          `[${StageNodeIdAttr}="${uid}"]`,
        );
        const _ele = ele?.cloneNode(true) as HTMLElement;

        // reset nest's uid
        const newUid = addedUidMap.get(uid);
        newUid && _ele.setAttribute(StageNodeIdAttr, newUid);

        // reset descendant uids
        const childElementList = _ele.querySelectorAll("*");
        childElementList.forEach((childElement) => {
          const childUid = childElement.getAttribute(StageNodeIdAttr);
          if (childUid) {
            const newChildUid = addedUidMap.get(childUid);
            if (newChildUid) {
              childElement.setAttribute(StageNodeIdAttr, newChildUid);
            }
          }
        });

        // update
        ele?.parentElement?.insertBefore(_ele, ele.nextElementSibling);
      });

      // view state
      const newUids = uids
        .map((uid) => addedUidMap.get(uid))
        .filter((uid) => uid) as TNodeUid[];
      setTimeout(() => {
        dispatch(focusNodeTreeNode(newUids[newUids.length - 1]));
        dispatch(selectNodeTreeNodes(newUids));
      }, 100);
      removeRunningActions(["stageView-viewState"]);
    },
    [removeRunningActions, contentRef],
  );

  return {
    addElement,
    groupElement,
    removeElements,
    moveElements,
    copyElements,
    copyElementsExternal,
    duplicateElements,
  };
};
