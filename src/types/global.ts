/**
 * operating system type
 */
export type TOsType = 'Windows' | 'Mac'

/**
 * rinbow app theme
 */
export type TTheme = 'Light' | 'Dark' | 'System'

/**
 * toast type
 */
export type TToastType = 'success' | 'warning' | 'info' | 'error'

/**
 * toast
 */
export type TToast = {
  type: TToastType,
  title?: string,
  content: string,
}