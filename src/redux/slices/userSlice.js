// src/redux/slices/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: null,
  reducers: {
    loginUser: (state, action) => action.payload,
    logoutUser: () => null,
  },
});

export const { loginUser, logoutUser } = userSlice.actions;
export default userSlice.reducer;
