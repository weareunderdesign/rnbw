import { TOsType } from '@_types/global';

/**
 * get the character for CR/LF from current os type
 * @param osType 
 * @returns 
 */
export const getLineBreakCharacter = (osType: TOsType): string => {
  return osType === 'Windows' ? '\r\n' :
    'Mac' ? '\n' : ''
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