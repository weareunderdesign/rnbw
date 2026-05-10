import { configureStore } from "@reduxjs/toolkit";
import createReducer from "./rootReducer";

export default function configureAppStore(initialState = {}) {
  const store = configureStore({
    reducer: createReducer(),
    preloadedState: initialState,
    devTools: process.env.NODE_ENV !== "production",
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
  });

  return store;
}
