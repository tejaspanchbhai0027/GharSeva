import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from './api';

// Thunks
export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ email, password, full_name, phone, role }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        full_name,
        phone,
        role,
      });
      return response.data; // e.g. { message: "Verification OTP sent.", email }
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Registration failed.');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async ({ email, code }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/verify-email', { email, code });
      return response.data; // e.g. { message: "Email verified successfully." }
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Verification failed.');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data; // e.g. { access_token, token_type, user: { user_id, email, ... } }
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Login failed.');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data; // e.g. { user_id, email, full_name, role }
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch profile.');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to send reset code.');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ email, otp_code, new_password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/reset-password', { email, otp_code, new_password });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Password reset failed.');
    }
  }
);

const initialState = {
  user: null,
  accessToken: localStorage.getItem('access_token') || null,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem('access_token');
      // Request backend to wipe cookies
      api.post('/auth/logout').catch(() => {});
    },
    refreshTokenSuccess: (state, action) => {
      state.accessToken = action.payload;
      localStorage.setItem('access_token', action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.accessToken = action.payload.access_token;
        state.user = action.payload.user;
        localStorage.setItem('access_token', action.payload.access_token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Load Me
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        localStorage.removeItem('access_token');
      });
  },
});

export const { logout, refreshTokenSuccess } = authSlice.actions;
export default authSlice.reducer;
