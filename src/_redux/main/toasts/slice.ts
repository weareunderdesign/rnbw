/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";
import { TToast } from "./types";

interface IToastState {
  records: TToast[];
}

const initialState: IToastState = {
  records: [],
};

const toastSlice = createSlice({
  name: "toasts",
  initialState,
  reducers: {
    removeToast: (state, action) => {
      state.records = state.records.filter((el) => el.id !== action.payload);
    },
    addToast: (state, action: PayloadAction<TToast>) => {
      console.log("Added Toast"),
      state.records.push({
        id: nanoid(),
        title: action.payload.title || action.payload.type,
        type: action.payload.type,
        message: action.payload.message,
        delayAnimation: action.payload.delayAnimation || false,
        onCloseToast: action.payload.onCloseToast,
      });
    },
    stopDelayAnimation: (state, action) => {
      state.records.map((el) => {
        if (el.id === action.payload) {
          return (el.delayAnimation = false);
        }
        return el;
      });
      console.log(state.records);
    },
  },
});
export const { removeToast, addToast, stopDelayAnimation } = toastSlice.actions;
export const toastReducer = toastSlice.reducer;
