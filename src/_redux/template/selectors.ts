import { createSelector } from 'reselect';

import { AppState } from '@_redux/_root';

const getPending = (state: AppState) => state.template.pending
export const templateGetPendingSelector = createSelector(getPending, (pending) => pending)

const getResponse = (state: AppState) => state.template.response
export const templateGetResponseSelector = createSelector(getResponse, (response) => response)