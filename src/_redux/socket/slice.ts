import {
  Message,
  ResMessage,
} from '@_types/global';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

// import types
import * as Types from './types';

// initial state of reducer
const initialState: Types.SocketState = {
  pending: false,
  connected: false,
  inited: false,
}

// create the slice
const slice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    socketConnect(state, action: PayloadAction) {
      state.connected = true
    },
    socketDisconnect(state, action: PayloadAction) {
      state.connected = false
    },
    socketInit(state, action: PayloadAction) {
      state.inited = true
    },
    socketSendMessage(state, action: PayloadAction<Message>) {
      state.pending = true
      state.pendingRequest = action.payload
    },
    socketReceiveMessage(state, action: PayloadAction<ResMessage>) {
      state.pending = false
      state.pendingRequest = null
    },
  },
})

// export the actions and reducer
export const { socketConnect, socketDisconnect, socketInit, socketSendMessage, socketReceiveMessage } = slice.actions
export const SocketReducer = slice.reducer