import { TOsType } from '../types/global';

export const SystemDirectories: {
  [osType in TOsType]: { [name: string]: boolean }
} = {
  'Windows': {
    '$RECYCLE.BIN': true,
    'System Volume Information': true,
    'node_modules': true,
  },
  'Mac': {
    'node_modules': true,
  },
  'Linux': {
    'node_modules': true,
  },
}