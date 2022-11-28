import React, {
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  FileSystemDirectoryHandle,
  FileSystemFileHandle,
  FileSystemHandle,
  showDirectoryPicker,
} from 'file-system-access';
import {
  CustomDirectoryPickerOptions,
} from 'file-system-access/lib/showDirectoryPicker';
import { DraggingPositionItem } from 'react-complex-tree';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {
  Dialog,
  TreeView,
} from '@_components/common';
import { TreeViewData } from '@_components/common/treeView/types';
import {
  generateNodeUid,
  getSubUids,
  validateUids,
} from '@_node/apis';
import {
  TFileType,
  TNode,
  TUid,
  validFileType,
} from '@_node/types';
import { FFContext } from '@_pages/main';
import {
  clearFFState,
  collapseFFNode,
  expandFFNode,
  ffGetExpandedItemsSelector,
  ffGetFocusedItemSelector,
  ffGetSelectedItemsObjSelector,
  ffGetSelectedItemsSelector,
  focusFFNode,
  selectFFNode,
  updateFFNode,
} from '@_redux/ff';
import { clearFNState } from '@_redux/fn';
import {
  addFFNode,
  clearGlobalState,
  globalGetWorkspaceSelector,
  removeFFNode,
  setCurrentFile,
  setGlobalError,
  setGlobalPending,
} from '@_redux/global';
import {
  getFileExtension,
  verifyPermission,
} from '@_services/global';
import {
  FFNode,
  FFNodeType,
} from '@_types/ff';

import { renderers } from './renderers';
import { WorkspaceTreeViewProps } from './types';

export default function WorkspaceTreeView(props: WorkspaceTreeViewProps) {
  const dispatch = useDispatch()

  // fetch global state
  const workspace = useSelector(globalGetWorkspaceSelector)

  // fetch ff state
  const focusedItem = useSelector(ffGetFocusedItemSelector)
  const expandedItems = useSelector(ffGetExpandedItemsSelector)
  const selectedItems = useSelector(ffGetSelectedItemsSelector)
  const selectedItemsObj = useSelector(ffGetSelectedItemsObjSelector)

  const { ffHandlers, setFFHandlers, unsetFFHandlers } = useContext(FFContext)

  // workspace tree view data state
  const workspaceTreeViewData = useMemo(() => {
    // push all of the ff nodes in workspace from the global state
    let data: TreeViewData = {}
    for (const uid in workspace) {
      const node: FFNode = workspace[uid]
      data[uid] = {
        index: uid,
        data: node,
        children: node.children,
        hasChildren: !node.isEntity,
        canMove: uid !== 'root',
        canRename: uid !== 'root',
      }
    }
    return data
  }, [workspace])

  // import project folder to workspace
  const importRootDirectory = async (projectHandle: FileSystemDirectoryHandle) => {
    /* clear the original state and restore initial state */
    dispatch(clearGlobalState())
    dispatch(clearFFState())
    dispatch(clearFNState())

    // add sub nodes
    let handlers: { [uid: TUid]: FileSystemHandle } = { 'root': projectHandle }
    const parentNode: FFNode = {
      uid: 'root',
      p_uid: null,
      name: projectHandle.name,
      isEntity: false,
      children: [],
      data: {},
    }
    let nodes: FFNode[] = []
    let nodeIndex: number = 0
    for await (const entry of projectHandle.values()) {
      const relativePaths = await projectHandle.resolve(entry)
      const nodeUid = generateNodeUid('root', ++nodeIndex)
      handlers[nodeUid] = entry
      nodes.push({
        uid: nodeUid,
        p_uid: 'root',
        name: entry.name,
        isEntity: entry.kind !== "directory",
        children: [],
        data: relativePaths,
      })
    }
    nodes = nodes.sort((a: TNode, b: TNode) => {
      return a.isEntity && !b.isEntity ? 1 :
        !a.isEntity && b.isEntity ? -1 :
          a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0
    })
    nodes.map(node => parentNode.children.push(node.uid))
    nodes.push(parentNode)

    setFFHandlers(handlers)
    dispatch(addFFNode(nodes))
  }
  const onAddBtnClick = async () => {
    // open directory picker and get the project
    let projectHandle
    try {
      projectHandle = await showDirectoryPicker({ _preferPolyfill: false, mode: 'readwrite' } as CustomDirectoryPickerOptions)
    } catch (err) {
      dispatch(setGlobalError(err as string))
      return
    }

    dispatch(setGlobalPending(true))

    importRootDirectory(projectHandle as FileSystemDirectoryHandle)

    dispatch(setGlobalPending(false))
  }

  // cb
  const cb_focusFFNode = (uid: TUid) => {
    dispatch(focusFFNode(uid))
  }
  const cb_selectFFNode = (uids: TUid[]) => {
    /* check if it's new state */
    if (uids.length === selectedItems.length) {
      let same = true
      for (const uid of uids) {
        if (selectedItemsObj[uid] === undefined) {
          same = false
          break
        }
      }
      if (same) return
    }

    dispatch(selectFFNode(uids))
  }
  const cb_expandFFNode = async (uid: TUid) => {
    dispatch(expandFFNode([uid]))

    /* If it's already expanded item before, just expand it */
    if (workspace[uid].children.length > 0) {
      return
    }

    dispatch(setGlobalPending(true))

    /* verify handler permission */
    const handler = ffHandlers[uid] as FileSystemDirectoryHandle
    if (!verifyPermission(handler)) {
      dispatch(setGlobalPending(false))
      return
    }

    const parentNode: FFNode = JSON.parse(JSON.stringify(workspace[uid]))
    let nodes: FFNode[] = []
    let p_uid: TUid = uid
    let nodeIndex: number = 0
    let handlers: { [uid: TUid]: FileSystemHandle } = {}
    for await (const entry of handler.values()) {
      const nodeUid = generateNodeUid(p_uid, ++nodeIndex)
      handlers[nodeUid] = entry
      nodes.push({
        uid: nodeUid,
        p_uid: p_uid,
        name: entry.name,
        isEntity: entry.kind !== "directory",
        children: [],
        data: {},
      })
    }
    nodes = nodes.sort((a: TNode, b: TNode) => {
      return a.isEntity && !b.isEntity ? 1 :
        !a.isEntity && b.isEntity ? -1 :
          a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0
    })
    nodes.map(node => parentNode.children.push(node.uid))
    if (nodes.length > 0) {
      nodes.push(parentNode)
      setFFHandlers(handlers)
      dispatch(addFFNode(nodes))
    }

    dispatch(setGlobalPending(false))
  }
  const cb_collapseFFNode = (uid: TUid) => {
    dispatch(collapseFFNode([uid]))
  }
  const cb_readFFNode = async (uid: TUid) => {
    dispatch(setGlobalPending(true))

    /* verify handler permission */
    const handler = ffHandlers[uid] as FileSystemFileHandle
    if (!verifyPermission(handler)) {
      dispatch(setGlobalPending(false))
      return
    }

    const fileEntry = await handler.getFile()
    let fileType: string = handler.name.split('.').pop() as string
    fileType = validFileType[fileType] === true ? fileType : 'unknown'
    let content = await fileEntry.text()
    dispatch(setCurrentFile({ uid, type: fileType as TFileType, content }))

    dispatch(setGlobalPending(false))
  }
  const cb_renameFFNode = async (uid: TUid, name: string) => {
    /* check if it's a new state */
    if (workspace[uid].name === name) return

    dispatch(setGlobalPending(true))

    const node = workspace[uid]
    if (!node.isEntity) return

    /* verify handler permission */
    const handler = ffHandlers[uid] as FileSystemHandle
    if (!verifyPermission(handler)) {
      dispatch(setGlobalPending(false))
      return
    }

    if (handler.kind === 'directory') {

    } else {/* it's a file */
      const content = (handler as FileSystemFileHandle).getFile()
    }
    const subUids: TUid[] = getSubUids(uid, workspace)
    subUids.map((subUid) => {
    })

    dispatch(setGlobalPending(false))
    /* 
    // Rename the file.
    await file.move('new_name');
    // Move the file to a new directory.
    await file.move(directory);
    // Move the file to a new directory and rename it.
    await file.move(directory, 'newer_name');
    */
  }
  const cb_dropFFNode = (uids: TUid[], targetUid: TUid) => {
    // validate dnd uids
    let validatedUids: TUid[] = validateUids(uids, targetUid)
    if (validatedUids.length == 0) {
      return
    }

    dispatch(setGlobalPending(true))

    /* verify handler permission */
    const focusedItemHandler = ffHandlers[focusedItem] as FileSystemDirectoryHandle
    if (!verifyPermission(focusedItemHandler)) {
      dispatch(setGlobalPending(false))
      return
    }



    dispatch(setGlobalPending(false))
  }

  // create/delete/duplicate actions
  const [createFFModalOpen, setCreateFFModalOpen] = useState<boolean>(false)
  const [creatingFFType, setCreatingFFType] = useState<FFNodeType>('folder')
  const [newFFName, setNewFFName] = useState<string>('')
  const openCreateFFNodeModal = (ffNodeType: FFNodeType) => {
    /* check if the workspace exists */
    if (workspace['root'] === undefined) return

    /* check focusedItem is directory */
    const focusedNode: FFNode = workspace[focusedItem]
    if (focusedNode.isEntity) {
      return
    }

    setCreatingFFType(ffNodeType)
    setNewFFName('')
    setCreateFFModalOpen(true)
  }
  const createFFNode = async () => {
    setCreateFFModalOpen(false)

    dispatch(setGlobalPending(true))

    /* verify handler permission */
    const focusedItemHandler = ffHandlers[focusedItem] as FileSystemDirectoryHandle
    if (!verifyPermission(focusedItemHandler)) {
      dispatch(setGlobalPending(false))
      return
    }

    if (creatingFFType === 'folder') {
      let folderName: string = newFFName
      let exists: boolean = true
      try {
        await focusedItemHandler.getDirectoryHandle(newFFName, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }

      if (exists) {
        let index = 0
        while (exists) {
          const _folderName = `${newFFName} (${++index})`
          try {
            await focusedItemHandler.getDirectoryHandle(_folderName, { create: false })
            exists = true
          } catch (err) {
            folderName = _folderName
            exists = false
          }
        }
      }

      try {
        await focusedItemHandler.getDirectoryHandle(folderName, { create: true })
      } catch (err) {
        console.log(err)
      }
    } else if (creatingFFType === 'file') {
      let ext: string = getFileExtension(newFFName)
      let name: string = newFFName.slice(0, newFFName.length - ext.length)

      let fileName: string = newFFName
      let exists: boolean = true
      try {
        await focusedItemHandler.getFileHandle(newFFName, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }

      if (exists) {
        let index = 0
        while (exists) {
          const _fileName = `${name} (${++index})${ext}`
          try {
            await focusedItemHandler.getFileHandle(_fileName, { create: false })
            exists = true
          } catch (err) {
            fileName = _fileName
            exists = false
          }
        }
      }

      try {
        await focusedItemHandler.getFileHandle(fileName, { create: true })
      } catch (err) {
        console.log(err)
      }
    }

    dispatch(setGlobalPending(false))
  }
  const deleteFFNode = async () => {
    /* validate uids and see if there are selected items */
    const uids = validateUids(selectedItems)
    if (uids.length === 0) return

    dispatch(setGlobalPending(true))

    let allDone = true
    for (const uid of uids) {
      const node: FFNode = workspace[uid]
      const parentNode: FFNode = workspace[node.p_uid as TUid]

      /* verify handler permission */
      const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!verifyPermission(parentHandler)) {
        allDone = false
        continue
      }

      try {
        await parentHandler.removeEntry(node.name, { recursive: true })

        /* side effect */
        const subUids = getSubUids(uid, workspace)
        dispatch(removeFFNode(subUids))
        dispatch(updateFFNode({ deletedUids: subUids }))
        unsetFFHandlers(subUids)
      } catch (err) {
        console.log(err)
      }
    }

    dispatch(setGlobalPending(false))
  }
  const duplicateFFNode = () => {
    /* check if it's root */
    if (focusedItem === 'root') {
      return
    }
  }

  return (<>
    <div
      style={{
        width: "100%",
        height: "400px",
        overflow: "auto",
        borderBottom: "1px solid rgb(10, 10, 10)",
      }}
    >
      {/* Name Bar */}
      <div
        style={{
          zIndex: "1",
          position: "sticky",
          top: "0",
          width: "100%",
          color: "white",
          fontSize: "13px",
          padding: "2px 0px 5px 5px",
          marginBottom: "5px",
          borderBottom: "1px solid black",
          background: "rgb(31, 36, 40)",
        }}
      >
        Workspace

        {/* Nav Bar */}
        <div
          style={{
            zIndex: "2",
            position: "absolute",
            top: "0px",
            right: "0px",
            display: 'flex',
            alignItems: 'center',
            justifyContent: "flex-end",
            width: "100%",
            height: '100%',
          }}
        >
          {/* Create Folder Button */}
          <button
            style={{
              background: "rgb(23 111 44)",
              color: "white",
              border: "none",
              font: "normal lighter normal 12px Arial",
              margin: "0px 5px",
            }}
            onClick={() => openCreateFFNodeModal('folder')}
          >
            + Folder
          </button>

          {/* Create File Button */}
          <button
            style={{
              background: "rgb(23 111 44)",
              color: "white",
              border: "none",
              font: "normal lighter normal 12px Arial",
              margin: "0px 5px",
            }}
            onClick={() => openCreateFFNodeModal('file')}
          >
            + File
          </button>

          {/* Duplicate Button */}
          <button
            style={{
              background: "rgb(23 111 44)",
              color: "white",
              border: "none",
              font: "normal lighter normal 12px Arial",
              margin: "0px 5px",
            }}
            onClick={duplicateFFNode}
          >
            Duplicate
          </button>

          {/* Delete Node Button */}
          <button
            style={{
              background: "rgb(23 111 44)",
              color: "white",
              border: "none",
              font: "normal lighter normal 12px Arial",
              margin: "0px 5px",
            }}
            onClick={deleteFFNode}
          >
            Delete
          </button>

          {/* Add Project Button */}
          <button
            style={{
              background: "rgb(23 111 44)",
              color: "white",
              border: "none",
              font: "normal lighter normal 12px Arial",
              margin: "0px 5px",
            }}
            onClick={onAddBtnClick}
          >
            Open
          </button>

        </div>
      </div>

      <Dialog
        open={createFFModalOpen}
        onClose={() => { setCreateFFModalOpen(false) }}
      >
        <div style={{}}>
          <h2>Create a {creatingFFType}</h2>
          <p>Enter the folder or file name you want</p>
          <input
            value={newFFName}
            onChange={(e) => {
              setNewFFName(e.target.value)
            }}
            style={{
              width: "100%",
              flex: "1",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              padding: " 0 10px",
              fontSize: "15px",
              lineHeight: "1",
              color: "black",
              boxShadow: "0 0 0 1px black",
              height: "35px",
            }}></input>
          <button onClick={createFFNode} style={{}}>Ok</button>
        </div>
      </Dialog>

      {/* Main TreeView */}
      <TreeView
        /* style */
        width={'300px'}
        height={'400px'}

        /* data */
        data={workspaceTreeViewData}
        focusedItem={focusedItem}
        expandedItems={expandedItems}
        selectedItems={selectedItems}

        /* renderers */
        renderers={renderers}

        /* possibilities */
        props={{
          canDragAndDrop: true,
          canDropOnItemWithChildren: true,
          canDropOnItemWithoutChildren: false,
        }}

        /* cb */
        callbacks={{
          /* RENAME CALLBACK */
          onRenameItem: (item, name, treeId) => {
            cb_renameFFNode(item.index as TUid, name)
          },

          /* SELECT, FOCUS, EXPAND, COLLAPSE CALLBACK */
          onSelectItems: (items, treeId) => {
            cb_selectFFNode(items as TUid[])
          },
          onFocusItem: (item, treeId) => {
            cb_focusFFNode(item.index as TUid)
          },
          onExpandItem: (item, treeId) => {
            cb_expandFFNode(item.index as TUid)
          },
          onCollapseItem: (item, treeId) => {
            cb_collapseFFNode(item.index as TUid)
          },

          /* READ CALLBACK */
          onPrimaryAction: (item, treeId) => {
            cb_readFFNode(item.index as TUid)
          },

          // DnD CALLBACK
          onDrop: (items, target) => {
            const uids: TUid[] = items.map(item => item.index as TUid)
            const targetUid: TUid = (target as DraggingPositionItem).targetItem as TUid
            cb_dropFFNode(uids, targetUid)
          }
        }}
      />
    </div>
  </>)
}