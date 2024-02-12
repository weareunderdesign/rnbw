import { createInjectorsEnhancer } from "redux-injectors";
import createSagaMiddleware from "redux-saga";
import { StoreEnhancer, Tuple, configureStore } from "@reduxjs/toolkit";

import createReducer from "./rootReducer";
import rootSaga from "./rootSaga";

type Enhancers = ReadonlyArray<StoreEnhancer>;

export default function configureAppStore(initialState = {}) {
  const reduxSagaMonitorOptions = {};
  const sagaMiddleware = createSagaMiddleware(reduxSagaMonitorOptions);

  const { run: runSaga } = sagaMiddleware;
  const enhancers = [
    createInjectorsEnhancer({
      createReducer,
      runSaga,
    }),
  ];

  const store = configureStore({
    reducer: createReducer(),
    middleware: (getDefaultMiddlewares) =>
      getDefaultMiddlewares().concat(sagaMiddleware),
    preloadedState: initialState,
    devTools: process.env.NODE_ENV !== "production",
    enhancers: (getDefaultEnhancers) =>
      getDefaultEnhancers().concat(enhancers) as Tuple<Enhancers>,
  });

  sagaMiddleware.run(rootSaga);

  return store;
}
