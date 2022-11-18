/*
------------------------------------------------------------------------------------------
----------------------------Types for Web Socket Communication----------------------------
------------------------------------------------------------------------------------------
*/

/**
* types of messages we use in the app
*/
export type MessageType =
  'f-message'/* feedback message for the first connect of the socket */
  | 'ff-message'/* file-tree-view messages */
  | 'ff-watch-message'/* file-system-change messages */
  | 'e-message'/* error message */

/**
* message options
*/
export type MessageOptions = {
  isBroadcast?: boolean, // true if it's broadcasting message
}

/**
* request message body
*/
export type MessageBody = any

/**
* request message
*/
export type Message = {
  header: MessageType,
  body?: MessageBody,
  options?: MessageOptions,
}

/**
 * response message body
 */
export type ResMessageBody = any

/**
 * response message
 */
export type ResMessage = {
  header: MessageType,
  body?: ResMessageBody,
  options?: MessageOptions,
}