import { createSelector } from 'reselect';

import { AppState } from '@_redux/_root';

// connected selector
const socketGetConnected = (state: AppState) => state.socket.connected
export const socketGetConnectedSelector = createSelector(socketGetConnected, (connected) => connected)

// inited selector
const socketGetInited = (state: AppState) => state.socket.inited
export const socketGetInitedSelector = createSelector(socketGetInited, (inited) => inited)

// pending selector
const socketGetPending = (state: AppState) => state.socket.pending
export const socketGetPendingSelector = createSelector(socketGetPending, (pending) => pending)

// pendingRequest selector
const socketGetPendingRequest = (state: AppState) => state.socket.pendingRequest
export const socketGetPendingRequestSelector = createSelector(socketGetPendingRequest, (pendingRequest) => pendingRequest)
