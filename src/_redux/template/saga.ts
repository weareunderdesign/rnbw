import {
  all,
  put,
  takeLatest,
} from 'redux-saga/effects';

import { PayloadAction } from '@reduxjs/toolkit';

import {
  templateFetchRequest,
  templateFetchResponse,
} from './slice';
import { TemplateFetchRequestPayload } from './types';

async function* fetchRequest(action: PayloadAction<TemplateFetchRequestPayload>) {
  try {
    const response = {
      data: {
        success: (Math.random() > 0.5 ? true : false)
      }
    }
    if (response.data.success) {
      yield put(templateFetchResponse({ success: true, data: {} }));
    } else {
      yield put(templateFetchResponse({ success: false, error: 'errorMessage' }));
    }
  } catch (e: any) {
    yield put(templateFetchResponse({ success: false, error: e.message }));
  }
}

export function* TemplateSaga() {
  yield all([
    takeLatest(templateFetchRequest, fetchRequest),
  ]);
}