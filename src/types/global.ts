import {
  FFNodeAction,
  FFNodeActionRes,
} from './ff';

// global
export type UID = string
export type PATH = string
export type NAME = string

// invalid
export type NONE = null | undefined
export type UNKNOWN = 'unknown'
export type UNLINK = 'unlink'

// basic tree view node action
export type ADD = 'add'/* add new node */
export type REMOVE = 'remove'/* remove the node */

export type OPEN = 'open'/* expand */
export type CLOSE = 'close'/* collapse */

export type READ = 'read'/* primary action */
export type RENAME = 'rename'/* rename */

export type MOVE = 'move'/* cut/paste */
export type DUPLICATE = 'duplicate'/* copy/paste */

/* 
Web Socket Message
1. Header
2. Body
3. Options
*/

// 1. Header
export type FMessage = 'f-message' // feedback message for the first connect
export type FFMessage = 'ff-message' // folder file message - FFNode
export type FFWatchMessage = 'ff-watch-message' // folder file change message- FFNode
export type ErrorMessage = 'error-message' // error message
export type MessageHeader = FMessage | FFMessage | FFWatchMessage | ErrorMessage

// 2. Body
export type MessageBody = FFNodeAction | NONE

// 3. Options
export type MessageOptions =
  NONE
  | {
    isBroadcast?: boolean, // true if it's broadcasting message
  }

// Error Message
export type ErrorRes = {
  errorMessage: string,
}

// Message
export type Message = {
  header: MessageHeader,
  body?: MessageBody,
  options?: MessageOptions,
}

// Res Message
export type ResMessageBody = FFNodeActionRes | ErrorRes | NONE
export type ResMessage = {
  header: MessageHeader,
  body?: ResMessageBody,
  options?: MessageOptions,
}