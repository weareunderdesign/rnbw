import {
  all,
  fork,
} from 'redux-saga/effects';

import { TemplateSaga } from '@_redux/template';

export default function* rootSaga() {
  yield all([
    fork(TemplateSaga),
  ]);
}