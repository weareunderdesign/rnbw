import { TOsType } from '../types/global';

export const SystemDirectories: {
  [osType in TOsType]: { [name: string]: boolean }
} = {
  'Windows': {
    '$RECYCLE.BIN': true,
    'System Volume Information': true,
    '.git': true,
    '.gitignore': true,
    'node_modules': true,
  },
  'Mac': {
    '.git': true,
    '.gitignore': true,
    'node_modules': true,
  },
  'Linux': {
    '.git': true,
    '.gitignore': true,
    'node_modules': true,
  },
}