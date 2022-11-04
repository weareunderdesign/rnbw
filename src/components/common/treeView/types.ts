type TreeViewProps = {
  width: string,
  height: string,
}

type TreeItemType = {
  "index": string,
  "data": string,
  "children": string[],
  "hasChildren": boolean,
  "canMove": boolean,
  "canRename": boolean
}