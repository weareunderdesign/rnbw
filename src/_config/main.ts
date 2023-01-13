export const FileSystemWatchInterval = 100 /* file system watch interval by msec */

export const HistoryStoreLimit = 1000000 /* history store limit count */

export const CodeViewSyncDelay = 1000 /* sync delay when you edit the code on Monaco-Editor */
export const FileAutoSaveInterval = 3 * 1000 /* file auto save interval by msec */

export const ToastDuration = 3000 /* toast message show duration by msec */

export const CmdkReference: string[][] = [
  // Name, Icon, Description, Keyboard Shorcut, Type
  ['cmdk', 'cmdk', '', 'cmd + k', 'Command'],

  ['Open', 'open', '', 'cmd + o', 'Command'],
  ['Save', 'save', '', 'cmd + s', 'Command'],

  ['Add', 'add', '', 'cmd + a', 'Command'],
  ['Cut', 'cut', '', 'cmd + x', 'Command'],
  ['Copy', 'copy', '', 'cmd + c', 'Command'],
  ['Paste', 'paste', '', 'cmd + v', 'Command'],
  ['Delete', 'delete', '', 'backspace', 'Command'],
  ['Duplicate', 'duplicate', '', '', 'Command'],
  ['Undo', 'undo', '', 'cmd + z', 'Command'],
  ['Redo', 'redo', '', 'cmd + shift + z', 'Command'],
  ['Design', '', '"""Design"" On/Off (hide panels)"', 'd', 'Command'],
  ['Play', '', '"""Play"" (Preview)"', 'p', 'Command'],
  ['Code', '', 'Open Code', 'c', 'Command'],
  ['Style', 'style', 'Add Style', 's', 'Command'],
  ['Text', 'text', 'Edit Text', 't', 'Command'],
  ['Select', '', '', 'cmd + click', ''],
]