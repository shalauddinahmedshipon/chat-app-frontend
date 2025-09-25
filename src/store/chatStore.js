// src/store/chatStore.js
import { create } from "zustand";
import { io } from "socket.io-client";
import {
  startConversationApi,
  getConversationsApi,
  getMessagesApi,
  // keep sendMessageApi if you ever want to fallback to REST
} from "../api/chat";

const BACKEND_WS = "http://localhost:5000"; // change if needed

const useChatStore = create((set, get) => ({
  socket: null,
  conversations: [],
  messages: [],
  activeConversation: null,
  userId: null, // store current user id for convenience
  connected: false,

  // Initialize socket connection (call once after login / init)
  initSocket: (token, userId) => {
    if (!token) return;
    if (get().socket) return; // avoid duplicate socket

    const socket = io(BACKEND_WS, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      set({ connected: true, socket, userId });
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      set({ connected: false });
    });

    // ✅ Handle new messages without duplicates
  // ✅ Handle new messages without duplicates
socket.on("newMessage", (message) => {
  const active = get().activeConversation;

  set((state) => {
    let newMessages = [...state.messages];

    // Match temp message either by content or Base64 file
    const tempIndex = newMessages.findIndex(
      (m) =>
        m.id.startsWith("tmp-") &&
        (
          (m.content && m.content === message.content) ||
          (m.fileUrl && m.fileUrl.startsWith("data:"))
        )
    );

    if (tempIndex !== -1) {
      // Replace temp with real message
      newMessages[tempIndex] = message;
    } else if (active && active.id === message.conversationId) {
      // Append new message if no temp match
      newMessages = [...newMessages, message];
    }

    return { messages: newMessages };
  });

  // Update conversation preview + unread count
  const convs = get().conversations.slice();
  const idx = convs.findIndex((c) => c.id === message.conversationId);
  if (idx !== -1) {
    convs[idx] = {
      ...convs[idx],
      messages: [message, ...(convs[idx].messages?.slice(0) || [])],
      unreadCount:
        active && active.id === message.conversationId
          ? 0
          : (convs[idx].unreadCount || 0) + 1,
      updatedAt: message.createdAt,
    };
    set({ conversations: convs });
  }
});


    socket.on("connect_error", (err) => {
      console.warn("Socket connect_error", err.message);
    });

    set({ socket });
  },

  // Disconnect socket (on logout)
  disconnectSocket: () => {
    const s = get().socket;
    if (s) {
      s.disconnect();
      set({ socket: null, connected: false });
    }
  },

  // Fetch conversations
  fetchConversations: async (page = 1, limit = 20) => {
    try {
      const res = await getConversationsApi(page, limit);
      const payload = res.data || res;
      const convs = payload.data || payload;
      set({ conversations: convs });
    } catch (err) {
      console.error("fetchConversations", err);
    }
  },

  // Start conversation
  startConversation: async (providerId) => {
    try {
      const res = await startConversationApi(providerId);
      const conv = res.data || res;
      set((state) => ({ activeConversation: conv }));
      const s = get().socket;
      if (s && conv?.id) {
        s.emit("joinConversation", conv.id);
      }
      await get().fetchMessages(conv.id);
      return conv;
    } catch (err) {
      console.error("startConversation", err);
      throw err;
    }
  },

  // Set active conversation + join room
  setActiveConversation: async (conversation) => {
    if (!conversation) return;
    set({ activeConversation: conversation, messages: [] });

    const s = get().socket;
    if (s && conversation.id) {
      s.emit("joinConversation", conversation.id);
    }

    await get().fetchMessages(conversation.id);
  },

  // Fetch messages
  fetchMessages: async (conversationId, page = 1, limit = 50) => {
    if (!conversationId) return;
    try {
      const res = await getMessagesApi(conversationId, page, limit);
      const payload = res.data || res;
      const msgs = payload.data || payload;
      set({ messages: msgs });
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
      }));
    } catch (err) {
      console.error("fetchMessages", err);
    }
  },

 // src/store/chatStore.js
sendMessage: async (conversationId, content, file = null) => {
  const s = get().socket;
  const userId = get().userId;
  if (!s) return console.warn("Socket not connected");

  let fileBase64 = null;
  if (file) {
    fileBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const payload = {
    conversationId,
    senderId: userId,
    content,
    fileUrl: fileBase64, // send Base64 only for temp
  };

  const tempMessage = {
    id: "tmp-" + Date.now(),
    conversationId,
    senderId: userId,
    content,
    fileUrl: fileBase64,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  set((state) => ({ messages: [...state.messages, tempMessage] }));

  s.emit("sendMessage", payload);
},


}));

export default useChatStore;
