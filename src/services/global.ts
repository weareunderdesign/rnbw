import { TOsType } from '@_types/global';

/**
 * get the character for CR/LF from current os type
 * @param osType 
 * @returns 
 */
export const getLineBreaker = (osType: TOsType): string => {
  return osType === 'Windows' ? '\r\n' :
    osType === 'Mac' ? '\n' :
      osType === 'Linux' ? '\n' : ''
}
/**
 * get the cmd key for various os type
 * @param e 
 * @param osType 
 * @returns 
 */
export const getCommandKey = (e: KeyboardEvent | MouseEvent, osType: TOsType): boolean => {
  return osType === 'Windows' ? e.ctrlKey :
    osType === 'Mac' ? e.metaKey :
      osType === 'Linux' ? e.ctrlKey : false
}