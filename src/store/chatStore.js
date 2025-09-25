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
    socket.on("newMessage", (message) => {
      const active = get().activeConversation;

      set((state) => {
        let newMessages = [...state.messages];

        // If temp message exists with same sender & content, replace it
        const tempIndex = newMessages.findIndex(
          (m) =>
            m.senderId === message.senderId &&
            m.content === message.content &&
            m.id.startsWith("tmp-")
        );

        if (tempIndex !== -1) {
          newMessages[tempIndex] = message; // replace temp with real
        } else if (active && active.id === message.conversationId) {
          newMessages = [...newMessages, message]; // append
        }

        return { messages: newMessages };
      });

      // update conversation preview + unread count
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

  // Send message (via WebSocket)
  sendMessage: async (conversationId, content, file = null) => {
    if (file) {
      // fallback to REST for file uploads if needed
      console.warn("File sending not yet implemented");
      return;
    }

    const s = get().socket;
    const userId = get().userId;
    if (!s) {
      console.warn("Socket not connected; cannot send message.");
      return;
    }

    const payload = { conversationId, senderId: userId, content };

    // Optimistic temp message
    const tempMessage = {
      id: "tmp-" + Date.now(),
      conversationId,
      senderId: userId,
      content,
      fileUrl: null,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, tempMessage] }));

    // Send to server
    s.emit("sendMessage", payload);
  },
}));

export default useChatStore;
