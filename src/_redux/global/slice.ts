import { createSlice } from '@reduxjs/toolkit';

// import types
import * as Types from './types';

// initial state of reducer
const initialState: Types.MainState = {
}

// create the slice
const slice = createSlice({
  name: 'global',
  initialState,
  reducers: {
  },
})

// export the actions and reducer
export const {
} = slice.actions

export const GlobalReducer = slice.reducer