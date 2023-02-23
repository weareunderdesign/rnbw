import { TOsType } from '@_types/global';

/**
 * get the character for CR/LF from current os type
 * @param osType 
 * @returns 
 */
export const getLineBreakCharacter = (osType: TOsType): string => {
  return osType === 'Windows' ? '\r\n' :
    osType === 'Mac' ? '\n' : ''
}

/**
 * get the cmd key for various os type
 * @param e 
 * @param osType 
 * @returns 
 */
export const getCommandKey = (e: KeyboardEvent, osType: TOsType): boolean => {
  return osType === 'Windows' ? e.ctrlKey :
    osType === 'Mac' ? e.metaKey : false
}

/**
 * get the file extension from the file name
 * @param fileName 
 * @returns 
 */
export const getFileExtension = (fileName: string) => {
  const arr: string[] = fileName.split('.')
  return arr.length === 1 ? '' : `.${arr.pop()}`
}