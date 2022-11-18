import {
  collapseFFNode,
  expandFFNode,
  focusFFNode,
  selectFFNode,
  setRemoveFFNodes,
} from '@_redux/ff';
import {
  addFFNode,
  addWatchedFFNode,
  closeFFNode,
  removeFFNode,
  setCurrentFile,
  setGlobalError,
} from '@_redux/global';
import {
  socketConnect,
  socketDisconnect,
  socketInit,
  socketReceiveMessage,
  socketSendMessage,
} from '@_redux/socket';
import { getSubDirectoryUids } from '@_services/ff';
import { createMessage } from '@_services/global';
import {
  FFNode,
  FFNodeActionAddPayloadRes,
  FFNodeActionClosePayloadRes,
  FFNodeActionOpenPayloadRes,
  FFNodeActionReadPayloadRes,
  FFNodeActionRemovePayloadRes,
  FFNodeActionRes,
  FFNodeActionUpdatePayloadRes,
} from '@_types/ff';
import {
  Message,
  ResMessage,
} from '@_types/socket';
import { MiddlewareAPI } from '@reduxjs/toolkit';

export const socketMiddleware = (url: string) => {
  return (store: MiddlewareAPI<any, any>) => {
    const ws = new WebSocket(url) as WebSocket
    ws.onopen = (event) => {
      console.log('ws on')
      store.dispatch(socketConnect())
    }
    ws.onmessage = (event) => {
      const message: ResMessage = {
        ...JSON.parse(event.data)
      }
      console.log('ws in', message)

      // Message Handling
      if (message.header === 'e-message') {// Error Message
        const error = message.body
        alert(error.errorMessage)
        store.dispatch(setGlobalError(error.errorMessage))
        store.dispatch(socketReceiveMessage())
      } else if (message.header === 'f-message') {// Fedback Message handler
        store.dispatch(socketInit())
        store.dispatch(socketReceiveMessage())
      } else if (message.header === 'ff-message') {// Folder File Message handler
        const messageBody = message.body as FFNodeActionRes
        const { type } = messageBody

        if (type === 'add') {
          const payload = messageBody?.payload as FFNodeActionAddPayloadRes
          store.dispatch(addFFNode([payload]))
          store.dispatch(socketSendMessage({
            header: 'ff-message',
            body: {
              type: 'open',
              payload: payload,
            },
          }))
        } else if (type === 'remove') {
          const payload = messageBody?.payload as FFNodeActionRemovePayloadRes
          store.dispatch(removeFFNode(payload))
          store.dispatch(setRemoveFFNodes(payload))
        } else if (type === 'open') {
          const payload = messageBody?.payload as FFNodeActionOpenPayloadRes
          store.dispatch(addFFNode(payload))
          store.dispatch(focusFFNode(payload[0].uid))
          store.dispatch(selectFFNode([payload[0].uid]))
          store.dispatch(expandFFNode([payload[0].uid]))
        } else if (type === 'close') {
          const payload = messageBody?.payload as FFNodeActionClosePayloadRes
          store.dispatch(collapseFFNode(payload))
          store.dispatch(closeFFNode(payload))
        } else if (type === 'read') {
          const payload = messageBody?.payload as FFNodeActionReadPayloadRes
          store.dispatch(setCurrentFile(payload))
        } else if (type === 'rename') {
          /* const payload = messageBody?.payload as FFNodeActionRenamePayloadRes
          store.dispatch(renameFFNode(payload))
          store.dispatch(setRenamedFFNodes(payload)) */
        }
        /* ******************************* */
        else if (type === 'move') {
        } else if (type === 'duplicate') {
        } else if (type === 'create') {
        } else if (type === 'delete') {
        }
        /* ******************************* */
        else if (type === 'update') {
          const payload = messageBody?.payload as FFNodeActionUpdatePayloadRes
          store.dispatch(setCurrentFile(payload))
        }

        store.dispatch(socketReceiveMessage())
      } else if (message.header === 'ff-watch-message') {
        const { type, payload } = message.body

        if (type === 'rename') {
          const node: FFNode = payload
          store.dispatch(addWatchedFFNode(node))
        } else if (type === 'remove') {
          const uid = payload
          const workspace = store.getState().global.workspace
          store.dispatch(socketSendMessage({
            header: 'ff-message',
            body: {
              type: 'remove',
              payload: getSubDirectoryUids(uid, workspace),
            }
          }))
        }
      }
    }
    ws.onerror = (event) => {
      console.log('ws error', event)
      // ws.close()
    }
    ws.onclose = (event) => {
      console.log('ws off')
      store.dispatch(socketDisconnect())
    }

    return (next: (action: any) => void) => (action: any) => {
      // We're acting on an action with type of socket/socketSendMessage.
      // Don't forget to check if the socket is in readyState == 1.
      // Other readyStates may result in an exception being thrown.
      if (action.type == 'socket/socketSendMessage' && ws.readyState === 1) {
        const message: Message = action.payload
        console.log('ws out', message)
        ws.send(createMessage(message))
      }

      return next(action)
    }
  }
}