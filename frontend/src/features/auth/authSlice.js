import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('token') || null,
  username: localStorage.getItem('username') || null,
  id: localStorage.getItem('id') || null,
  email: localStorage.getItem('email') || null,
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
    clearAuth: (state) => {
      state.token = null;
      state.username = null;
      state.id = null;
      state.email = null;
      state.publicKey="";
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('id');
      localStorage.removeItem('email');
    },
  },
});

export const { setToken, setUsername, setId, setEmail, clearAuth, setPublicKey} = authSlice.actions;

export default authSlice.reducer;
