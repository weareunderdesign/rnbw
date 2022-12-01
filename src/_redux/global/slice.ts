import {
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';

// import types
import * as Types from './types';

// initial state of reducer
const initialState: Types.MainState = {
  mainPageActoinGroupIndex: 0,
}

// create the slice
const slice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    /* main */
    setMainPageActionGroupIndex(state, action: PayloadAction) {
      state.mainPageActoinGroupIndex++
    },
  },
})

// export the actions and reducer
export const {
  /* main */
  setMainPageActionGroupIndex,
} = slice.actions

export const GlobalReducer = slice.reducer