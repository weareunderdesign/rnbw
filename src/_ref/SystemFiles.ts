import { TOsType } from '../types/global';

export const SystemFiles: {
  [osType in TOsType]: { [name: string]: boolean }
} = {
  'Windows': {
    '$RECYCLE.BIN': true,
    'System Volume Information': true,
    '.git': true,
  },
  'Mac': {},
  'Linux': {},
}