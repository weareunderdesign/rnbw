import { TOsType } from '../types/global';

export const SystemDirectories: {
  [osType in TOsType]: { [name: string]: boolean }
} = {
  'Windows': {
    '$RECYCLE.BIN': true,
    'System Volume Information': true,
    '.git': true,
    '.gitignore': true,
  },
  'Mac': {
    '.git': true,
    '.gitignore': true,
  },
  'Linux': {
    '.git': true,
    '.gitignore': true,
  },
}