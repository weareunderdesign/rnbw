import {
  all,
  fork,
} from 'redux-saga/effects';

import { TemplateSaga } from '@redux/template';

export default function* rootSaga() {
  yield all([
    fork(TemplateSaga),
  ]);
}