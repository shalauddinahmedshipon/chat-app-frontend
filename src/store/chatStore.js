// src/store/chatStore.js
import { create } from "zustand";
import { io } from "socket.io-client";
import {
  startConversationApi,
  getConversationsApi,
  getMessagesApi,
} from "../api/chat";

const BACKEND_WS = "http://localhost:5000"; // adjust for your environment

const useChatStore = create((set, get) => ({
  socket: null,
  conversations: [],
  messages: [],
  activeConversation: null,
  userId: null,
  connected: false,
  loadingConversations: false,

  initSocket: (token, userId) => {
    if (!token) return;
    if (get().socket) return;

    const socket = io(BACKEND_WS, {
      auth: { token, userId },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      set({ connected: true, socket, userId });
    });

    socket.on("disconnect", () => set({ connected: false }));

    socket.on("conversationUpdated", (payload) => {
      const myId = get().userId;
      const active = get().activeConversation;

      set((state) => {
        let convs = [...state.conversations];
        const idx = convs.findIndex((c) => c.id === payload.conversationId);
        const isActive = active && active.id === payload.conversationId;

        if (idx !== -1) {
          const existingMessages = convs[idx].messages || [];
          const lastMsgId = existingMessages[0]?.id;
          const alreadyExists = lastMsgId === payload.lastMessage.id;

          convs[idx] = {
            ...convs[idx],
            messages: alreadyExists
              ? existingMessages
              : [payload.lastMessage, ...existingMessages],
            unreadCount:
              payload.lastMessage.senderId === myId || isActive || alreadyExists
                ? convs[idx].unreadCount
                : (convs[idx].unreadCount || 0) + 1,
            updatedAt: payload.lastMessage.createdAt,
          };
        } else {
          convs.unshift({
            id: payload.conversationId,
            messages: [payload.lastMessage],
            unreadCount:
              payload.lastMessage.senderId === myId || isActive ? 0 : 1,
            updatedAt: payload.lastMessage.createdAt,
          });
        }

        convs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return { conversations: convs };
      });
    });

    socket.on("messagesRead", ({ conversationId, readerId }) => {
      set((state) => {
        const convs = state.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.senderId === readerId ? m : { ...m, isRead: true }
                ),
                unreadCount: 0,
              }
            : c
        );
        return { conversations: convs };
      });
    });

    socket.on("newMessage", (message) => {
      const active = get().activeConversation;
      const myId = get().userId;
      const isActive = active && active.id === message.conversationId;

      set((state) => {
        let newMessages = [...state.messages];

        const tempIndex = newMessages.findIndex(
          (m) =>
            m.id.startsWith("tmp-") &&
            ((m.content && m.content === message.content) ||
              (m.fileUrl && m.fileUrl.startsWith("data:")))
        );

        if (tempIndex !== -1) newMessages[tempIndex] = message;
        else if (isActive) newMessages.push(message);

        const convs = [...state.conversations];
        const idx = convs.findIndex((c) => c.id === message.conversationId);
        const existingMessages = convs[idx]?.messages || [];
        const lastMsgId = existingMessages[0]?.id;
        const alreadyExists = lastMsgId === message.id;

        if (idx !== -1) {
          convs[idx] = {
            ...convs[idx],
            messages: alreadyExists
              ? existingMessages
              : [message, ...existingMessages],
            unreadCount:
              message.senderId === myId || isActive || alreadyExists
                ? convs[idx].unreadCount
                : (convs[idx].unreadCount || 0) + 1,
            updatedAt: message.createdAt,
          };
        } else {
          convs.unshift({
            id: message.conversationId,
            messages: [message],
            unreadCount: message.senderId === myId || isActive ? 0 : 1,
            updatedAt: message.createdAt,
          });
        }

        convs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return { messages: newMessages, conversations: convs };
      });
    });

    socket.on("connect_error", (err) => console.warn("Socket error:", err.message));

    set({ socket });
  },

  disconnectSocket: () => {
    const s = get().socket;
    if (s) s.disconnect();
    set({ socket: null, connected: false });
  },

  fetchConversations: async (page = 1, limit = 20) => {
    set({ loadingConversations: true });
    try {
      const res = await getConversationsApi(page, limit);
      const convs = res.data?.data || res.data || res;
      set({ conversations: convs, loadingConversations: false });
    } catch (err) {
      console.error("fetchConversations error:", err);
      set({ loadingConversations: false });
    }
  },

  startConversation: async (providerId) => {
    try {
      const res = await startConversationApi(providerId);
      const conv = res.data || res;
      set({ activeConversation: conv });
      const s = get().socket;
      if (s && conv?.id) s.emit("joinConversation", conv.id);
      await get().fetchMessages(conv.id);
      return conv;
    } catch (err) {
      console.error("startConversation error:", err);
      throw err;
    }
  },

  setActiveConversation: async (conversation) => {
    if (!conversation) return;
    const s = get().socket;

    set({ activeConversation: conversation, messages: [] });

    if (s && conversation.id) {
      s.emit("joinConversation", conversation.id);
      s.emit("markAsRead", { conversationId: conversation.id, userId: get().userId });
      await get().fetchMessages(conversation.id);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversation.id ? { ...c, unreadCount: 0 } : c
        ),
      }));
    }
  },

  fetchMessages: async (conversationId, page = 1, limit = 50) => {
    if (!conversationId) return;
    try {
      const res = await getMessagesApi(conversationId, page, limit);
      const msgs = res.data?.data || res.data || res;
      set({ messages: msgs });
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
      }));
    } catch (err) {
      console.error("fetchMessages error:", err);
    }
  },

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

    let realConversationId = conversationId;

    // If conversation does not exist, create it
    const existingConv = get().conversations.find((c) => c.id === conversationId);
    if (!existingConv) {
      try {
        const res = await startConversationApi(conversationId); // here conversationId = providerId
        if (!res?.data?.id) throw new Error("Failed to create conversation");
        realConversationId = res.data.id;

        // Add to conversations
        set((state) => ({
          conversations: [...state.conversations, res.data],
          activeConversation: res.data,
          messages: [],
        }));

        s.emit("joinConversation", realConversationId);
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return;
      }
    }

    const payload = {
      conversationId: realConversationId,
      senderId: userId,
      content,
      fileUrl: fileBase64,
    };

    const tempMessage = {
      id: "tmp-" + Date.now(),
      conversationId: realConversationId,
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
