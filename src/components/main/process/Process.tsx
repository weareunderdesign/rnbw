import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {
  LogAllow,
  NodeInAppAttribName,
  NodeUidSplitter,
  RainbowAppName,
  RootNodeUid,
  StagePreviewPathPrefix,
} from '@_constants/main';
import {
  getSubNodeUidsByBfs,
  getValidNodeUids,
} from '@_node/apis';
import {
  parseFile,
  reloadLocalProject,
  serializeFile,
  TFileNodeData,
  writeFile,
} from '@_node/file';
import {
  parseHtmlCodePart,
  serializeHtml,
  THtmlNodeData,
  THtmlPageSettings,
  THtmlParserResponse,
} from '@_node/html';
import {
  TNode,
  TNodeTreeData,
  TNodeUid,
} from '@_node/types';
import {
  clearFNState,
  expandFNNode,
  fnSelector,
  focusFNNode,
  MainContext,
  navigatorSelector,
  selectFNNode,
  setCurrentFileContent,
} from '@_redux/main';
import {
  TFileInfo,
  TFileType,
} from '@_types/main';

import { ProcessProps } from './types';

export default function Process(props: ProcessProps) {
  const dispatch = useDispatch()
  // -------------------------------------------------------------- global state --------------------------------------------------------------
  const { file } = useSelector(navigatorSelector)
  const { focusedItem, expandedItems, expandedItemsObj, selectedItems, selectedItemsObj } = useSelector(fnSelector)
  const {
    // global action
    addRunningActions, removeRunningActions,
    // navigator
    workspace,
    project,
    // node actions
    activePanel, setActivePanel,
    clipboardData, setClipboardData,
    event, setEvent,
    // file tree view
    fsPending, setFSPending,
    ffTree, setFFTree, setFFNode,
    ffHandlers, setFFHandlers,
    ffHoveredItem, setFFHoveredItem,
    isHms, setIsHms,
    parseFileFlag,
    ffAction, setFFAction,
    currentFileUid, setCurrentFileUid,
    // node tree view
    fnHoveredItem, setFNHoveredItem,
    nodeTree, setNodeTree,
    validNodeTree, setValidNodeTree,
    nodeMaxUid, setNodeMaxUid,
    // stage view
    iframeLoading, setIFrameLoading,
    iframeSrc, setIFrameSrc,
    fileInfo, setFileInfo,
    needToReloadIFrame, setNeedToReloadIFrame,
    // code view
    codeEditing, setCodeEditing,
    codeChanges, setCodeChanges,
    tabSize, setTabSize,
    newFocusedNodeUid, setNewFocusedNodeUid,
    // processor
    updateOpt, setUpdateOpt,
    // references
    filesReferenceData, htmlReferenceData, cmdkReferenceData,
    // cmdk
    currentCommand, setCurrentCommand,
    cmdkOpen, setCmdkOpen,
    cmdkPages, setCmdkPages, cmdkPage,
    // other
    osType,
    theme,
    // toasts
    addMessage, removeMessage,
  } = useContext(MainContext)
  // -------------------------------------------------------------- sync --------------------------------------------------------------
  // service - get reference data for current file type
  const getReferenceData = useCallback((fileType: TFileType) => {
    return fileType === 'html' ? htmlReferenceData : htmlReferenceData
  }, [htmlReferenceData])
  // set app title
  useEffect(() => {
    if (file.uid === '') {
      window.document.title = RainbowAppName
    } else {
      const _file = ffTree[file.uid]
      if (!_file) return
      const fileData = _file.data as TFileNodeData
      if (ffTree[file.uid].data.type === 'html') {
        let _title = `${fileData.name}${fileData.ext}`
        Object.keys(nodeTree).map(uid => {
          const node = nodeTree[uid]
          const nodeData = node.data as THtmlNodeData
          if (nodeData.type === 'tag') {
            if (nodeData.name === 'title') {
              _title = nodeData.html.replace(/<[^>]*>/g, "")
              return;
            }
          }
        })
        window.document.title = _title
      }
      else { 
        window.document.title = `${fileData.name}${fileData.ext}`
      }
    }
  }, [file.uid, nodeTree, ffTree])
  // processor-updateOpt
  useEffect(() => {
    if (updateOpt.parse === true) {
      let onlyRenderViewState = false

      // parse file content
      let _nodeTree: TNodeTreeData = JSON.parse(JSON.stringify(nodeTree))
      let _nodeMaxUid = nodeMaxUid
      let _fileInfo: TFileInfo
      let _needToReloadIFrame = false
      let _newFocusedNodeUid = ''
      let refuse = false
      let tempFocusedItem = focusedItem
      // origin state
      if (!ffTree[file.uid]) {
        return
      }

      const _file = JSON.parse(JSON.stringify(ffTree[file.uid])) as TNode
      const fileData = _file.data as TFileNodeData

      if (updateOpt.from === 'file') {
        const parserRes = parseFile(fileData.type, file.content, getReferenceData(fileData.type), osType)
        const { formattedContent, contentInApp, tree, nodeMaxUid: newNodeMaxUid } = parserRes

        _nodeTree = tree
        _nodeMaxUid = Number(newNodeMaxUid)

        fileData.content = formattedContent
        fileData.contentInApp = contentInApp
        fileData.changed = fileData.content !== fileData.orgContent

        // reload iframe
        _needToReloadIFrame = true
      } else if (updateOpt.from === 'code' || updateOpt.from === 'stage') {
        if (fileData.type === 'html') {
          // detect seed node changed
          let seedNodeChanged = false
          for (const change of codeChanges) {
            const { uid } = change
            const node = _nodeTree[uid]
            if (node === undefined) continue
            if (uid === RootNodeUid || node.name === 'html' || node.name === 'head' || node.name === 'body') {
              seedNodeChanged = true
            }
          }
          if (seedNodeChanged) {
            let fileContent = file.content
            if (updateOpt.from === 'stage') {
              for (const change of codeChanges) {
                const { uid, content } = change
                const node = _nodeTree[uid]
                const nodeData = node.data as THtmlNodeData
                nodeData.html = content
              }
              // rebuild from new tree
              const { html: formattedContent } = serializeHtml(_nodeTree, htmlReferenceData, osType)
              fileContent = formattedContent
            }
            const parserRes = parseFile(fileData.type, fileContent, htmlReferenceData, osType, null, String(_nodeMaxUid) as TNodeUid)
            const { formattedContent, contentInApp, tree, nodeMaxUid: newNodeMaxUid } = parserRes

            _nodeTree = tree
            _nodeMaxUid = Number(newNodeMaxUid)

            fileData.content = formattedContent
            fileData.contentInApp = contentInApp
            fileData.changed = fileData.content !== fileData.orgContent

            // reload iframe
            _needToReloadIFrame = true
          } else {
            // side effects
            codeChanges.map(codeChange => {
              // ---------------------- node tree side effect ----------------------
              // parse code part
              // remove org nodes
              const o_node = _nodeTree[codeChange.uid] //original node (the node which was previously focused)
              let parserRes: THtmlParserResponse
              parserRes = parseHtmlCodePart(codeChange.content, htmlReferenceData, osType, String(_nodeMaxUid) as TNodeUid)
              const { formattedContent, tree, nodeMaxUid: newNodeMaxUid } = parserRes

              if (formattedContent == '') {
                return
              }
              _nodeMaxUid = Number(newNodeMaxUid)
            
              // if (codeChange.content !== formattedContent) refuse = true
              if (o_node === undefined) return
              const o_parentNode = _nodeTree[o_node.parentUid as TNodeUid]
              o_parentNode.children = o_parentNode.children.reduce((prev, cur) => {
                if (cur === codeChange.uid) {
                  prev.push(tree[RootNodeUid].children[0])
                } else {
                  prev.push(cur)
                }
                return prev
              }, [] as TNodeUid[])
              const o_uids = getSubNodeUidsByBfs(codeChange.uid, _nodeTree)
              o_uids.map(uid => {
                delete _nodeTree[uid]
              })
              // add new nodes / get valid node's uid list for iframe
              const uids = getSubNodeUidsByBfs(RootNodeUid, tree, false)
              const nodeUids: TNodeUid[] = []
              let _flag = false
              uids.map(uid => {
                const node = tree[uid]
                if (node.parentUid === RootNodeUid) {
                  !_flag && (_newFocusedNodeUid = uid)
                  _flag = true
                  node.parentUid = o_parentNode.uid
                }
                _nodeTree[uid] = JSON.parse(JSON.stringify(node))
                const nodeData = node.data as THtmlNodeData
                nodeData.valid && nodeUids.push(uid)
              })
              // ---------------------- iframe side effect ----------------------
              // build element to replace
              let nodeUidIndex = -1
              const divElement = document.createElement('div')
              if (o_node.name !== 'code' && o_node.name !== 'pre') {
                divElement.innerHTML = formattedContent
                const nodes: Node[] = [divElement.childNodes[0]]
                while (nodes.length) {
                  const node = nodes.shift() as Node
                  if (node === undefined) continue
                  if (node.nodeName === '#text') {
                    continue
                  }
                  if ((node as HTMLElement).tagName) {
                    (node as HTMLElement).setAttribute(NodeInAppAttribName, nodeUids[++nodeUidIndex])
                    node.childNodes.forEach((childNode) => {
                      nodes.push(childNode)
                    })
                  }
                }
                // replace element to iframe
                const element = document.querySelector('iframe')?.contentWindow?.window.document.querySelector(`[${NodeInAppAttribName}="${codeChange.uid}"]`)
                element?.parentElement?.insertBefore(divElement.childNodes[0], element.nextSibling)
                element?.remove()
              }
              else{
                let element = document.querySelector('iframe')?.contentWindow?.window.document.querySelector(`[${NodeInAppAttribName}="${codeChange.uid}"]`)
                if (element && tree['ROOT'].data) {
                  element?.setAttribute(NodeInAppAttribName, tree['ROOT'].children[0])
                  element.outerHTML = (tree['ROOT'].data as THtmlNodeData).htmlInApp
                }
              }
            })
            // rebuild from new tree
            const { html: formattedContent, htmlInApp: contentInApp } = serializeHtml(_nodeTree, htmlReferenceData, osType)
            fileData.content = formattedContent
            fileData.contentInApp = contentInApp
            fileData.changed = fileData.content !== fileData.orgContent
          }
        } else {
          // do nothing
        }

        updateOpt.from === 'code' && setCodeEditing(false)
      } else if (updateOpt.from === 'hms') {
        const _currentFile = ffTree[currentFileUid]
        const _currentFileData = _currentFile.data as TFileNodeData
        if (file.uid === currentFileUid && file.content === _currentFileData.contentInApp) {
          LogAllow && console.log('view state changed by hms')
          // no need to build new node tree
          onlyRenderViewState = true
        } else {
          LogAllow && console.log('file content changed by hms')
          // parse hms content keeping node uids
          const parserRes = parseFile(fileData.type, file.content, getReferenceData(fileData.type), osType, true, String(_nodeMaxUid) as TNodeUid)
          const { formattedContent, contentInApp, tree, nodeMaxUid: newNodeMaxUid } = parserRes

          _nodeTree = tree
          _nodeMaxUid = Number(newNodeMaxUid)

          fileData.content = formattedContent
          fileData.contentInApp = contentInApp
          fileData.changed = fileData.content !== fileData.orgContent
          while(!_nodeTree[tempFocusedItem]) {
            if (_nodeTree[tempFocusedItem] == undefined) break
            tempFocusedItem = _nodeTree[tempFocusedItem].parentUid as TNodeUid
          }
          if (file.uid !== currentFileUid) {
            _needToReloadIFrame = true
          } else {
            // refresh iframe if it has seed node changes
            const o_uids = getSubNodeUidsByBfs(RootNodeUid, nodeTree)
            for (const o_uid of o_uids) {
              const o_node = nodeTree[o_uid]
              const n_node = _nodeTree[o_uid]
              if (!n_node) {
                if (o_node.name === 'html' || o_node.name === 'head' || o_node.name === 'body') {
                  _needToReloadIFrame = true
                  break
                }
              }
            }

            // --------------------------- iframe side effects ---------------------------
            if (!_needToReloadIFrame) {
              // get deleted/changed uids
              const deletedUids: TNodeUid[] = []
              const _uidsToChange: TNodeUid[] = []
              const n_uids = getSubNodeUidsByBfs(RootNodeUid, _nodeTree)
              o_uids.map((o_uid, index) => {
                const o_node = nodeTree[o_uid]
                const o_nodeData = o_node.data as THtmlNodeData
                const n_uid = n_uids[index]
                const n_node = _nodeTree[n_uid]
                const n_nodeData = n_node?.data as THtmlNodeData
                if (o_uid !== n_uid && (o_nodeData.valid || n_nodeData?.valid)) {
                  deletedUids.push(o_uid)
                  o_node.name !== '!doctype' && _uidsToChange.push((o_nodeData.valid ? o_node.parentUid : n_node.parentUid) as TNodeUid)
                }
              })
              _uidsToChange.reverse()
              const uidsToChange = getValidNodeUids(nodeTree, _uidsToChange.filter(uid => nodeTree[uid]).reduce((prev, cur) => {
                if (!prev.length || prev[prev.length - 1] !== cur) {
                  prev.push(cur)
                }
                return prev
              }, [] as TNodeUid[]))

              // node tree view - this will affect to hms record
              // dispatch(updateFNTreeViewState({ deletedUids }))

              // iframe
              uidsToChange.map((uid) => {
                const n_node = _nodeTree[uid]
                const n_nodeData = n_node.data as THtmlNodeData
                // replace html in iframe
                const element = document.querySelector('iframe')?.contentWindow?.window.document.querySelector(`[${NodeInAppAttribName}="${uid}"]`)
                if (element?.tagName === 'HTML') {
                  element.innerHTML = n_nodeData.htmlInApp
                }
                else {
                  element ? element.outerHTML = n_nodeData.htmlInApp : null
                }
              })
            }
          }
          // onlyRenderViewState = true
        }
        if (tempFocusedItem !== focusedItem) {
          _newFocusedNodeUid = tempFocusedItem
        }
        else{
          _newFocusedNodeUid = focusedItem
        }
      } else {
        // do nothing
      }

      // if (refuse) {
      //   removeRunningActions(['processor-updateOpt'])
      //   return;
      // }

      // get file info from node tree
      if (fileData.type === 'html') {
        _fileInfo = {
          title: '',
          scripts: [],
          favicon: [],
        } as THtmlPageSettings
        // get html page settings
        Object.keys(_nodeTree).map(uid => {
          const node = _nodeTree[uid]
          const nodeData = node.data as THtmlNodeData
          if (nodeData.type === 'tag') {
            if (nodeData.name === 'title') {
              _fileInfo ? _fileInfo.title = node.uid : null
            } else if (nodeData.name === 'link' && nodeData.attribs.rel === 'icon' && nodeData.attribs.href) {
              _fileInfo && _fileInfo.favicon.push(nodeData.attribs.href)
            }
          } else if (nodeData.type === 'script') {
            _fileInfo && _fileInfo.scripts.push(node)
          }
        })
        // compare new file info with org file info
        if (!_needToReloadIFrame && fileInfo) {
          const _curScripts = _fileInfo.scripts
          const _orgScripts = fileInfo.scripts

          const curScripts: string[] = []
          const curScriptObj: { [uid: TNodeUid]: boolean } = {}
          _curScripts.map(script => {
            const attribs = (script.data as THtmlNodeData).attribs
            const uniqueStr = Object.keys(attribs)
              .filter(attrName => attrName !== NodeInAppAttribName)
              .sort((a, b) => a > b ? 1 : -1)
              .map(attrName => {
                return `${attrName}${NodeUidSplitter}${attribs[attrName]}`
              })
              .join(NodeUidSplitter)
            curScripts.push(uniqueStr)
            curScriptObj[uniqueStr] = true
          })

          const orgScripts: string[] = []
          const orgScriptObj: { [uid: string]: boolean } = {}
          _orgScripts.map(script => {
            const attribs = (script.data as THtmlNodeData).attribs
            const uniqueStr = Object.keys(attribs)
              .filter(attrName => attrName !== NodeInAppAttribName)
              .sort((a, b) => a > b ? 1 : -1)
              .map(attrName => {
                return `${attrName}${NodeUidSplitter}${attribs[attrName]}`
              })
              .join(NodeUidSplitter)
            orgScripts.push(uniqueStr)
            orgScriptObj[uniqueStr] = true
          })

          if (curScripts.length !== orgScripts.length) {
            _needToReloadIFrame = true
          } else {
            for (const script of curScripts) {
              if (!orgScriptObj[script]) {
                _needToReloadIFrame = true
                break
              }
            }
          }
        }
      } else {
        // do nothing
      }

      LogAllow && _needToReloadIFrame && console.log('need to refresh iframe')
      if (!onlyRenderViewState) {
        // update idb
        (async () => {
          setFSPending(true)
          try {
            const p_fileData = ffTree[_file.parentUid as TNodeUid].data as TFileNodeData
            const previewPath = `${p_fileData.path}/${StagePreviewPathPrefix}${fileData.name}${fileData.ext}`
            await writeFile(previewPath, fileData.contentInApp as string)
            if (fileData.type === 'html') {
              setIFrameSrc(`rnbw${previewPath}`)
            } else {
              // do nothing
            }
          } catch (err) {
          }
          setFSPending(false)
        })()
        // update context
        setFFNode(_file)
        addRunningActions(['processor-nodeTree'])
        setNodeTree(_nodeTree)
        setNodeMaxUid(_nodeMaxUid)
        setFileInfo(_fileInfo)
        setNeedToReloadIFrame(_needToReloadIFrame)
        // update redux
        updateOpt.from !== 'hms' && dispatch(setCurrentFileContent(fileData.contentInApp as string))
      }
      // select new focused node in code view
      setNewFocusedNodeUid(_newFocusedNodeUid)

      setUpdateOpt({ parse: null, from: updateOpt.from !== 'hms' ? null : updateOpt.from })
      // setUpdateOpt({ parse: null, from: null })
    } else if (updateOpt.parse === false) {
      // serialize node tree data
      const _nodeTree: TNodeTreeData = JSON.parse(JSON.stringify(nodeTree))
      const _file = JSON.parse(JSON.stringify(ffTree[file.uid])) as TNode
      const fileData = _file.data as TFileNodeData

      if (updateOpt.from === 'node') {
        const serializedRes = serializeFile(fileData.type, nodeTree, getReferenceData(fileData.type), osType)
        if (fileData.type === 'html') {
          const { html, htmlInApp } = serializedRes as THtmlNodeData
          // update ffTree
          fileData.content = html
          fileData.contentInApp = htmlInApp
          fileData.changed = fileData.content !== fileData.orgContent
        } else {
          // do nothing
        }
      }

      // update idb
      (async () => {
        setFSPending(true)
        try {
          await writeFile(fileData.path, fileData.contentInApp as string)
        } catch (err) {
        }
        setFSPending(false)
      })()
      // update context
      setFFNode(_file)
      addRunningActions(['processor-nodeTree'])
      setNodeTree(_nodeTree)
      // update redux
      dispatch(setCurrentFileContent(fileData.contentInApp as string))

      setUpdateOpt({ parse: null, from: updateOpt.from })
    } else {
      // do nothing
    }

    removeRunningActions(['processor-updateOpt'])
  }, [updateOpt, parseFileFlag])
  // processor-nodeTree
  useEffect(() => {
    if (!nodeTree[RootNodeUid]) return

    const _nodeTree: TNodeTreeData = JSON.parse(JSON.stringify(nodeTree))
    const _validNodeTree: TNodeTreeData = {}

    // build valid node tree
    const uids = getSubNodeUidsByBfs(RootNodeUid, _nodeTree)
    uids.reverse()
    uids.map((uid) => {
      const node = _nodeTree[uid]
      if (!node.data.valid) return

      node.children = node.children.filter((c_uid) => _nodeTree[c_uid].data.valid)
      node.isEntity = node.children.length === 0
      _validNodeTree[uid] = node
    })

    addRunningActions(['processor-validNodeTree'])
    setValidNodeTree(_validNodeTree)

    removeRunningActions(['processor-nodeTree'])
  }, [nodeTree])
  // processor-validNodeTree
  useEffect(() => {
    if (updateOpt.parse === null && (updateOpt.from === 'file' || updateOpt.from === null)) {
      // dispatch(clearFNState()) //Issue: #228
      const uids = Object.keys(validNodeTree)
      dispatch(expandFNNode(uids.slice(0, 50)))
      removeRunningActions(['processor-validNodeTree'], false)
    } else if (updateOpt.parse === null && updateOpt.from === 'code') {
      const _focusedItem = newFocusedNodeUid
      const _expandedItems = expandedItems.filter((uid) => {
        return validNodeTree[uid] !== undefined && validNodeTree[uid].isEntity === false
      })
      const _selectedItems = selectedItems.filter((uid) => {
        return validNodeTree[uid] !== undefined
      })
      dispatch(clearFNState())
      dispatch(focusFNNode(_focusedItem))
      dispatch(expandFNNode([..._expandedItems]))
      dispatch(selectFNNode([..._selectedItems, _focusedItem]))
      removeRunningActions(['processor-validNodeTree'], false)
    } else if (updateOpt.parse === null && updateOpt.from === 'node') {
      removeRunningActions(['processor-validNodeTree'], false)
    } else {
      removeRunningActions(['processor-validNodeTree'], false)
    }
  }, [validNodeTree])
  // -------------------------------------------------------------- cmdk --------------------------------------------------------------
  // command detect & do actions
  useEffect(() => {
    switch (currentCommand.action) {
      case 'Save':
        onSave()
        break
      default:
        return
    }
  }, [currentCommand])
  const onSave = useCallback(async () => {
    if (!ffTree[RootNodeUid]) return

    const _ffTree = JSON.parse(JSON.stringify(ffTree)) as TNodeTreeData

    addRunningActions(['process-save'])

    const uids = getSubNodeUidsByBfs(RootNodeUid, _ffTree)
    await Promise.all(uids.map(async (uid) => {
      if (file.uid === uid) {  /* only save current file */
        const node = _ffTree[uid]
        const nodeData = node.data as TFileNodeData
        if (nodeData.changed) {
          try {
            if (project.context === 'local') {
              const handler = ffHandlers[uid]
              const writableStream = await (handler as FileSystemFileHandle).createWritable()
              await writableStream.write(nodeData.content)
              await writableStream.close()
              nodeData.changed = false
              nodeData.orgContent = nodeData.content
            } else if (project.context === 'idb') {
              await writeFile(nodeData.path, nodeData.content)
              nodeData.changed = false
              nodeData.orgContent = nodeData.content
            }
          } catch (err) {
            addMessage({
              type: 'error',
              content: 'error occurred while saving',
            })
          }
        }
        const fileData = ffTree[file.uid].data as TFileNodeData
        if (fileData.ext === '.css' || fileData.ext === '.js') {
          reloadLocalProject(ffHandlers[RootNodeUid] as FileSystemDirectoryHandle, ffTree, osType, [file.uid])
          setNeedToReloadIFrame(true)
        }
      }
    }))

    setFFTree(_ffTree)

    removeRunningActions(['process-save'], false)
  }, [ffTree, ffHandlers, reloadLocalProject])

  return useMemo(() => {
    return <></>
  }, [])
}