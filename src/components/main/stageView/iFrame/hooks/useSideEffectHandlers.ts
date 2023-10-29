import {
  useCallback,
  useContext,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { NodeUidAttribNameInApp } from '@_constants/main';
import {
  TNode,
  TNodeUid,
} from '@_node/types';
import {
  expandFNNode,
  focusFNNode,
  MainContext,
  navigatorSelector,
  selectFNNode,
  updateFNTreeViewState,
} from '@_redux/main';

import {
  cloneAndInsertNode,
  createAndInsertElement,
} from '../helpers';

export interface IUseSideEffectHandlersProps {
  contentRef: any;
}

export const useSideEffectHandlers = ({
  contentRef,
}: IUseSideEffectHandlersProps) => {
  const dispatch = useDispatch();
  const { file } = useSelector(navigatorSelector);
  const {
    // global action
    removeRunningActions,
    // node actions
    clipboardData,
    // node tree view
    nodeTree,
    setNeedToReloadIframe,
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
          `[${NodeUidAttribNameInApp}="${uid}"]`,
        );
        ele?.remove();
      });

      setTimeout(() => {
        dispatch(focusFNNode(node.uid));
        dispatch(selectFNNode([node.uid]));
        dispatch(expandFNNode([node.uid]));
      }, 200);

      removeRunningActions(["stageView-viewState"]);
    },
    [removeRunningActions, contentRef],
  );

  const removeElements = useCallback(
    (uids: TNodeUid[], deletedUids: TNodeUid[], lastUid: TNodeUid) => {
      uids.map((uid) => {
        const ele = contentRef?.contentWindow?.document?.querySelector(
          `[${NodeUidAttribNameInApp}="${uid}"]`,
        );
        ele?.remove();
      });
      setTimeout(() => {
        if (lastUid && lastUid !== "") {
          dispatch(focusFNNode(lastUid));
          dispatch(selectFNNode([lastUid]));
        }
      }, 200);
      // view state
      dispatch(updateFNTreeViewState({ deletedUids }));
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
        `[${NodeUidAttribNameInApp}="${targetUid}"]`,
      );
      const _elements: (Node | undefined)[] = [];

      // remove from org parents
      const _uids = [...uids];
      _uids.reverse();
      _uids.map((uid) => {
        // clone
        const ele = contentRef?.contentWindow?.document?.querySelector(
          `[${NodeUidAttribNameInApp}="${uid}"]`,
        );
        _elements.push(ele?.cloneNode(true));
        ele?.remove();
      });

      // add to new target + position
      _elements.map((_ele) => {
        const refElement = isBetween
          ? contentRef?.contentWindow?.document?.querySelector(
              `[${NodeUidAttribNameInApp}="${targetUid}"] > :nth-child(${
                position + 1
              })`,
            )
          : null;
        _ele && targetElement?.insertBefore(_ele, refElement || null);
      });

      // view state
      setTimeout(() => {
        dispatch(focusFNNode(uids[uids.length - 1]));
        dispatch(selectFNNode(uids));
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
        `[${NodeUidAttribNameInApp}="${targetUid}"]`,
      );
      const refElement = isBetween
        ? contentRef?.contentWindow?.document?.querySelector(
            `[${NodeUidAttribNameInApp}="${targetUid}"] > :nth-child(${
              position + 1
            })`,
          )
        : null;

      uids.map((uid) => {
        // clone
        const ele = contentRef?.contentWindow?.document?.querySelector(
          `[${NodeUidAttribNameInApp}="${uid}"]`,
        );
        const _ele = ele?.cloneNode(true) as HTMLElement;

        // reset nest's uid
        const newUid = addedUidMap.get(uid);
        newUid && _ele.setAttribute(NodeUidAttribNameInApp, newUid);

        // reset descendant uids
        const childElementList = _ele.querySelectorAll("*");
        childElementList.forEach((childElement) => {
          const childUid = childElement.getAttribute(NodeUidAttribNameInApp);
          if (childUid) {
            const newChildUid = addedUidMap.get(childUid);
            if (newChildUid) {
              childElement.setAttribute(NodeUidAttribNameInApp, newChildUid);
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
        dispatch(focusFNNode(newUids[newUids.length - 1]));
        dispatch(selectFNNode(newUids));
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
        `[${NodeUidAttribNameInApp}="${targetUid}"]`,
      );
      const refElement = isBetween
        ? contentRef?.contentWindow?.document?.querySelector(
            `[${NodeUidAttribNameInApp}="${targetUid}"] > :nth-child(${
              position + 1
            })`,
          )
        : null;

      nodes.forEach((node) =>
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
          dispatch(focusFNNode(newUids[newUids.length - 1]));
          dispatch(selectFNNode(newUids));
        }, 100);
        removeRunningActions(["stageView-viewState"]);
      };
      updateViewState();
    },
    [removeRunningActions, contentRef, clipboardData, file.uid],
  );

  const duplicateElements = useCallback(
    (uids: TNodeUid[], addedUidMap: Map<TNodeUid, TNodeUid>) => {
      uids.map((uid) => {
        // clone
        const ele = contentRef?.contentWindow?.document?.querySelector(
          `[${NodeUidAttribNameInApp}="${uid}"]`,
        );
        const _ele = ele?.cloneNode(true) as HTMLElement;

        // reset nest's uid
        const newUid = addedUidMap.get(uid);
        newUid && _ele.setAttribute(NodeUidAttribNameInApp, newUid);

        // reset descendant uids
        const childElementList = _ele.querySelectorAll("*");
        childElementList.forEach((childElement) => {
          const childUid = childElement.getAttribute(NodeUidAttribNameInApp);
          if (childUid) {
            const newChildUid = addedUidMap.get(childUid);
            if (newChildUid) {
              childElement.setAttribute(NodeUidAttribNameInApp, newChildUid);
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
        dispatch(focusFNNode(newUids[newUids.length - 1]));
        dispatch(selectFNNode(newUids));
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
