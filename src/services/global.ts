import { TOsType } from '@_types/global';

export const getLineBreaker = (osType: TOsType): string => {
  return osType === 'Windows' ? '\r\n' :
    osType === 'Mac' ? '\n' :
      osType === 'Linux' ? '\n' : ''
}
export const getCommandKey = (e: KeyboardEvent | MouseEvent, osType: TOsType): boolean => {
  return osType === 'Windows' ? e.ctrlKey :
    osType === 'Mac' ? e.metaKey :
      osType === 'Linux' ? e.ctrlKey : false
}