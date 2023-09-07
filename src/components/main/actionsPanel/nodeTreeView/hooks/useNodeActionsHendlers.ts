import { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';

import { AddNodeActionPrefix } from '@_constants/main';
import { getNodeChildIndex } from '@_node/index';
import { TNode, TNodeUid } from '@_node/types';
import { fnSelector, MainContext, navigatorSelector } from '@_redux/main';

import { useNodeActions } from './useNodeActions';

export const useNodeActionsHandlers = () => {

    const { file } = useSelector(navigatorSelector)
    const { focusedItem, selectedItems } = useSelector(fnSelector)
    const {
    // node actions
    clipboardData, setClipboardData,
    // file tree view
    ffTree,
    // node tree view
    nodeTree,
    validNodeTree, 
    // other
    theme: _theme,
    } = useContext(MainContext)
  
    const { cb_addNode, cb_removeNode, cb_duplicateNode, cb_copyNode, cb_copyNodeExternal, cb_moveNode} = useNodeActions();

    const onCut = useCallback(() => {
    if (selectedItems.length === 0) return
    let data: TNode[] = []
    for (let x in selectedItems) {
      if (validNodeTree[selectedItems[x]]) {
        data.push(validNodeTree[selectedItems[x]])
      }
    }
    setClipboardData({ panel: 'node', type: 'cut', uids: selectedItems, fileType: ffTree[file.uid].data.type, data: data, fileUid: file.uid, prevNodeTree: nodeTree })
    }, [selectedItems, ffTree[file.uid], nodeTree])
    
    const onCopy = useCallback(() => {
    if (selectedItems.length === 0) return
    let data: TNode[] = []
    for (let x in selectedItems) {
      if (validNodeTree[selectedItems[x]]) {
        data.push(validNodeTree[selectedItems[x]])
      }
    }
    setClipboardData({ panel: 'node', type: 'copy', uids: selectedItems, fileType: ffTree[file.uid].data.type, data: data, fileUid: file.uid, prevNodeTree: nodeTree })
    }, [selectedItems, ffTree[file.uid], nodeTree])
    
    const onPaste = useCallback(() => {
    if (clipboardData.panel !== 'node') return

    const uids = clipboardData.uids.filter(uid => !!validNodeTree[uid])
    const datas = clipboardData.data.filter(data => data.data.valid)
    const focusedNode = validNodeTree[focusedItem]
    
    if (focusedNode === undefined) return

    const parentNode = validNodeTree[focusedNode.parentUid as TNodeUid]

    if (parentNode === undefined) return

    const childIndex = getNodeChildIndex(parentNode, focusedNode)

    if (clipboardData.type === 'cut') {
      setClipboardData({ panel: 'unknown', type: null, uids: [], fileType: 'html', data: [], fileUid: '', prevNodeTree: {} })
      if (file.uid === clipboardData.fileUid) {
        cb_moveNode(uids, parentNode.uid, true, childIndex + 1)
      }
      else{
        cb_copyNodeExternal(datas, parentNode.uid, true, childIndex + 1)
      }
    } else {
      if (file.uid === clipboardData.fileUid) {
        cb_copyNodeExternal(datas, parentNode.uid, true, childIndex + 1)
      }
      else{
        cb_copyNodeExternal(datas, parentNode.uid, true, childIndex + 1)
      }
    }
    }, [clipboardData, validNodeTree, focusedItem, cb_moveNode, cb_copyNode, file.uid, cb_copyNodeExternal])
    
    const onDelete = useCallback(() => {
    if (selectedItems.length === 0) return
    cb_removeNode(selectedItems)
    }, [cb_removeNode, selectedItems])
    
    const onDuplicate = useCallback(() => {
    if (selectedItems.length === 0) return
    cb_duplicateNode(selectedItems)
    }, [cb_duplicateNode, selectedItems])
    
    const onTurnInto = useCallback(() => { }, [])
  
    const onGroup = useCallback(() => { }, [])
  
    const onUngroup = useCallback(() => { }, [])
  
    const onAddNode = useCallback((actionName: string) => {    
    const tagName = actionName.slice(AddNodeActionPrefix.length + 2, actionName.length - 1)
    cb_addNode(tagName)
  }, [cb_addNode])
    
    return { onCut, onCopy, onPaste, onDelete, onDuplicate, onTurnInto, onGroup, onUngroup, onAddNode };
}