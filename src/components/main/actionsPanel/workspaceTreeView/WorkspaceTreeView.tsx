import React, {
  useCallback,
  useContext,
  useEffect,
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
import { FileSystemWatchInterval } from '@_config/main';
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
import * as Main from '@_redux/main';
import { MainContext } from '@_redux/main';
import {
  getFileExtension,
  verifyPermission,
} from '@_services/main';
import {
  FFNode,
  FFNodeType,
  ProjectLocation,
} from '@_types/main';

import { renderers } from './renderers';
import { WorkspaceTreeViewProps } from './types';

export default function WorkspaceTreeView(props: WorkspaceTreeViewProps) {
  const dispatch = useDispatch()

  /* project source location - localhost, git, dropbox, etc.. */
  const [projectLocation, setProjectLocation] = useState<ProjectLocation>()

  // fetch global state
  const workspace = useSelector(Main.globalGetWorkspaceSelector)

  // fetch ff state
  const focusedItem = useSelector(Main.ffGetFocusedItemSelector)
  const expandedItems = useSelector(Main.ffGetExpandedItemsSelector)
  const expandedItemsObj = useSelector(Main.ffGetExpandedItemsObjSelector)
  const selectedItems = useSelector(Main.ffGetSelectedItemsSelector)
  const selectedItemsObj = useSelector(Main.ffGetSelectedItemsObjSelector)

  /* fetch dat afrom context */
  const { ffHandlers, setFFHandlers } = useContext(MainContext)

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

  /* import project from localhost using filesystemdirectoryhandle */
  const importLocalhostProject = useCallback(async (projectHandle: FileSystemDirectoryHandle) => {
    /* verify handler permission */
    if (!verifyPermission(projectHandle)) {
      dispatch(Main.setGlobalError({
        type: 'error',
        errorMessage: 'Project folder is not valid. Please import valid project.',
      }))
      throw 'error'
    }

    // import all sub nodes
    let nodes: FFNode[] = []
    const deletedUids: TUid[] = []
    let handlers: { [uid: TUid]: FileSystemHandle } = { 'root': projectHandle }
    let dirHandlers: { node: FFNode, handler: FileSystemDirectoryHandle }[] = [{
      node: {
        uid: 'root',
        p_uid: null,
        name: projectHandle.name,
        isEntity: false,
        children: [],
        data: {
          new: workspace['root'] === undefined,
        },
      },
      handler: projectHandle,
    }]
    while (dirHandlers.length) {
      const { node, handler } = dirHandlers.shift() as { node: FFNode, handler: FileSystemDirectoryHandle }
      let hasChange = {
        create: false,
        delete: false,
      }

      let subNodes: FFNode[] = []
      let maxChildIndex = node.children.reduce((prev: number, cur: TUid): number => {
        const childIndex = Number(cur.split("_").pop())
        return prev < childIndex ? childIndex : prev
      }, 0)

      /* access file system handle */
      const children: { [uid: TUid]: boolean } = {}
      try {
        for await (const entry of handler.values()) {
          let hasChild = false
          let subNodeUid: TUid = ''
          node.children.map((childUid) => {
            if (workspace[childUid] && workspace[childUid].name === entry.name) {
              subNodeUid = childUid
              children[childUid] = true
              hasChild = true
            }
          })
          if (!hasChild) {
            hasChange.create = true
            subNodeUid = generateNodeUid(node.uid, ++maxChildIndex)
          }
          handlers[subNodeUid] = entry
          const subNode: FFNode = {
            uid: subNodeUid,
            p_uid: node.uid,
            name: entry.name,
            isEntity: entry.kind !== "directory",
            children: [],
            data: {
              new: !hasChild,
            },
          }
          subNodes.push(subNode)
          expandedItemsObj[subNodeUid] && dirHandlers.push({ node: subNode, handler: entry as FileSystemDirectoryHandle })
        }
      } catch (err) {
        dispatch(Main.setGlobalError({
          type: 'error',
          errorMessage: 'Error occurred during project importing.',
        }))
        return
      }
      node.children.map((childUid) => {
        if (children[childUid] === undefined) {
          hasChange.delete = true
          deletedUids.push(childUid)
        }
      })
      node.data.modified = hasChange.create || hasChange.delete
      subNodes = subNodes.sort((a: TNode, b: TNode) => {
        return a.isEntity && !b.isEntity ? 1 :
          !a.isEntity && b.isEntity ? -1 :
            a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0
      })
      node.children = []
      subNodes.map(subNode => node.children.push(subNode.uid))
      nodes.push(node)
      nodes.push(...subNodes)
    }

    setFFHandlers(deletedUids, handlers)
    dispatch(Main.updateFFNode({ deletedUids }))
    dispatch(Main.setFFNode({ deletedUids, nodes }))
  }, [workspace, expandedItemsObj])

  // file system watcher
  const watchFileSystem = useCallback(async () => {
    if (projectLocation === 'localhost') {
      try {
        if (ffHandlers['root'] === undefined) {
          dispatch(Main.clearMainState())/* clear the original state and restore initial state */
        } else {
          await importLocalhostProject(ffHandlers['root'] as FileSystemDirectoryHandle)/* reload the project */
        }
      } catch (err) { // error occurred
        dispatch(Main.clearMainState())/* clear the original state and restore initial state */
      }
    }
  }, [projectLocation, ffHandlers, importLocalhostProject])

  /* set file system watch timer */
  useEffect(() => {
    // create a fs watch interval and get the id
    const fsWatchInterval = setInterval(() => {
      watchFileSystem()
    }, FileSystemWatchInterval)
    // clear out the fs watch interval using the id when unmounting the component
    return () => clearInterval(fsWatchInterval)
  }, [watchFileSystem])

  // open project button handler
  const onAddBtnClick = useCallback(async (location: ProjectLocation = 'localhost') => {
    setProjectLocation(location)

    if (location === 'localhost') {
      // open directory picker and get the project
      let projectHandle: FileSystemHandle
      try {
        projectHandle = await showDirectoryPicker({ _preferPolyfill: false, mode: 'readwrite' } as CustomDirectoryPickerOptions)
      } catch (err) {
        dispatch(Main.setGlobalError({
          type: 'warning',
          errorMessage: '"Project import" canceled..',
        }))
        return
      }

      /* import localhost porject */
      try {
        dispatch(Main.setGlobalPending(true))
        await importLocalhostProject(projectHandle as FileSystemDirectoryHandle)
        dispatch(Main.setGlobalPending(false))
      } catch (err) {
        // error occurred
        return
      }
    } else if (location === 'git') {

    }
  }, [projectLocation])

  // cb
  const cb_focusFFNode = useCallback((uid: TUid) => {
    dispatch(Main.focusFFNode(uid))
  }, [])
  const cb_selectFFNode = useCallback((uids: TUid[]) => {
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

    dispatch(Main.selectFFNode(uids))
  }, [])
  const cb_expandFFNode = useCallback(async (uid: TUid) => {
    dispatch(Main.expandFFNode([uid]))
  }, [])
  const cb_collapseFFNode = useCallback((uid: TUid) => {
    dispatch(Main.collapseFFNode([uid]))
  }, [])
  const cb_readFFNode = useCallback(async (uid: TUid) => {
    dispatch(Main.setGlobalPending(true))

    /* verify handler permission */
    const handler = ffHandlers[uid] as FileSystemFileHandle
    if (!verifyPermission(handler)) {
      dispatch(Main.setGlobalPending(false))
      return
    }

    const fileEntry = await handler.getFile()
    let fileType: string = handler.name.split('.').pop() as string
    fileType = validFileType[fileType] === true ? fileType : 'unknown'
    let content = await fileEntry.text()
    dispatch(Main.setCurrentFile({ uid, type: fileType as TFileType, content }))

    dispatch(Main.setGlobalPending(false))
  }, [ffHandlers])
  const cb_renameFFNode = useCallback(async (uid: TUid, name: string) => {
    /* validate */
    const node = workspace[uid]
    if (node === undefined || node.name === name) return
    const parentNode = workspace[node.p_uid as TUid]
    if (parentNode === undefined) return

    dispatch(Main.setGlobalPending(true))

    /* verify handler permission */
    const handler = ffHandlers[uid] as FileSystemHandle
    const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
    if (!verifyPermission(handler) || !verifyPermission(parentHandler)) {
      dispatch(Main.setGlobalPending(false))
      dispatch(Main.setGlobalError({
        type: 'error',
        errorMessage: 'Error occurred on File System Handle ...',
      }))
      return
    }

    if (handler.kind === 'directory') {
      /* validate if the new name exists */
      let exists: boolean = true
      try {
        await parentHandler.getDirectoryHandle(name, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }
      if (exists) {
        dispatch(Main.setGlobalPending(false))
        dispatch(Main.setGlobalError({
          type: 'warning',
          errorMessage: 'Folder with the same name already exists.',
        }))
        return
      }

      /* create a new folder with the new name and move the nested directory */
      /* let newHandler
      try {
        newHandler = await parentHandler.getDirectoryHandle(name, { create: true })
      } catch (err) {
        dispatch(Main.setGlobalPending(false))
        dispatch(Main.setGlobalError({
          type: 'warning',
          errorMessage: 'Error occurred while creating a new folder ...',
        }))
        return
      }
      try {
        const content = await (handler as FileSystemFileHandle).getFile()
        const writableStream = await (newHandler as FileSystem).createWritable()
        await writableStream.write(content)
        await writableStream.close()
        await parentHandler.removeEntry(handler.name, { recursive: true })
      } catch (err) {
        dispatch(Main.setGlobalPending(false))
        dispatch(Main.setGlobalError({
          type: 'error',
          errorMessage: 'Error occurred while writing file content',
        }))
      } */
    } else {/* it's a file */
      /* validate if the new name exists */
      let exists: boolean = true
      try {
        await parentHandler.getFileHandle(name, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }
      if (exists) {
        dispatch(Main.setGlobalPending(false))
        dispatch(Main.setGlobalError({
          type: 'warning',
          errorMessage: 'File with the same name already exists.',
        }))
        return
      }

      /* create a new file with the new name and write the content */
      let newHandler
      try {
        newHandler = await parentHandler.getFileHandle(name, { create: true })
      } catch (err) {
        dispatch(Main.setGlobalPending(false))
        dispatch(Main.setGlobalError({
          type: 'warning',
          errorMessage: 'Error occurred while creating a new file ...',
        }))
        return
      }
      try {
        const content = await (handler as FileSystemFileHandle).getFile()
        const writableStream = await (newHandler as FileSystemFileHandle).createWritable()
        await writableStream.write(content)
        await writableStream.close()
        await parentHandler.removeEntry(handler.name, { recursive: true })
      } catch (err) {
        dispatch(Main.setGlobalPending(false))
        dispatch(Main.setGlobalError({
          type: 'error',
          errorMessage: 'Error occurred while writing file content',
        }))
      }
    }

    dispatch(Main.setGlobalPending(false))
  }, [workspace, ffHandlers])
  const cb_dropFFNode = (uids: TUid[], targetUid: TUid) => {
    // validate dnd uids
    let validatedUids: TUid[] = validateUids(uids, targetUid)
    if (validatedUids.length == 0) {
      return
    }

    dispatch(Main.setGlobalPending(true))

    /* verify handler permission */
    const focusedItemHandler = ffHandlers[focusedItem] as FileSystemDirectoryHandle
    if (!verifyPermission(focusedItemHandler)) {
      dispatch(Main.setGlobalPending(false))
      return
    }



    dispatch(Main.setGlobalPending(false))
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

    dispatch(Main.setGlobalPending(true))

    /* verify handler permission */
    const focusedItemHandler = ffHandlers[focusedItem] as FileSystemDirectoryHandle
    if (!verifyPermission(focusedItemHandler)) {
      dispatch(Main.setGlobalPending(false))
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

    dispatch(Main.setGlobalPending(false))
  }
  const deleteFFNode = async () => {
    /* validate uids and see if there are selected items */
    const uids = validateUids(selectedItems)
    if (uids.length === 0) return

    dispatch(Main.setGlobalPending(true))

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
        dispatch(Main.setFFNode({ deletedUids: subUids, nodes: [] }))
        dispatch(Main.updateFFNode({ deletedUids: subUids }))
        setFFHandlers(subUids, {})
      } catch (err) {
        console.log(err)
      }
    }

    dispatch(Main.setGlobalPending(false))
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
        height: "300px",
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
            onClick={() => {
              onAddBtnClick()
            }}
          >
            Open
          </button>

        </div>
      </div>

      {/* ff name input modal */}
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