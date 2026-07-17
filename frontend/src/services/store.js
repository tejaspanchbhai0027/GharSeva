import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { injectStore } from './api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Inject store to Axios api handler to access state directly
injectStore(store);
export default store;
