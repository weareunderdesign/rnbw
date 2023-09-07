import { TNodeUid } from "@_node/types";
import { useNodeActions } from "./useNodeActions";
import { useNodeViewState } from "./useNodeViewState";
import { DraggingPosition, TreeItem, TreeItemIndex } from "react-complex-tree";

export const useNodeTreeCallback = (focusedItemRef: any, isDragging: any) => {
  const { cb_moveNode } = useNodeActions();

  const { cb_focusNode, cb_selectNode, cb_expandNode, cb_collapseNode } =
    useNodeViewState(focusedItemRef);

  const onSelectItems = (items: TreeItemIndex[]) => {
    cb_selectNode(items as TNodeUid[]);
  };

  return {
    // onSelectItems: (items: TreeItemIndex[]) => {
    //       cb_selectNode(items as TNodeUid[])
    //     },
    onSelectItems,
    onFocusItem: (item: TreeItem) => {
      cb_focusNode(item.index as TNodeUid);
    },
    onExpandItem: (item: TreeItem) => {
      cb_expandNode(item.index as TNodeUid);
    },
    onCollapseItem: (item: TreeItem) => {
      cb_collapseNode(item.index as TNodeUid);
    },
    onDrop: (items: TreeItem[], target: DraggingPosition) => {
      const uids: TNodeUid[] = items.map((item) => item.index as TNodeUid);
      const isBetween = target.targetType === "between-items";
      const targetUid = (
        isBetween ? target.parentItem : target.targetItem
      ) as TNodeUid;
      const position = isBetween ? target.childIndex : 0;

      cb_moveNode(uids, targetUid, isBetween, position);

      isDragging.current = false;

      const className = "dragging-tree";
      const html = document.getElementsByTagName("html").item(0);
      let body = document.body as HTMLElement;
      body.classList.remove("inheritCursors");
      body.style.cursor = "unset";
      if (html && new RegExp(className).test(html.className) === true) {
        // Remove className with the added space (from setClassToHTMLElement)

        html.className = html.className.replace(
          new RegExp(" " + className),
          "",
        );
        // Remove className without added space (just in case)
        html.className = html.className.replace(new RegExp(className), "");
      }
    },
  };
};
