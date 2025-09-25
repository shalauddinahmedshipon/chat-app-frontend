import { create } from "zustand";
import {
  startConversationApi,
  getConversationsApi,
  getMessagesApi,
  sendMessageApi,
} from "../api/chat";

const useChatStore = create((set, get) => ({
  conversations: [],
  messages: [],
  activeConversation: null,

  fetchConversations: async () => {
    const res = await getConversationsApi();
    set({ conversations: res.data.data });
  },

  startConversation: async (providerId) => {
    const res = await startConversationApi(providerId);
    set({ activeConversation: res.data });
    return res.data;
  },

setActiveConversation: async (conversation) => {
  set({ activeConversation: conversation }); // store the full conversation
  await get().fetchMessages(conversation.id); // pass the ID to fetchMessages
},

fetchMessages: async (conversationId) => {
  if (!conversationId) return; // avoid calling API with undefined
  const res = await getMessagesApi(conversationId);
  set({ messages: res.data.data });
},


sendMessage: async (conversationId, content, file) => {
  const res = await sendMessageApi(conversationId, content, file);

  // append the new message to messages
  set((state) => ({
    messages: [...state.messages, res.data.data],
  }));
},

}));

export default useChatStore;
