import { TOsType } from '../types/global';

export const SystemDirectories: {
  [osType in TOsType]: { [name: string]: boolean }
} = {
  'Windows': {
    '$RECYCLE.BIN': true,
    'System Volume Information': true,
    '.git': true,
  },
  'Mac': {
    '.git': true,
  },
  'Linux': {
    '.git': true,
  },
}