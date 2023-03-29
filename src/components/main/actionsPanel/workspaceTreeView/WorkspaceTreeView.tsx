import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import cx from 'classnames';
import {
  FileSystemDirectoryHandle,
  FileSystemFileHandle,
  FileSystemHandle,
} from 'file-system-access';
import {
  CustomDirectoryPickerOptions,
} from 'file-system-access/lib/showDirectoryPicker';
import {
  DraggingPositionItem,
  TreeItem,
} from 'react-complex-tree';
import {
  useDispatch,
  useSelector,
} from 'react-redux';
import { Panel } from 'react-resizable-panels';

import {
  SVGIconI,
  SVGIconII,
  SVGIconIII,
  TreeView,
} from '@_components/common';
import { TreeViewData } from '@_components/common/treeView/types';
import {
  AddNodeActionPrefix,
  HmsClearActionType,
  LogAllow,
  ParsableFileTypes,
  RootNodeUid,
  TmpNodeUid,
} from '@_constants/main';
import {
  generateNodeUid,
  getNodeEntryName,
  getParentNodeUid,
  getValidNodeUids,
} from '@_node/apis';
import {
  _path,
  configProject,
  TFileNodeData,
} from '@_node/file';
import {
  TNode,
  TNodeTreeData,
  TNodeUid,
  TNormalNodeData,
} from '@_node/types';
import {
  clearMainState,
  collapseFFNode,
  expandFFNode,
  ffSelector,
  focusFFNode,
  globalSelector,
  MainContext,
  navigatorSelector,
  selectFFNode,
  setCurrentFile,
  setFileAction,
  TFileHandlerCollection,
} from '@_redux/main';
import {
  addClass,
  removeClass,
  verifyFileHandlerPermission,
} from '@_services/main';
import {
  TFileAction,
  TFileNodeType,
  TFileSystemType,
} from '@_types/main';

import { WorkspaceTreeViewProps } from './types';

export default function WorkspaceTreeView(props: WorkspaceTreeViewProps) {
  const dispatch = useDispatch()
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const {
    fsPending, setFSPending,
    // groupping action
    addRunningActions, removeRunningActions,

    // file tree view
    ffHoveredItem, setFFHoveredItem, ffHandlers, setFFHandlers, ffTree, setFFTree,

    // ndoe tree view
    fnHoveredItem, setFNHoveredItem, nodeTree, setNodeTree, validNodeTree, setValidNodeTree,

    // update opt
    updateOpt, setUpdateOpt,

    // ff hms
    isHms, setIsHms, ffAction, setFFAction,

    // cmdk
    currentCommand, setCurrentCommand, cmdkOpen, setCmdkOpen, cmdkPages, setCmdkPages, cmdkPage,

    // global
    addMessage, removeMessage,

    // reference
    htmlReferenceData, cmdkReferenceData,

    // active panel/clipboard
    activePanel, setActivePanel, clipboardData, setClipboardData,

    // os
    osType,

    // code view
    tabSize, setTabSize,

    // panel-resize
    panelResizing,

    // stage-view
    fileInfo, setFileInfo,
  } = useContext(MainContext)
  const { workspace, project, file } = useSelector(navigatorSelector)
  const { fileAction } = useSelector(globalSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(ffSelector)
  // -------------------------------------------------------------- node status --------------------------------------------------------------
  /*
    - invalid - can't do any actions on the nodes
    - temporary - don't display the nodes
  */
  const [invalidNodes, _setInvalidNodes] = useState<{ [uid: TNodeUid]: boolean }>({})
  const [temporaryNodes, _setTemporaryNodes] = useState<{ [uid: TNodeUid]: boolean }>({})
  const setInvalidNodes = useCallback((...uids: TNodeUid[]) => {
    const _invalidNodes = { ...invalidNodes }
    uids.map(uid => _invalidNodes[uid] = true)
    _setInvalidNodes(_invalidNodes)
  }, [invalidNodes])
  const removeInvalidNodes = useCallback((...uids: TNodeUid[]) => {
    const _invalidNodes = { ...invalidNodes }
    uids.map(uid => delete _invalidNodes[uid])
    _setInvalidNodes(_invalidNodes)
  }, [invalidNodes])
  const setTemporaryNodes = useCallback((...uids: TNodeUid[]) => {
    const _temporaryNodes = { ...temporaryNodes }
    uids.map(uid => _temporaryNodes[uid] = true)
    _setTemporaryNodes(_temporaryNodes)
  }, [temporaryNodes])
  const removeTemporaryNodes = useCallback((...uids: TNodeUid[]) => {
    const _temporaryNodes = { ...temporaryNodes }
    uids.map(uid => delete _temporaryNodes[uid])
    _setTemporaryNodes(_temporaryNodes)
  }, [temporaryNodes])
  // -------------------------------------------------------------- hms --------------------------------------------------------------
  const isRedo = useRef<boolean>(false)
  useEffect(() => {
    (async () => {
      if (isHms === null) return

      /**
       * undo if isHms = true
       * redo if isHms = false
       */
      if (isHms === true) {
        const { type, param1, param2 } = ffAction
        if (type === 'create') {
          _delete([param1])
        } else if (type === 'rename') {
          const { uid, parentUid } = param1
          const { orgName, newName } = param2
          const currentUid = generateNodeUid(parentUid, newName)
          setTemporaryNodes(currentUid)
          await _rename(currentUid, orgName)
          removeTemporaryNodes(currentUid)
        } else if (type === 'cut') {
          const _uids: { uid: TNodeUid, name: string }[] = param1
          const _targetUids: TNodeUid[] = param2

          const uids: TNodeUid[] = []
          const targetUids: TNodeUid[] = []

          _targetUids.map((targetUid, index) => {
            const { uid, name } = _uids[index]
            uids.push(generateNodeUid(targetUid, name))
            targetUids.push(getParentNodeUid(uid))
          })
          _cut(uids, targetUids)
        } else if (type === 'copy') {
          const _uids: { uid: TNodeUid, name: string }[] = param1
          const _targetUids: TNodeUid[] = param2

          const uids: TNodeUid[] = []
          _targetUids.map((targetUid, index) => {
            const { uid, name } = _uids[index]
            uids.push(generateNodeUid(targetUid, name))
          })
          _delete(uids)
        } else if (type === 'delete') {
        }
      } else {
        // wait until dispatch is done
        isRedo.current = !isRedo.current
        if (isRedo.current === true) return

        const { type, param1, param2 } = fileAction
        if (type === 'create') {
          _create(param1, param2)
        } else if (type === 'rename') {
          const { uid, parentUid } = param1
          const { orgName, newName } = param2
          setTemporaryNodes(uid)
          await _rename(uid, newName)
          removeTemporaryNodes(uid)
        } else if (type === 'cut') {
          const _uids: { uid: TNodeUid, name: string }[] = param1
          const targetUids: TNodeUid[] = param2

          const uids: TNodeUid[] = _uids.map((_uid) => _uid.uid)
          _cut(uids, targetUids)
        } else if (type === 'copy') {
          const _uids: { uid: TNodeUid, name: string }[] = param1
          const targetUids: TNodeUid[] = param2

          const uids: TNodeUid[] = []
          const names: string[] = []
          _uids.map((_uid) => {
            uids.push(_uid.uid)
            names.push(_uid.name)
          })
          _copy(uids, names, targetUids)
        } else if (type === 'delete') {
        }
      }

      setIsHms(null)
    })()
  }, [isHms, fileAction])

  const _create = useCallback(async (uid: TNodeUid, type: TFileNodeType) => {
    addRunningActions(['fileTreeView-create'])

    try {
      // validate parentNode
      const parentUid = getParentNodeUid(uid)
      const parentNode = ffTree[parentUid]
      if (parentNode === undefined) throw 'error'

      // verify handler permission
      const parentHandler = ffHandlers[parentUid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(parentHandler))) throw 'error'

      // create
      const entryName = getNodeEntryName(uid)
      if (type === '*folder') {
        await parentHandler.getDirectoryHandle(entryName, { create: true })
      } else { // file
        await parentHandler.getFileHandle(entryName, { create: true })
      }
    } catch (err) {
    }

    removeRunningActions(['fileTreeView-create'], false)
  }, [ffTree, ffHandlers])
  const _delete = useCallback(async (uids: TNodeUid[]) => {
    addRunningActions(['fileTreeView_delete'])
    setInvalidNodes(...uids)

    for (const uid of uids) {
      // validate node and parentNode
      const node: TNode = ffTree[uid]
      if (node === undefined) continue
      const parentNode: TNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) continue

      // verify handler permission
      const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(parentHandler))) continue

      // remove the entry
      try {
        await parentHandler.removeEntry(getNodeEntryName(uid), { recursive: true })
      } catch (err) {
      }
    }

    removeInvalidNodes(...uids)
    removeRunningActions(['fileTreeView_delete'], false)
  }, [setInvalidNodes, removeInvalidNodes, ffTree, ffHandlers])
  const _rename = useCallback(async (uid: TNodeUid, newName: string) => {
    addRunningActions(['fileTreeView-rename'])
    const newUid = generateNodeUid(getParentNodeUid(uid), newName)
    setTemporaryNodes(uid)
    setInvalidNodes(newUid)

    try {
      // validate
      const node = ffTree[uid]
      if (node === undefined || node.name === newName) throw 'error'
      const parentNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) throw 'error'

      /* verify handler permission */
      const handler = ffHandlers[uid] as FileSystemHandle, parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler))) throw 'error'

      // rename using moveFF api
      await moveFF(handler, parentHandler, parentHandler, newName)
    } catch (err) {
    }

    removeInvalidNodes(newUid)
    removeTemporaryNodes(uid)
    removeRunningActions(['fileTreeView-rename'], false)
  }, [setTemporaryNodes, removeTemporaryNodes, setInvalidNodes, removeInvalidNodes, ffTree, ffHandlers])
  const _cut = useCallback(async (uids: TNodeUid[], targetUids: TNodeUid[]) => {
    addRunningActions(['fileTreeView-move'])

    const _invalidNodes = { ...invalidNodes }

    await Promise.all(uids.map(async (uid, index) => {
      const targetUid = targetUids[index]

      // validate
      const node = ffTree[uid]
      if (node === undefined) return
      const parentNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) return
      if (ffTree[targetUid] === undefined) return

      // validate ff handlers
      const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle, targetHandler = ffHandlers[targetUid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler)) || !(await verifyFileHandlerPermission(targetHandler))) return

      // move using moveFF api
      const newUid = generateNodeUid(targetUid, handler.name)
      _invalidNodes[uid] = true
      _invalidNodes[newUid] = true
      setInvalidNodes(...Object.keys(_invalidNodes))
      try {
        await moveFF(handler, parentHandler, targetHandler, handler.name)
      } catch (err) {
      }
      delete _invalidNodes[uid]
      delete _invalidNodes[newUid]
      setInvalidNodes(...Object.keys(_invalidNodes))
    }))

    removeRunningActions(['fileTreeView-move'], false)
  }, [invalidNodes, setInvalidNodes, ffTree, ffHandlers])
  const _copy = useCallback(async (uids: TNodeUid[], names: string[], targetUids: TNodeUid[]) => {
    addRunningActions(['fileTreeView-duplicate'])

    const _invalidNodes = { ...invalidNodes }

    await Promise.all(uids.map(async (uid, index) => {
      const name = names[index]
      const targetUid = targetUids[index]

      // validate
      const node = ffTree[uid]
      if (node === undefined) return
      const parentNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) return
      if (ffTree[targetUid] === undefined) return

      // validate ff handlers
      const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle, targetHandler = ffHandlers[targetUid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler)) || !(await verifyFileHandlerPermission(targetHandler))) return

      // move using moveFF api
      const newUid = generateNodeUid(targetUid, name)
      _invalidNodes[uid] = true
      _invalidNodes[newUid] = true
      setInvalidNodes(...Object.keys(_invalidNodes))
      try {
        await moveFF(handler, parentHandler, targetHandler, name, true)
      } catch (err) {
      }
      delete _invalidNodes[uid]
      delete _invalidNodes[newUid]
      setInvalidNodes(...Object.keys(_invalidNodes))
    }))

    removeRunningActions(['fileTreeView-duplicate'], false)
  }, [invalidNodes, setInvalidNodes, ffTree, ffHandlers])
  // -------------------------------------------------------------- sync --------------------------------------------------------------
  // outline the hovered item
  const hoveredItemRef = useRef<TNodeUid>(ffHoveredItem)
  useEffect(() => {
    if (hoveredItemRef.current === ffHoveredItem) return

    const curHoveredElement = document.querySelector(`#FileTreeView-${hoveredItemRef.current.replace(/[\/.]/g, '-')}`)
    curHoveredElement?.setAttribute('class', removeClass(curHoveredElement.getAttribute('class') || '', 'outline'))
    const newHoveredElement = document.querySelector(`#FileTreeView-${ffHoveredItem.replace(/[\/.]/g, '-')}`)
    newHoveredElement?.setAttribute('class', addClass(newHoveredElement.getAttribute('class') || '', 'outline'))

    hoveredItemRef.current = ffHoveredItem
  }, [ffHoveredItem])
  // build fileTreeViewData
  const fileTreeViewData = useMemo(() => {
    const data: TreeViewData = {}
    for (const uid in ffTree) {
      const node: TNode = ffTree[uid]
      data[uid] = {
        index: uid,
        data: node,
        children: node.children,
        isFolder: !node.isEntity,
        canMove: uid !== RootNodeUid,
        canRename: uid !== RootNodeUid,
      }
    }
    return data
  }, [ffTree])
  // -------------------------------------------------------------- node view state handlers --------------------------------------------------------------
  const cb_focusNode = useCallback((uid: TNodeUid) => {
    // validate
    if (invalidNodes[uid] || focusedItem === uid || ffTree[uid] === undefined) {
      removeRunningActions(['fileTreeView-focus'], false)
      return
    }

    addRunningActions(['fileTreeView-focus'])
    dispatch(focusFFNode(uid))
    removeRunningActions(['fileTreeView-focus'])
  }, [addRunningActions, removeRunningActions, invalidNodes, focusedItem, ffTree])
  const cb_selectNode = useCallback((uids: TNodeUid[]) => {
    // validate
    let _uids = [...uids]
    _uids = _uids.filter((_uid) => {
      return !(ffTree[_uid] === undefined || invalidNodes[_uid])
    })
    if (_uids.length === 0) {
      removeRunningActions(['fileTreeView-select'], false)
      return
    }
    _uids = getValidNodeUids(ffTree, _uids)
    if (_uids.length === selectedItems.length) {
      let same = true
      for (const _uid of _uids) {
        if (selectedItemsObj[_uid] === undefined) {
          same = false
          break
        }
      }
      if (same) {
        removeRunningActions(['fileTreeView-select'], false)
        return
      }
    }

    addRunningActions(['fileTreeView-select'])
    dispatch(selectFFNode(_uids))
    removeRunningActions(['fileTreeView-select'])
  }, [addRunningActions, removeRunningActions, ffTree, invalidNodes, selectedItems, selectedItemsObj])
  const cb_expandNode = useCallback((uid: TNodeUid) => {
    // validate
    if (invalidNodes[uid] || ffTree[uid] === undefined || ffTree[uid].isEntity || expandedItemsObj[uid]) {
      removeRunningActions(['fileTreeView-expand'], false)
      return
    }

    addRunningActions(['fileTreeView-expand'])
    dispatch(expandFFNode([uid]))
    removeRunningActions(['fileTreeView-expand'])
  }, [addRunningActions, removeRunningActions, invalidNodes, ffTree, expandedItemsObj])
  const cb_collapseNode = useCallback((uid: TNodeUid) => {
    // validate
    if (invalidNodes[uid] || ffTree[uid] === undefined || ffTree[uid].isEntity || !expandedItemsObj[uid]) {
      removeRunningActions(['fileTreeView-collapse'], false)
      return
    }

    addRunningActions(['fileTreeView-collapse'])
    dispatch(collapseFFNode([uid]))
    removeRunningActions(['fileTreeView-collapse'])
  }, [addRunningActions, removeRunningActions, invalidNodes, ffTree, expandedItemsObj])
  // -------------------------------------------------------------- node actions handlers --------------------------------------------------------------
  const [initialFileToOpen, setInitialFileToOpen] = useState<TNodeUid>()
  useEffect(() => {
    if (initialFileToOpen && ffTree[initialFileToOpen] !== undefined) {
      setInitialFileToOpen(undefined)

      // focus/select/read the initial file
      addRunningActions(['fileTreeView-focus', 'fileTreeView-select', 'fileTreeView-read'])
      cb_focusNode(initialFileToOpen)
      cb_selectNode([initialFileToOpen])
      cb_readNode(initialFileToOpen)
    }
  }, [initialFileToOpen])
  const clearSession = useCallback(() => {
    dispatch(clearMainState())
    dispatch({ type: HmsClearActionType })
  }, [])
  const onImportProject = useCallback(async (fsType: TFileSystemType = 'local'): Promise<void> => {
    if (fsType === 'local') {
      // open directory picker and get the project directory handle
      let projectHandle: FileSystemHandle
      try {
        projectHandle = await showDirectoryPicker({ _preferPolyfill: false, mode: 'readwrite' } as CustomDirectoryPickerOptions)
      } catch (err) {
        return
      }

      setFSPending(true)

      // clear session
      clearSession()

      try {
        // configure idb on nohost
        const handlerObj = await configProject(projectHandle as FileSystemDirectoryHandle, osType)

        // sort by ASC directory/file
        Object.keys(handlerObj).map(uid => {
          const handler = handlerObj[uid]
          handler.children = handler.children.sort((a, b) => {
            return handlerObj[a].kind === 'file' && handlerObj[b].kind === 'directory' ? 1 :
              handlerObj[a].kind === 'directory' && handlerObj[b].kind === 'file' ? -1 :
                handlerObj[a].name > handlerObj[b].name ? 1 : -1
          })
        })

        // get/set the index/first html to be opened by default
        let firstHtmlUid: TNodeUid = '', indexHtmlUid: TNodeUid = ''
        handlerObj[RootNodeUid].children.map(uid => {
          const handler = handlerObj[uid]
          if (handler.kind === 'file' && handler.ext === '.html') {
            firstHtmlUid === '' ? firstHtmlUid = uid : null
            handler.name === 'index' ? indexHtmlUid = uid : null
          }
        })
        setInitialFileToOpen(indexHtmlUid !== '' ? indexHtmlUid : firstHtmlUid !== '' ? firstHtmlUid : undefined)

        // set ff-tree, ff-handlers
        const treeViewData: TNodeTreeData = {}
        const ffHandlerObj: TFileHandlerCollection = {}
        Object.keys(handlerObj).map(uid => {
          const { parentUid, children, path, kind, name, ext, content, handler } = handlerObj[uid]
          const type = ParsableFileTypes[ext || ''] ? ext?.slice(1) : 'unknown'
          treeViewData[uid] = {
            uid,
            parentUid: parentUid,
            name: name,
            isEntity: kind === 'file',
            children: [...children],
            data: {
              valid: true,
              path: path,
              kind: kind,
              name: name,
              ext: ext,
              type,
              orgContent: type !== 'unknown' ? content?.toString() : '',
              content: type !== 'unknown' ? content?.toString() : '',
              changed: false,
            } as TFileNodeData,
          } as TNode

          ffHandlerObj[uid] = handler
        })

        setFFTree(treeViewData)
        setFFHandlers(ffHandlerObj)

        setFSPending(false)
      } catch (err) {
        LogAllow && console.log('import project err', err)
      }
    } else if (fsType === '') {
      // do nothing
    }
  }, [clearSession, osType])

  const moveFF = async (handler: FileSystemHandle, parentHandler: FileSystemDirectoryHandle, targetHandler: FileSystemDirectoryHandle, newName: string, copy: boolean = false, showWarning: boolean = false) => {
    if (handler.kind === 'directory') {
      // validate if the new name exists
      let exists = true
      try {
        await targetHandler.getDirectoryHandle(newName, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }
      if (exists) {
        showWarning && addMessage({
          type: 'error',
          content: 'Folder with the same name already exists.',
        })
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
      let exists = true
      try {
        await targetHandler.getFileHandle(newName, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }
      if (exists) {
        showWarning && addMessage({
          type: 'error',
          content: 'File with the same name already exists.',
        })
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

  const createTmpFFNode = useCallback((ffNodeType: TFileNodeType) => {
    const tmpTree = JSON.parse(JSON.stringify(ffTree))

    // validate
    const node = tmpTree[focusedItem]
    if (node === undefined || node.isEntity) return

    // expand the focusedItem
    node.uid !== RootNodeUid && expandedItemsObj[node.uid] === undefined && dispatch(expandFFNode([node.uid]))

    // add tmp node
    const tmpNode: TNode = {
      uid: `${node.uid}/${TmpNodeUid}`,
      parentUid: node.uid,
      name: '',
      isEntity: ffNodeType !== '*folder',
      children: [],
      data: {
        valid: false,
        type: ffNodeType,
      },
    }

    node.children.unshift(tmpNode.uid)
    tmpTree[tmpNode.uid] = tmpNode
    setFFTree(tmpTree)

    setInvalidNodes(tmpNode.uid)
  }, [ffTree, focusedItem, expandedItemsObj])
  const createFFNode = useCallback(async (parentUid: TNodeUid, ffType: TFileNodeType, ffName: string) => {
    addRunningActions(['fileTreeView-create'])

    // validate
    const parentHandler = ffHandlers[parentUid] as FileSystemDirectoryHandle
    if (!(await verifyFileHandlerPermission(parentHandler))) {
      addMessage({
        type: 'error',
        content: `Invalid target directory. Check if you have "write" permission for the directory.`,
      })
      removeRunningActions(['fileTreeView-create'], false)
      return
    }

    // new name
    let newName: string = ''

    if (ffType === '*folder') {
      // generate new folder name - ex: {aaa - copy}...
      let folderName = ffName
      let exists = true
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

      // create the directory with generated name
      try {
        await parentHandler.getDirectoryHandle(folderName, { create: true })
      } catch (err) {
        addMessage({
          type: 'error',
          content: 'Error occurred while creating a new folder.',
        })
        removeRunningActions(['fileTreeView-create'], false)
        return
      }
    } else { // file
      // generate new file name - ex: {aaa - copy}...
      let fileName = `${ffName}.${ffType}`
      let exists = true
      try {
        await parentHandler.getFileHandle(`${ffName}.${ffType}`, { create: false })
        exists = true
      } catch (err) {
        exists = false
      }

      if (exists) {
        let index = 0
        while (exists) {
          const _fileName = `${ffName} (${++index}).${ffType}`
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

      // create the file with generated name
      try {
        await parentHandler.getFileHandle(fileName, { create: true })
      } catch (err) {
        addMessage({
          type: 'error',
          content: 'Error occurred while creating a new file.',
        })
        removeRunningActions(['fileTreeView-create'], false)
        return
      }
    }

    const action: TFileAction = {
      type: 'create',
      param1: `${parentUid}/${newName}`,
      param2: ffType,
    }
    dispatch(setFileAction(action))

    removeRunningActions(['fileTreeView-create'])
  }, [addRunningActions, removeRunningActions, ffHandlers])

  const cb_startRenamingNode = useCallback((uid: TNodeUid) => {
    // validate
    if (invalidNodes[uid]) {
      removeInvalidNodes(uid)
      return
    }
    setInvalidNodes(uid)
  }, [invalidNodes, setInvalidNodes, removeInvalidNodes])
  const cb_abortRenamingNode = useCallback((item: TreeItem) => {
    const node = item.data as TNode
    const nodeData = node.data as TFileNodeData
    if (!nodeData.valid) {
      const tmpTree = JSON.parse(JSON.stringify(ffTree))
      tmpTree[node.parentUid as TNodeUid].children = tmpTree[node.parentUid as TNodeUid].children.filter((c_uid: TNodeUid) => c_uid !== node.uid)
      delete tmpTree[item.data.uid]
      setFFTree(tmpTree)
    }
    removeInvalidNodes(node.uid)
  }, [ffTree, removeInvalidNodes])
  const _cb_renameNode = useCallback(async (uid: TNodeUid, newName: string, ext: string) => {
    // validate
    const node = ffTree[uid]
    if (node === undefined || node.name === newName) return
    const parentNode = ffTree[node.parentUid as TNodeUid]
    if (parentNode === undefined) return

    addRunningActions(['fileTreeView-rename'])

    // verify handler permission
    const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
    if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler))) {
      addMessage({
        type: 'error',
        content: `Invalid directory/file. Check if you have "write" permission for the directory/file.`,
      })

      removeRunningActions(['fileTreeView-rename'], false)
      return
    }

    // rename using moveFF api
    const nodeData = node.data as TFileNodeData
    const _orgName = ext === '*folder' ? `${node.name}` : `${node.name}${nodeData.ext}`
    const _newName = ext === '*folder' ? `${newName}` : `${newName}${ext}`

    const newUid = `${parentNode.uid}/${_newName}`
    setInvalidNodes(newUid)

    try {
      await moveFF(handler, parentHandler, parentHandler, _newName, false, true)
    } catch (err) {
      addMessage({
        type: 'error',
        content: 'Error occurred while renaming ...',
      })

      removeInvalidNodes(newUid)
      removeRunningActions(['fileTreeView-rename'], false)
      return
    }
    removeInvalidNodes(newUid)

    const action: TFileAction = {
      type: 'rename',
      param1: { uid, parentUid: parentNode.uid },
      param2: { orgName: _orgName, newName: _newName },
    }
    dispatch(setFileAction(action))

    removeRunningActions(['fileTreeView-rename'])
  }, [addRunningActions, removeRunningActions, setInvalidNodes, removeInvalidNodes, ffTree, ffHandlers])
  const cb_renameNode = useCallback(async (item: TreeItem, newName: string) => {
    const node = item.data as TNode
    const nodeData = node.data as TNormalNodeData

    if (!invalidNodes[node.uid]) return

    if (nodeData.valid) {
      // confirm changed file before renaming
      const _file = ffTree[node.uid]
      const _fileData = _file.data as TFileNodeData
      if (_file && _fileData.changed) {
        // confirm
        const message = `Do you want to save the changes you made to ${_file.name} before renaming? Your changes will be lost if you don't save them.`
        if (window.confirm(message)) {
          await (async () => {
            // get the current file handler
            const handler = ffHandlers[_file.uid]
            if (handler === undefined) return

            setFSPending(true)

            // validate
            if (!(await verifyFileHandlerPermission(handler))) {
              addMessage({
                type: 'error',
                content: 'save failed cause of invalid handler',
              })
              setFSPending(false)
              return
            }

            // update file content
            try {
              const writableStream = await (handler as FileSystemFileHandle).createWritable()
              await writableStream.write(_fileData.content)
              await writableStream.close()

              addMessage({
                type: 'success',
                content: 'Saved successfully',
              })
            } catch (err) {
              addMessage({
                type: 'error',
                content: 'error occurred while saving',
              })
            }

            setFSPending(false)
          })()
        }
      }

      setTemporaryNodes(_file.uid)
      await _cb_renameNode(_file.uid, newName, _fileData.kind === 'directory' ? '*folder' : _fileData.ext)
      removeTemporaryNodes(_file.uid)
    } else {
      await createFFNode(node.parentUid as TNodeUid, nodeData.type, newName)

      const tmpTree = JSON.parse(JSON.stringify(ffTree))
      tmpTree[node.parentUid as TNodeUid].children = tmpTree[node.parentUid as TNodeUid].children.filter((c_uid: TNodeUid) => c_uid !== node.uid)
      delete tmpTree[node.uid]
      setFFTree(tmpTree)
    }
    removeInvalidNodes(node.uid)
  }, [invalidNodes, _cb_renameNode, setTemporaryNodes, removeTemporaryNodes, ffTree, ffHandlers, osType, createFFNode, removeInvalidNodes])

  const cb_deleteNode = useCallback(async () => {
    // validate
    const uids = selectedItems.filter(uid => !invalidNodes[uid])
    if (uids.length === 0) return

    // confirm msgbox
    const message = `Are you sure you want to delete them? This action cannot be undone!`
    if (!window.confirm(message)) return

    addRunningActions(['fileTreeView-delete'])
    setInvalidNodes(...uids)

    let allDone = true
    await Promise.all(uids.map(async (uid) => {
      // validate
      const node = ffTree[uid]
      if (node === undefined) {
        allDone = false
        return
      }
      const nodeData = node.data as TFileNodeData
      const parentNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) {
        allDone = false
        return
      }
      const parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(parentHandler))) {
        allDone = false
        return
      }

      // delete
      try {
        const entryName = nodeData.kind === 'directory' ? nodeData.name : `${nodeData.name}${nodeData.ext}`
        await parentHandler.removeEntry(entryName, { recursive: true })
      } catch (err) {
        allDone = false
      }
    }))

    if (!allDone) {
      addMessage({
        type: 'warning',
        content: 'Some directory/file couldn\'t be deleted.',
      })
    }

    removeInvalidNodes(...uids)
    removeRunningActions(['fileTreeView-delete'], false)
  }, [addRunningActions, removeRunningActions, invalidNodes, setInvalidNodes, removeInvalidNodes, selectedItems, ffTree, ffHandlers])
  const cb_moveNode = useCallback(async (uids: TNodeUid[], targetUid: TNodeUid, copy: boolean = false) => {
    // validate
    if (ffTree[targetUid] === undefined) return
    const validatedUids = getValidNodeUids(ffTree, uids, targetUid)
    if (validatedUids.length === 0) return

    addRunningActions(['fileTreeView-move'])

    // verify target handler permission
    const targetHandler = ffHandlers[targetUid] as FileSystemDirectoryHandle
    if (!(await verifyFileHandlerPermission(targetHandler))) {
      addMessage({
        type: 'error',
        content: `Invalid target directory. Check if you have "write" permission for the directory.`,
      })

      removeRunningActions(['fileTreeView-move'], false)
      return
    }

    let allDone = true
    const _uids: { uid: TNodeUid, name: string }[] = []
    const _invalidNodes = { ...invalidNodes }
    await Promise.all(validatedUids.map(async (uid) => {
      // validate
      const node = ffTree[uid]
      if (node === undefined) {
        allDone = false
        return
      }
      const parentNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) {
        allDone = false
        return
      }
      const handler = ffHandlers[uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler))) {
        allDone = false
        return
      }

      // generate new name
      let newName = handler.name
      if (copy) {
        if (handler.kind === 'directory') {
          const ffName = `${handler.name} copy`
          let folderName: string = ffName
          let exists: boolean

          try {
            await targetHandler.getDirectoryHandle(handler.name, { create: false })
            exists = true
          } catch (err) {
            exists = false
          }

          if (exists) {
            try {
              await targetHandler.getDirectoryHandle(ffName, { create: false })
              exists = true
            } catch (err) {
              exists = false
            }

            if (exists) {
              let index = 0
              while (exists) {
                const _folderName = `${ffName} (${++index})`
                try {
                  await targetHandler.getDirectoryHandle(_folderName, { create: false })
                  exists = true
                } catch (err) {
                  folderName = _folderName
                  exists = false
                }
              }
            }
            newName = folderName
          }
        } else {
          const nodeData = node.data as TFileNodeData
          const ext = nodeData.ext
          let name = `${node.name} copy`
          const ffName = `${name}${ext}`

          let fileName: string = ffName
          let exists: boolean = true

          try {
            await targetHandler.getFileHandle(handler.name, { create: false })
            exists = true
          } catch (err) {
            exists = false
          }

          if (exists) {
            try {
              await targetHandler.getFileHandle(ffName, { create: false })
              exists = true
            } catch (err) {
              exists = false
            }

            if (exists) {
              let index = 0
              while (exists) {
                const _fileName = `${name} (${++index})${ext}`
                try {
                  await targetHandler.getFileHandle(_fileName, { create: false })
                  exists = true
                } catch (err) {
                  fileName = _fileName
                  exists = false
                }
              }
            }
            newName = fileName
          }
        }
      }

      // update invalidNodes
      const newUid = `${targetUid}/${newName}`
      _invalidNodes[uid] = true
      _invalidNodes[newUid] = true
      setInvalidNodes(...Object.keys(_invalidNodes))

      // move
      try {
        await moveFF(handler, parentHandler, targetHandler, newName, copy)
        _uids.push({ uid, name: newName })
      } catch (err) {
        allDone = false
      }

      // update invalidNodes
      delete _invalidNodes[uid]
      delete _invalidNodes[newUid]
      setInvalidNodes(...Object.keys(_invalidNodes))
    }))

    if (!allDone) {
      addMessage({
        type: 'warning',
        content: 'Some directory/file couldn\'t be moved.',
      })
    }

    const action: TFileAction = {
      type: copy ? 'copy' : 'cut',
      param1: _uids,
      param2: _uids.map(() => targetUid),
    }
    dispatch(setFileAction(action))

    removeRunningActions(['fileTreeView-move'])
  }, [addRunningActions, removeRunningActions, invalidNodes, setInvalidNodes, ffTree, ffHandlers])
  const cb_duplicateNode = useCallback(async () => {
    // validate
    const uids = selectedItems.filter(uid => !invalidNodes[uid])
    if (uids.length === 0) return

    addRunningActions(['fileTreeView-duplicate'])

    let allDone = true
    const _uids: { uid: TNodeUid, name: string }[] = []
    const _targetUids: TNodeUid[] = []
    const _invalidNodes = { ...invalidNodes }
    await Promise.all(uids.map(async (uid) => {
      // validate
      const node = ffTree[uid]
      if (node === undefined) {
        allDone = false
        return
      }
      const parentNode = ffTree[node.parentUid as TNodeUid]
      if (parentNode === undefined) {
        allDone = false
        return
      }
      const handler = ffHandlers[node.uid], parentHandler = ffHandlers[parentNode.uid] as FileSystemDirectoryHandle
      if (!(await verifyFileHandlerPermission(handler)) || !(await verifyFileHandlerPermission(parentHandler))) {
        allDone = false
        return
      }

      // generate new name
      let newName = ''
      if (handler.kind === 'directory') {
        const ffName = `${handler.name} copy`
        let folderName = ffName
        let exists = true

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
        const nodeData = node.data as TFileNodeData
        const ext = nodeData.ext
        let name = `${node.name} copy`
        const ffName = `${name}${ext}`

        let fileName = ffName
        let exists = true

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

      // set invalid nodes
      const newUid = `${node.parentUid}/${newName}`
      _invalidNodes[uid] = true
      _invalidNodes[newUid] = true
      setInvalidNodes(...Object.keys(_invalidNodes))

      // duplicate
      try {
        await moveFF(handler, parentHandler, parentHandler, newName, true)
        _uids.push({ uid, name: newName })
        _targetUids.push(parentNode.uid)
      } catch (err) {
        allDone = false
      }

      // set invalid nodes
      delete _invalidNodes[uid]
      delete _invalidNodes[newUid]
      setInvalidNodes(...Object.keys(_invalidNodes))
    }))

    if (!allDone) {
      addMessage({
        type: 'warning',
        content: 'Some directory/file couldn\'t be duplicated.',
      })
    }

    const action: TFileAction = {
      type: 'copy',
      param1: _uids,
      param2: _targetUids,
    }
    dispatch(setFileAction(action))

    removeRunningActions(['fileTreeView-duplicate'])
  }, [addRunningActions, removeRunningActions, invalidNodes, setInvalidNodes, selectedItems, ffTree, ffHandlers])

  const cb_readNode = useCallback((uid: TNodeUid) => {
    addRunningActions(['fileTreeView-read'])

    // validate
    if (invalidNodes[uid]) {
      removeRunningActions(['fileTreeView-read'], false)
      return
    }
    const node = ffTree[uid]
    if (node === undefined || !node.isEntity || file.uid === uid) {
      removeRunningActions(['fileTreeView-read'], false)
      return
    }
    const nodeData = node.data as TFileNodeData
    if (nodeData.type === 'unknown') {
      removeRunningActions(['fileTreeView-read'], false)
      return
    }

    addRunningActions(['processor-updateOpt'])
    dispatch(setCurrentFile({ uid, content: nodeData.content }))
    setUpdateOpt({ parse: true, from: 'file' })

    removeRunningActions(['fileTreeView-read'])
  }, [addRunningActions, removeRunningActions, invalidNodes, ffTree, file.uid])
  // -------------------------------------------------------------- cmdk --------------------------------------------------------------
  useEffect(() => {
    if (currentCommand.action === '') return

    if (currentCommand.action === 'Open') {
      onImportProject()
    } else {
      if (activePanel !== 'file') return

      switch (currentCommand.action) {
        case 'Actions':
          onActions()
          break
        case 'Add':
          onAdd()
          break
        case 'Cut':
          onCut()
          break
        case 'Copy':
          onCopy()
          break
        case 'Paste':
          onPaste()
          break
        case 'Delete':
          onDelete()
          break
        case 'Duplicate':
          onDuplicate()
          break
        default:
          onAddNode(currentCommand.action)
          break
      }
    }
  }, [currentCommand])
  const onActions = useCallback(() => {
    if (cmdkOpen) return
    setCmdkPages(['Actions'])
    setCmdkOpen(true)
  }, [cmdkOpen])
  const onAdd = useCallback(() => {
    setCmdkPages([...cmdkPages, 'Add'])
    setCmdkOpen(true)
  }, [cmdkPages])
  const onDelete = useCallback(() => {
    cb_deleteNode()
  }, [cb_deleteNode])
  const onCut = useCallback(() => {
    setClipboardData({ panel: 'file', type: 'cut', uids: selectedItems })
  }, [selectedItems])
  const onCopy = useCallback(() => {
    setClipboardData({ panel: 'file', type: 'copy', uids: selectedItems })
  }, [selectedItems])
  const onPaste = useCallback(() => {
    if (clipboardData.panel !== 'file') return

    // validate
    if (invalidNodes[focusedItem]) return
    const uids = clipboardData.uids.filter(uid => !invalidNodes[uid])
    if (uids.length === 0) return

    if (clipboardData.type === 'cut') {
      setClipboardData({ panel: 'file', type: 'cut', uids: [] })
      cb_moveNode(uids, focusedItem)
    } else if (clipboardData.type === 'copy') {
      cb_moveNode(uids, focusedItem, true)
    }
  }, [clipboardData, invalidNodes, focusedItem, cb_moveNode])
  const onDuplicate = useCallback(() => {
    cb_duplicateNode()
  }, [cb_duplicateNode])
  const onAddNode = useCallback((actionName: string) => {
    if (actionName.startsWith(AddNodeActionPrefix)) {
      const nodeType = actionName.slice(AddNodeActionPrefix.length + 1)
      createTmpFFNode(nodeType === 'folder' ? '*folder' : nodeType as TFileNodeType)
    }
  }, [createTmpFFNode])
  // -------------------------------------------------------------- own --------------------------------------------------------------
  const panelSize = useMemo(() => 200 / window.innerHeight * 100, [])
  const onPanelClick = useCallback((e: React.MouseEvent) => {
    setActivePanel('file')
  }, [])

  return useMemo(() => {
    return <>
      <Panel defaultSize={panelSize} minSize={0}>
        <div
          id="FileTreeView"
          className={cx(
            'scrollable',
          )}
          style={{
            pointerEvents: panelResizing ? 'none' : 'auto',
          }}
          onClick={onPanelClick}
        >
          <TreeView
            width={'100%'}
            height={'auto'}

            info={{ id: 'file-tree-view' }}

            data={fileTreeViewData}
            focusedItem={focusedItem}
            expandedItems={expandedItems}
            selectedItems={selectedItems}

            renderers={{
              renderTreeContainer: (props) => {
                return <>
                  <ul {...props.containerProps}>
                    {props.children}
                  </ul>
                </>
              },
              renderItemsContainer: (props) => {
                return <>
                  <ul {...props.containerProps}>
                    {props.children}
                  </ul>
                </>
              },
              renderItem: (props) => {
                useEffect(() => {
                  const node = props.item.data as TNode
                  if (!node.data.valid) {
                    props.context.selectItem()
                    props.context.startRenamingItem()
                  }
                }, [])

                return <>
                  <li
                    className={cx(
                      props.context.isSelected && 'background-secondary',

                      props.context.isDraggingOver && '',
                      props.context.isDraggingOverParent && '',

                      props.context.isFocused && '',
                    )}
                    {...props.context.itemContainerWithChildrenProps}
                  >
                    <div
                      id={`FileTreeView-${props.item.index.toString().replace(/[\/|.]/g, '-')}`}
                      className={cx(
                        'justify-stretch',
                        'padding-xs',
                        'outline-default',

                        props.context.isSelected && 'background-tertiary outline-none',
                        !props.context.isSelected && props.context.isFocused && 'outline',

                        props.context.isDraggingOver && '',
                        props.context.isDraggingOverParent && '',

                        invalidNodes[props.item.data.uid] && 'opacity-m',
                      )}
                      style={{
                        flexWrap: "nowrap",
                        paddingLeft: `${props.depth * 10}px`,
                      }}
                      {...props.context.itemContainerWithoutChildrenProps}
                      {...props.context.interactiveElementProps}
                      onClick={(e) => {
                        e.stopPropagation()

                        // skip click-event from an inline rename input
                        const targetId = e.target && (e.target as HTMLElement).id
                        if (targetId === 'FileTreeView-RenameInput') {
                          return
                        }

                        addRunningActions(['fileTreeView-select'])
                        !props.context.isFocused && addRunningActions(['fileTreeView-focus'])
                        !e.shiftKey && !e.ctrlKey && addRunningActions(props.item.isFolder ? [props.context.isExpanded ? 'fileTreeView-collapse' : 'fileTreeView-expand'] : ['fileTreeView-read'])

                        !props.context.isFocused && props.context.focusItem()
                        e.shiftKey ? props.context.selectUpTo() :
                          e.ctrlKey ? (props.context.isSelected ? props.context.unselectItem() : props.context.addToSelectedItems()) : [
                            props.context.selectItem(),
                            props.item.isFolder ? props.context.toggleExpandedState() : props.context.primaryAction(),
                          ]

                        setActivePanel('file')
                      }}
                      onFocus={() => { }}
                      onMouseEnter={() => setFFHoveredItem(props.item.index as TNodeUid)}
                      onMouseLeave={() => setFFHoveredItem('' as TNodeUid)}
                    >
                      <div className="gap-xs padding-xs" style={{ width: 'fit-content' }}>
                        {props.arrow}

                        {props.item.isFolder ?
                          props.context.isExpanded ? <SVGIconI {...{ "class": "icon-xs" }}>folder</SVGIconI> : <SVGIconII {...{ "class": "icon-xs" }}>folder</SVGIconII>
                          : <SVGIconIII {...{ "class": "icon-xs" }}>page</SVGIconIII>}
                      </div>

                      {props.title}
                    </div>

                    {props.context.isExpanded ? <>
                      <div>
                        {props.children}
                      </div>
                    </> : null}
                  </li>
                </>
              },
              renderItemArrow: (props) => {
                return <>
                  {props.item.isFolder ?
                    props.context.isExpanded ? <SVGIconI {...{ "class": "icon-xs" }}>down</SVGIconI> : <SVGIconII {...{ "class": "icon-xs" }}>right</SVGIconII>
                    : <div className='icon-xs'></div>}
                </>
              },
              renderItemTitle: (props) => {
                return <>
                  <span
                    className='text-s justify-start gap-s'
                    style={{
                      width: "100%",
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}>
                    {props.title}
                    {ffTree[props.item.data.uid] && (ffTree[props.item.data.uid].data as TFileNodeData).changed &&
                      <div className="radius-s foreground-primary" style={{ width: "6px", height: "6px" }}></div>}
                  </span>
                </>
              },
              renderRenameInput: (props) => {
                return <>
                  <form
                    {...props.formProps}
                    className={'box'}
                  >
                    <input
                      id={'FileTreeView-RenameInput'}
                      {...props.inputProps}
                      ref={props.inputRef}
                      className={cx(
                        'text-s',
                      )}
                      style={{
                        outline: 'none',
                        margin: '0',
                        border: 'none',
                        padding: '0',
                        background: 'transparent',
                      }}
                      onChange={(e) => {
                        props.inputProps.onChange && props.inputProps.onChange(e)
                      }}
                      onBlur={(e) => {
                        props.inputProps.onBlur && props.inputProps.onBlur(e)
                        props.formProps.onSubmit && props.formProps.onSubmit(new Event('') as unknown as React.FormEvent<HTMLFormElement>)
                      }}
                    />
                    <button ref={props.submitButtonRef} className={'hidden'}></button>
                  </form>
                </>
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
                cb_startRenamingNode(item.index as TNodeUid)
              },
              onAbortRenamingItem: (item) => {
                cb_abortRenamingNode(item)
              },
              onRenameItem: (item, name) => {
                cb_renameNode(item, name)
              },

              onSelectItems: (items) => {
                cb_selectNode(items as TNodeUid[])
              },
              onFocusItem: (item) => {
                cb_focusNode(item.index as TNodeUid)
              },
              onExpandItem: (item) => {
                cb_expandNode(item.index as TNodeUid)
              },
              onCollapseItem: (item) => {
                cb_collapseNode(item.index as TNodeUid)
              },

              onPrimaryAction: (item) => {
                item.data.data.valid ? cb_readNode(item.index as TNodeUid) : removeRunningActions(['fileTreeView-read'], false)
              },

              onDrop: (items, target) => {
                const targetUid = (target as DraggingPositionItem).targetItem as TNodeUid
                if (invalidNodes[targetUid]) return
                const uids = items.map(item => item.index as TNodeUid).filter(uid => !invalidNodes[uid])
                if (uids.length === 0) return

                cb_moveNode(uids, targetUid)
              }
            }}
          />
        </div>
      </Panel>
    </>
  }, [
    panelSize, panelResizing, onPanelClick,
    ffTree, fileTreeViewData,
    focusedItem, selectedItems, expandedItems,
    addRunningActions, removeRunningActions,
    cb_startRenamingNode, cb_abortRenamingNode, cb_renameNode,
    cb_selectNode, cb_focusNode, cb_expandNode, cb_collapseNode, cb_readNode, cb_moveNode,
  ])
}