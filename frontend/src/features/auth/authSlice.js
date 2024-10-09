import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('token') || null,
  username: localStorage.getItem('username') || null,
  id: localStorage.getItem('id') || null,
  email: localStorage.getItem('email') || null,
  publicKey: localStorage.getItem('publicKey') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem('token', action.payload);
    },
    setUsername: (state, action) => {
      state.username = action.payload;
      localStorage.setItem('username', action.payload);
    },
    setId: (state, action) => {
      state.id = action.payload;
      localStorage.setItem('id', action.payload);
    },
    setEmail: (state, action) => {
      state.email = action.payload;
      localStorage.setItem('email', action.payload);
    },
    setPublicKey: (state, action) => {
      state.publicKey = action.payload;
      localStorage.setItem('publicKey', action.payload);
    },
    // This is the new function that sets all fields at once
    setAuthData: (state, action) => {
      const { token, username, id, email, publicKey } = action.payload;
      if (token) {
        state.token = token;
        localStorage.setItem('token', token);
      }
      if (username) {
        state.username = username;
        localStorage.setItem('username', username);
      }
      if (id) {
        state.id = id;
        localStorage.setItem('id', id);
      }
      if (email) {
        state.email = email;
        localStorage.setItem('email', email);
      }
      if (publicKey) {
        state.publicKey = publicKey;
        localStorage.setItem('publicKey', publicKey);
      }
    },
    clearAuth: (state) => {
      state.token = null;
      state.username = null;
      state.id = null;
      state.email = null;
      state.publicKey = null;
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('id');
      localStorage.removeItem('email');
      localStorage.removeItem('publicKey');
    },
  },
});

export const { setToken, setUsername, setId, setEmail, clearAuth, setPublicKey, setAuthData } = authSlice.actions;

export default authSlice.reducer;
