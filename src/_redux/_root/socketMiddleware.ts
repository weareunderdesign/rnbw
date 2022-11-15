import {
  collapseFFNode,
  expandFFNode,
} from '@_redux/ff';
import {
  addFFObject,
  addProject,
  addWatchedFFObject,
  removeFFObject,
  removeWatchedFFObject,
  renameFFNode,
  setCurrentFile,
  setGlobalError,
} from '@_redux/global';
import { createMessage } from '@_services/global';
import {
  FFNodeAction,
  FFNodeActionAddPayloadRes,
  FFNodeActionClosePayloadRes,
  FFNodeActionOpenPayloadRes,
  FFNodeActionReadPayloadRes,
  FFNodeActionRemovePayloadRes,
  FFNodeActionRenamePayloadRes,
  FFNodeActionUpdatePayloadRes,
  FFObject,
} from '@_types/ff';
import {
  ErrorRes,
  Message,
  ResMessage,
} from '@_types/global';
import { MiddlewareAPI } from '@reduxjs/toolkit';

import {
  socketConnect,
  socketDisconnect,
  socketInit,
  socketReceiveMessage,
  socketSendMessage,
} from '../socket/slice';

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
      if (message.header === 'error-message') {// Error Message
        const messageBody = message.body as ErrorRes
        const error = messageBody
        alert(error.errorMessage)
        store.dispatch(setGlobalError(error))
        store.dispatch(socketReceiveMessage(message))
      } else if (message.header === 'f-message') {// Fedback Message handler
        store.dispatch(socketInit())
        store.dispatch(socketReceiveMessage(message))
      } else if (message.header === 'ff-message') {// Folder File Message handler
        const messageBody = message.body as FFNodeAction
        const { type } = messageBody

        if (type === 'add') {
          const payload = messageBody?.payload as FFNodeActionAddPayloadRes
          store.dispatch(addProject(payload))
          store.dispatch(socketSendMessage({
            header: 'ff-message',
            body: {
              type: 'open',
              payload: payload,
            },
          }))
        } else if (type === 'remove') {
          const payload = messageBody?.payload as FFNodeActionRemovePayloadRes
          store.dispatch(removeFFObject([payload]))
        }

        else if (type === 'open') {
          const payload = messageBody?.payload as FFNodeActionOpenPayloadRes
          store.dispatch(addFFObject(payload))
          store.dispatch(expandFFNode(payload[0].uid))
        } else if (type === 'close') {
          const payload = messageBody?.payload as FFNodeActionClosePayloadRes
          store.dispatch(collapseFFNode(payload))
        }

        else if (type === 'read') {
          const payload = messageBody?.payload as FFNodeActionReadPayloadRes
          store.dispatch(setCurrentFile(payload))
        } else if (type === 'rename') {
          const payload = messageBody?.payload as FFNodeActionRenamePayloadRes
          store.dispatch(renameFFNode(payload))
        }

        else if (type === 'move') {
        } else if (type === 'duplicate') {
        }

        else if (type === 'create') {
          /* const payload = messageBody?.payload as FFNodeActionCreatePayloadRes
          store.dispatch(addFFObject(payload)) */
        } else if (type === 'delete') {
          /* const payload = messageBody?.payload as FFNodeActionDeletePayloadRes
          store.dispatch(removeFFObject(payload)) */
        }

        else if (type === 'update') {
          const payload = messageBody?.payload as FFNodeActionUpdatePayloadRes
          store.dispatch(setCurrentFile(payload))
        }

        store.dispatch(socketReceiveMessage(message))
      } else if (message.header === 'ff-watch-message') {
        const messageBody = message.body as FFNodeAction
        const { type } = messageBody

        if (type === 'rename') {
          const payload = messageBody?.payload as FFObject
          store.dispatch(addWatchedFFObject(payload))
        } else if (type === 'remove') {
          const payload = messageBody?.payload as FFObject
          store.dispatch(removeWatchedFFObject(payload))
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