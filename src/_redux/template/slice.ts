import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import * as TemplateTypes from './types';

const initialState: TemplateTypes.TemplateState = {
  pending: false,
}

const slice = createSlice({
  name: 'template',
  initialState,
  reducers: {
    templateFetchRequest(state, action: PayloadAction<TemplateTypes.TemplateFetchRequestPayload>) {
      state.pending = true
    },
    templateFetchResponse(state, action: PayloadAction<TemplateTypes.TemplateFetchResponsePayload>) {
      state.pending = false
      state.response = action.payload
    },
  },
})

export const { templateFetchRequest, templateFetchResponse } = slice.actions
export const TemplateReducer = slice.reducer