import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import cx from 'classnames';
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
import { icons } from './tempIcons';
import { WorkspaceTreeViewProps } from './types';

export default function WorkspaceTreeView(props: WorkspaceTreeViewProps) {
  const dispatch = useDispatch()

  // project source location - localhost, git, dropbox, etc..
  const [projectLocation, setProjectLocation] = useState<ProjectLocation>()

  // fetch necessary state
  const pending = useSelector(Main.globalGetPendingSelector)
  const workspace = useSelector(Main.globalGetWorkspaceSelector)

  // file-tree-view view state
  const focusedItem = useSelector(Main.ffGetFocusedItemSelector)
  const expandedItems = useSelector(Main.ffGetExpandedItemsSelector)
  const expandedItemsObj = useSelector(Main.ffGetExpandedItemsObjSelector)
  const selectedItems = useSelector(Main.ffGetSelectedItemsSelector)
  const selectedItemsObj = useSelector(Main.ffGetSelectedItemsObjSelector)

  // file handlers from context
  const { ffHandlers, setFFHandlers } = useContext(MainContext)

  // generate TreeViewData from workspace
  const workspaceTreeViewData = useMemo(() => {
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

  // import project from localhost using filesystemdirectoryhandle
  const importLocalhostProject = useCallback(async (projectHandle: FileSystemDirectoryHandle) => {
    // verify handler permission
    if (!(await verifyPermission(projectHandle))) {
      dispatch(Main.setGlobalError({
        type: 'error',
        errorMessage: 'Project folder is not valid. Please import valid project.',
      }))
      throw 'error'
    }

    let handlers: { [uid: TUid]: FileSystemHandle } = { 'root': projectHandle }
    let dirHandlers: { node: FFNode, handler: FileSystemDirectoryHandle }[] = [{
      node: {
        uid: 'root',
        p_uid: null,
        name: projectHandle.name,
        isEntity: false,
        children: workspace['root'] ? workspace['root'].children : [],
        data: {
          new: workspace['root'] === undefined,
        },
      },
      handler: projectHandle,
    }]

    // import all sub nodes
    let nodes: FFNode[] = []
    const deletedUids: TUid[] = []
    while (dirHandlers.length) {
      const { node: dirNode, handler: dirHandler } = dirHandlers.shift() as { node: FFNode, handler: FileSystemDirectoryHandle }

      // get the max child index
      let maxChildIndex = dirNode.children.reduce((prev: number, cur: TUid): number => {
        const childIndex = Number(cur.split("_").pop())
        return prev < childIndex ? childIndex : prev
      }, 0)

      // access file system handle and load the sub folder/file
      let subNodes: FFNode[] = []
      let hasChange = { create: false, delete: false }
      const children: { [uid: TUid]: boolean } = {}
      try {
        for await (const entry of dirHandler.values()) {
          // check if the entry already exists
          let entryExists = false
          let childNodeUid: TUid = ''
          let childNodeChildren: TUid[] = []
          dirNode.children.map((c_uid) => {
            if (workspace[c_uid] && workspace[c_uid].name === entry.name) {
              entryExists = true
              childNodeUid = c_uid
              childNodeChildren = workspace[c_uid].children
              children[c_uid] = true
            }
          })
          if (!entryExists) {
            hasChange.create = true
            childNodeUid = generateNodeUid(dirNode.uid, ++maxChildIndex)
          }

          handlers[childNodeUid] = entry
          const subNode: FFNode = {
            uid: childNodeUid,
            p_uid: dirNode.uid,
            name: entry.name,
            isEntity: entry.kind !== "directory",
            children: entryExists ? childNodeChildren : [],
            data: {
              new: !entryExists,
            },
          }
          subNodes.push(subNode)
          expandedItemsObj[childNodeUid] && dirHandlers.push({ node: subNode, handler: entry as FileSystemDirectoryHandle })
        }
      } catch (err) {
        dispatch(Main.setGlobalError({
          type: 'error',
          errorMessage: 'Error occurred during importing project.',
        }))
        throw 'error'
      }

      // sort the sub nodes by folder/file asc
      subNodes = subNodes.sort((a: TNode, b: TNode) => {
        return a.isEntity && !b.isEntity ? 1 :
          !a.isEntity && b.isEntity ? -1 :
            a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0
      })

      // update dirNode and push to total nodes
      dirNode.children.map((c_uid) => {
        if (children[c_uid] === undefined) {
          hasChange.delete = true
          deletedUids.push(c_uid)
        }
      })
      dirNode.data.modified = hasChange.create || hasChange.delete
      dirNode.children = []
      subNodes.map(subNode => dirNode.children.push(subNode.uid))
      nodes.push(dirNode)
      nodes.push(...subNodes)
    }

    // update the state
    setFFHandlers(deletedUids, handlers)
    dispatch(Main.updateFFTreeView({ deletedUids, nodes }))
    dispatch(Main.updateFFTreeViewState({ deletedUids }))
  }, [workspace, expandedItemsObj])

  // watch file system
  const watchFileSystem = useCallback(async () => {
    // if the project is from localhost
    if (projectLocation === 'localhost') {
      if (ffHandlers['root'] === undefined) {
        // do nothing
      } else {
        try {
          await importLocalhostProject(ffHandlers['root'] as FileSystemDirectoryHandle)
        } catch (err) {
          dispatch(Main.clearMainState())
        }
      }
    }
  }, [projectLocation, ffHandlers, importLocalhostProject])

  // set file system watch timer
  useEffect(() => {
    let fsWatchInterval: NodeJS.Timer

    // stop if pending is true
    if (!pending) {
      // create a fs watch interval and get the id
      fsWatchInterval = setInterval(watchFileSystem, FileSystemWatchInterval)
    }

    // clear out the fs watch interval using the id when unmounting the component
    return () => clearInterval(fsWatchInterval)
  }, [pending, watchFileSystem])

  // open project button handler
  const onImportProject = useCallback(async (location: ProjectLocation = 'localhost') => {
    setProjectLocation(location)

    if (location === 'localhost') {
      // open directory picker and get the project folde handle
      let projectHandle: FileSystemHandle
      try {
        projectHandle = await showDirectoryPicker({ _preferPolyfill: false, mode: 'readwrite' } as CustomDirectoryPickerOptions)
      } catch (err) {
        dispatch(Main.setGlobalError({
          type: 'info',
          errorMessage: 'You canceled importing project.',
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
      }
    }
  }, [])

  // cb
  const cb_focusFFNode = useCallback((uid: TUid) => {
    dispatch(Main.focusFFNode(uid))
  }, [])
  const cb_selectFFNode = useCallback((uids: TUid[]) => {
    // check if it's new state
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

  // create directory/file dialog handle
  const [createFFModalOpen, setCreateFFModalOpen] = useState<boolean>(false)
  const [creatingFFType, setCreatingFFType] = useState<FFNodeType>()
  const [newFFName, setNewFFName] = useState<string>('')
  const openCreateFFNodeModal = useCallback((ffNodeType: FFNodeType) => {
    // check if the workspace exists
    if (workspace['root'] === undefined) return

    // check focusedItem is directory
    const focusedNode: FFNode = workspace[focusedItem]
    if (focusedNode === undefined || focusedNode.isEntity) {
      return
    }

    setCreatingFFType(ffNodeType)
    setNewFFName('')
    setCreateFFModalOpen(true)
  }, [workspace, focusedItem])

  // create folder/file api
  const createFFNode = useCallback(async () => {
    // close name input modal
    setCreateFFModalOpen(false)

    dispatch(Main.setGlobalPending(true))

    // verify handler permission
    const focusedItemHandler = ffHandlers[focusedItem] as FileSystemDirectoryHandle
    if (!(await verifyPermission(focusedItemHandler))) {
      dispatch(Main.setGlobalPending(false))
      dispatch(Main.setGlobalError({
        type: 'error',
        errorMessage: `Invalid target directory. Check if you have "write" permission for the directory.`,
      }))
      return
    }

    if (creatingFFType === 'folder') {
      // generate new folder name - ex: {aaa - copy}...
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

      // create the directory with generated name
      try {
        await focusedItemHandler.getDirectoryHandle(folderName, { create: true })
      } catch (err) {
        dispatch(Main.setGlobalError({
          type: 'error',
          errorMessage: 'Error occurred while creating a new folder.',
        }))
      }
    } else if (creatingFFType === 'file') {
      // generate new file name - ex: {aaa - copy}...
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

      // create the file with generated name
      try {
        await focusedItemHandler.getFileHandle(fileName, { create: true })
      } catch (err) {
        dispatch(Main.setGlobalError({
          type: 'error',
          errorMessage: 'Error occurred while creating a new file.',
        }))
      }
    }

    dispatch(Main.setGlobalPending(false))
  }, [ffHandlers, focusedItem])

  // delete folder/file api
  const deleteFFNode = useCallback(async () => {
    // validate selected uids
    const uids = validateUids(selectedItems)
    if (uids.length === 0) return

    dispatch(Main.setGlobalPending(true))

    let allDone = true
    for (const uid of uids) {
      // validate node and parentNode
      const node: FFNode = workspace[uid]
      if (node === undefined) {
        allDone = false
        continue
      }
      const parentNode: FFNode = workspace[node.p_uid as TUid]
      if (parentNode === undefined) {
        allDone = false
        continue
      }

      // verify handler permission
      const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyPermission(parentHandler))) {
        allDone = false
        continue
      }

      // remove the entry
      try {
        await parentHandler.removeEntry(node.name, { recursive: true })
      } catch (err) {
        allDone = false
      }
    }

    if (!allDone) {
      dispatch(Main.setGlobalError({
        type: 'warning',
        errorMessage: 'Some directory/file couldn\'t be deleted.',
      }))
    }

    dispatch(Main.setGlobalPending(false))
  }, [selectedItems])

  // read file content call back
  const cb_readFFNode = useCallback(async (uid: TUid) => {
    dispatch(Main.setGlobalPending(true))

    // verify handler permission
    const handler = ffHandlers[uid] as FileSystemFileHandle
    if (!(await verifyPermission(handler))) {
      dispatch(Main.setGlobalPending(false))
      dispatch(Main.setGlobalError({
        type: 'error',
        errorMessage: 'Invalid file. Check if you have "read" permission for the file.',
      }))
      return
    }

    // get file type (extension)
    let fileType = getFileExtension(handler.name)
    if (fileType !== '') fileType = fileType.slice(1)
    fileType = validFileType[fileType] === true ? fileType : 'unknown'

    // read the file content and set to global state
    try {
      const fileEntry = await handler.getFile()
      let content = await fileEntry.text()
      dispatch(Main.setFileContent({
        uid,
        name: handler.name,
        type: fileType as TFileType,
        content,
        saved: true
      }))
    } catch (err) {
      dispatch(Main.setGlobalError({
        type: 'error',
        errorMessage: 'Error occurred while reading the file content.',
      }))
    }

    dispatch(Main.setGlobalPending(false))
  }, [ffHandlers])

  /**
   * general move api - for rename, copy/paste(duplicate), cut/paste(move)
   * here, the handler params are already verified ones.
   * @param handler 
   * @param parentHandler 
   * @param targetHandler 
   * @param newName 
   * @param copy 
   * @returns 
   */
  const moveFF = async (handler: FileSystemHandle, parentHandler: FileSystemDirectoryHandle, targetHandler: FileSystemDirectoryHandle, newName: string, copy: boolean = false) => {
    if (handler.kind === 'directory') {
      // validate if the new name exists
      let exists: boolean = true
      try {
        await targetHandler.getDirectoryHandle(newName, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }
      if (exists) {
        dispatch(Main.setGlobalError({
          type: 'error',
          errorMessage: 'Folder with the same name already exists.',
        }))
        return
      }

      // move nested handler-dir to targetHandler with the newName - copy (optional)
      try {
        const newHandler = await targetHandler.getDirectoryHandle(newName, { create: true })
        const newDirHandlers: FileSystemDirectoryHandle[] = [newHandler]
        const dirHandlers: FileSystemDirectoryHandle[] = [handler as FileSystemDirectoryHandle]
        while (dirHandlers.length) {
          const dirHandler = dirHandlers.shift() as FileSystemDirectoryHandle
          const newDirHandler = newDirHandlers.shift() as FileSystemDirectoryHandle
          for await (const entry of dirHandler.values()) {
            if (entry.kind === 'directory') {
              const newDir = await newDirHandler.getDirectoryHandle(entry.name, { create: true })
              dirHandlers.push(entry)
              newDirHandlers.push(newDir)
            } else {
              const newFile = await newDirHandler.getFileHandle(entry.name, { create: true })
              const content = await (entry as FileSystemFileHandle).getFile()
              const writableStream = await newFile.createWritable()
              await writableStream.write(content)
              await writableStream.close()
            }
          }
        }

        // handle copy(optional)
        !copy && await parentHandler.removeEntry(handler.name, { recursive: true })
      } catch (err) {
        throw 'error'
      }
    } else {
      // validate if the new name exists
      let exists: boolean = true
      try {
        await targetHandler.getFileHandle(newName, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }
      if (exists) {
        dispatch(Main.setGlobalError({
          type: 'error',
          errorMessage: 'File with the same name already exists.',
        }))
        return
      }

      // create a new file with the new name and write the content
      try {
        const newFile = await targetHandler.getFileHandle(newName, { create: true })
        const content = await (handler as FileSystemFileHandle).getFile()
        const writableStream = await (newFile).createWritable()
        await writableStream.write(content)
        await writableStream.close()

        // handle copy(optional)
        !copy && await parentHandler.removeEntry(handler.name, { recursive: true })
      } catch (err) {
        throw 'error'
      }
    }
  }

  // rename folder/file call back
  const cb_renameFFNode = useCallback(async (uid: TUid, newName: string) => {
    // validate
    const node = workspace[uid]
    if (node === undefined || node.name === newName) return
    const parentNode = workspace[node.p_uid as TUid]
    if (parentNode === undefined) return

    dispatch(Main.setGlobalPending(true))

    /* verify handler permission */
    const handler = ffHandlers[uid] as FileSystemHandle
    const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
    if (!(await verifyPermission(handler)) || !(await verifyPermission(parentHandler))) {
      dispatch(Main.setGlobalPending(false))
      dispatch(Main.setGlobalError({
        type: 'error',
        errorMessage: `Invalid directory/file. Check if you have "write" permission for the directory/file.`,
      }))
      return
    }

    // rename using moveFF api
    try {
      await moveFF(handler, parentHandler, parentHandler, newName)
    } catch (err) {
      dispatch(Main.setGlobalError({
        type: 'error',
        errorMessage: 'Error occurred while renaming ...',
      }))
    }

    dispatch(Main.setGlobalPending(false))
  }, [workspace, ffHandlers])

  // dnd fole/file call back - multiple
  const cb_dropFFNode = useCallback(async (uids: TUid[], targetUid: TUid) => {
    // validate
    let validatedUids: TUid[] = validateUids(uids, targetUid)
    if (validatedUids.length == 0) {
      return
    }

    dispatch(Main.setGlobalPending(true))

    /* verify target handler permission */
    const targetHandler = ffHandlers[targetUid] as FileSystemDirectoryHandle
    if (!verifyPermission(targetHandler)) {
      dispatch(Main.setGlobalPending(false))
      dispatch(Main.setGlobalError({
        type: 'error',
        errorMessage: `Invalid target directory. Check if you have "write" permission for the directory.`,
      }))
      return
    }

    let allDone = true
    for (const uid of validatedUids) {
      // validate
      const node = workspace[uid]
      if (node === undefined) {
        allDone = false
        continue
      }
      const parentNode = workspace[node.p_uid as TUid]
      if (parentNode === undefined) {
        allDone = false
        continue
      }

      // validate node handler
      const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyPermission(handler)) || !(await verifyPermission(parentHandler))) {
        allDone = false
        continue
      }

      // move using moveFF api
      try {
        await moveFF(handler, parentHandler, targetHandler, handler.name)
      } catch (err) {
        // error occurred
      }
    }
    if (!allDone) {/* toast error message */
      dispatch(Main.setGlobalError({
        type: 'warning',
        errorMessage: 'Some directory/file couldn\'t be moved.',
      }))
    }

    dispatch(Main.setGlobalPending(false))
  }, [ffHandlers, workspace])

  // duplicate directory/file api
  const duplicateFFNode = useCallback(async () => {
    // validate
    if (focusedItem === 'root') return
    const node = workspace[focusedItem]
    if (node === undefined) return
    const parentNode = workspace[node.p_uid as TUid]
    if (parentNode === undefined) return

    dispatch(Main.setGlobalPending(true))

    // verify handler permission
    const handler = ffHandlers[node.uid] as FileSystemHandle
    const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
    if (!(await verifyPermission(handler)) || !(await verifyPermission(parentHandler))) {
      dispatch(Main.setGlobalPending(false))
      dispatch(Main.setGlobalError({
        type: 'error',
        errorMessage: `Invalid directory/file. Check if you have "write" permission for the directory/file.`,
      }))
      return
    }

    // generate new name
    let newName = ''
    if (handler.kind === 'directory') {
      const ffName = `${handler.name} copy`
      let folderName: string = ffName
      let exists: boolean = true
      try {
        await parentHandler.getDirectoryHandle(ffName, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }

      if (exists) {
        let index = 0
        while (exists) {
          const _folderName = `${ffName} (${++index})`
          try {
            await parentHandler.getDirectoryHandle(_folderName, { create: false })
            exists = true
          } catch (err) {
            folderName = _folderName
            exists = false
          }
        }
      }
      newName = folderName
    } else {
      let ext: string = getFileExtension(handler.name)
      let name: string = handler.name.slice(0, handler.name.length - ext.length)
      name = `${name} copy`
      const ffName = `${name}${ext}`

      let fileName: string = ffName
      let exists: boolean = true
      try {
        await parentHandler.getFileHandle(ffName, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }

      if (exists) {
        let index = 0
        while (exists) {
          const _fileName = `${name} (${++index})${ext}`
          try {
            await parentHandler.getFileHandle(_fileName, { create: false })
            exists = true
          } catch (err) {
            fileName = _fileName
            exists = false
          }
        }
      }
      newName = fileName
    }

    // duplicate using moveFF api
    try {
      await moveFF(handler, parentHandler, parentHandler, newName, true)
    } catch (err) {
      dispatch(Main.setGlobalError({
        type: 'error',
        errorMessage: 'Error occurred while duplicating ...',
      }))
    }

    dispatch(Main.setGlobalPending(false))
  }, [focusedItem, workspace, ffHandlers])

  return (<>
    <div className='direction-row border-bottom' style={{ flexWrap: "nowrap", height: "400px", overflow: "auto" }}>
      {/* Nav Bar */}
      <div className='sticky box-l justify-stretch padding-s background-secondary border-bottom'>
        {/* Workspace Name */}
        <p className='text-s'>Workspace</p>

        {/* Actoin Button Bar */}
        <div className='gap-xs'>
          {/* Create Folder Button */}
          <button className='text-s' onClick={() => openCreateFFNodeModal('folder')}>
            +Dir
          </button>

          {/* Create File Button */}
          <button className='text-s' onClick={() => openCreateFFNodeModal('file')}>
            +File
          </button>

          {/* Duplicate Button */}
          <button className='text-s' onClick={duplicateFFNode}>
            Dup
          </button>

          {/* Delete Node Button */}
          <button className='text-s' onClick={deleteFFNode}>
            Del
          </button>

          {/* Import Project Button */}
          <button className='text-s' onClick={() => onImportProject()}>
            Open
          </button>
        </div>
      </div>

      {/* Main TreeView */}
      <TreeView
        /* style */
        width={'100%'}
        height={'100%'}

        /* data */
        data={workspaceTreeViewData}
        focusedItem={focusedItem}
        expandedItems={expandedItems}
        selectedItems={selectedItems}

        /* renderers */
        renderers={{
          ...renderers,
          renderItem: (props) => {
            return <>
              <li
                className={cx(
                  props.context.isDraggingOver && 'background-secondary',
                )}
                {...(props.context.itemContainerWithChildrenProps) as any}
              >
                {/* self */}
                <div
                  className={cx(
                    'box-l',
                    'justify-start',
                    props.context.isSelected && 'color-primary',
                    props.context.isDraggingOver && 'color-primary',
                    props.context.isDraggingOverParent && 'draggingOverParent',
                    props.context.isFocused && 'border',
                  )}
                  style={{ flexWrap: "nowrap", height: "25px", paddingLeft: `${props.depth * 23}px` }}

                  {...(props.context.itemContainerWithoutChildrenProps as any)}
                  {...(props.context.interactiveElementProps as any)}
                  onClick={(e) => {
                    e.stopPropagation()

                    props.context.isFocused ? null : props.context.focusItem()

                    if (e.shiftKey) {
                      props.context.selectUpTo()
                    } else if (e.ctrlKey) {
                      props.context.isSelected ? props.context.unselectItem() : props.context.addToSelectedItems()
                    } else {
                      props.context.selectItem()
                      props.item.hasChildren ? props.context.toggleExpandedState() : props.context.primaryAction()
                    }
                  }}
                  onFocus={() => { }}
                >
                  {/* render arrow */}
                  {props.item.hasChildren ? props.arrow : <img className='icon-xs' src={''}></img>}

                  {/* render icon */}
                  <div className='icon-pages icon-xs'></div>
                  {false && <img
                    className='icon-xs'
                    src={
                      props.item.hasChildren ?
                        (props.context.isExpanded ? icons.FOLDER_OPEN : icons.FOLDER_CLOSE) :
                        icons.HTML/* this will be differet based on the file type */
                    }
                  >
                  </img>}

                  {/* render title */}
                  {props.title}
                </div>

                {/* render children */}
                {props.context.isExpanded ? <>
                  <div>
                    {props.children} {/* this calls the renderItemsContainer again */}
                  </div>
                </> : null}
              </li>
            </>
          },
        }}

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

    {/* ff name input modal */}
    <Dialog
      open={createFFModalOpen}
      onClose={() => { setCreateFFModalOpen(false) }}
    >
      <div className='background-primary'>
        <h5>Create a {creatingFFType}</h5>
        <p className='text-m'>Enter the folder or file name you want</p>
        <input
          className=''
          value={newFFName}
          onChange={(e) => {
            setNewFFName(e.target.value)
          }}
        ></input>
        <button className='background-secondary text-m' onClick={createFFNode}>Ok</button>
      </div>
    </Dialog>
  </>)
}