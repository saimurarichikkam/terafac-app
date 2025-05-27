import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    messages: [],
    activeChatId: null,
  },
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    setActiveChatId: (state, action) => {
      state.activeChatId = action.payload;
    },
  },
});

export const { setMessages, setActiveChatId } = chatSlice.actions;
export default chatSlice.reducer;
