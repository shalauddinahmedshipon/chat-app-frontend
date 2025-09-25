// src/store/chatStore.js
import { create } from "zustand";
import { io } from "socket.io-client";
import {
  startConversationApi,
  getConversationsApi,
  getMessagesApi,
} from "../api/chat";

const BACKEND_WS = "http://localhost:5000"; // adjust if needed

const useChatStore = create((set, get) => ({
  socket: null,
  conversations: [],
  messages: [],
  activeConversation: null,
  userId: null,
  connected: false,
  loadingConversations: false,

  // Initialize socket connection
  initSocket: (token, userId) => {
    if (!token) return;
    if (get().socket) return;

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

    // Handle new messages
    socket.on("newMessage", (message) => {
      const active = get().activeConversation;

      set((state) => {
        let newMessages = [...state.messages];

        // Replace temp messages if they exist
        const tempIndex = newMessages.findIndex(
          (m) =>
            m.id.startsWith("tmp-") &&
            ((m.content && m.content === message.content) ||
              (m.fileUrl && m.fileUrl.startsWith("data:")))
        );

        if (tempIndex !== -1) {
          newMessages[tempIndex] = message;
        } else if (active && active.id === message.conversationId) {
          newMessages.push(message);
        }

        return { messages: newMessages };
      });

      // Update conversation list
      set((state) => {
        const convs = [...state.conversations];
        const idx = convs.findIndex((c) => c.id === message.conversationId);
        if (idx !== -1) {
          convs[idx] = {
            ...convs[idx],
            messages: [message, ...(convs[idx].messages?.slice() || [])],
            unreadCount:
              active && active.id === message.conversationId
                ? 0
                : (convs[idx].unreadCount || 0) + 1,
            updatedAt: message.createdAt,
          };
        }
        return { conversations: convs };
      });
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connect_error:", err.message);
    });

    set({ socket });
  },

  // Disconnect socket
  disconnectSocket: () => {
    const s = get().socket;
    if (s) {
      s.disconnect();
      set({ socket: null, connected: false });
    }
  },

  // Fetch conversations
  fetchConversations: async (page = 1, limit = 20) => {
     set({ loadingConversations: true });
    try {
      const res = await getConversationsApi(page, limit);
      const convs = res.data?.data || res.data || res;
      set({ conversations: convs,loadingConversations: false });
    } catch (err) {
      console.error("fetchConversations error:", err);
      set({ loadingConversations: false });
    }
  },

  // Start conversation
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

  // Set active conversation
setActiveConversation: async (conversation, isVirtual = false) => {
  if (!conversation) return;

  const s = get().socket;

  // Check if this is a virtual conversation with a providerId
  let realConversation = conversation;

  if (isVirtual && conversation.providerId) {
    // Try to find an existing conversation with this provider
    const existing = get().conversations.find(
      (c) => c.providerId === conversation.providerId
    );
    if (existing) {
      realConversation = existing; // Use the existing conversation
      isVirtual = false; // no longer virtual
    }
  }

  // Set active conversation and clear messages
  set({ activeConversation: realConversation, messages: [] });

  if (s && !isVirtual && realConversation.id) {
    // Join real conversation room
    s.emit("joinConversation", realConversation.id);

    // Fetch messages from server
    await get().fetchMessages(realConversation.id);
  } else if (isVirtual) {
    // Virtual conversations start empty
    set({ messages: [] });

    // Add virtual conversation to store
    set((state) => ({
      conversations: [...state.conversations, realConversation],
    }));
  }
},


  // Fetch messages
  fetchMessages: async (conversationId, page = 1, limit = 50) => {
    if (!conversationId) return;
if (conversationId.startsWith("virtual_")) {
  set({ messages: [] });
  return;
}

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

  // Send message
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

    if (conversationId.startsWith("virtual_")) {
      try {
        const parts = conversationId.split("_");
        const providerId = parts[1];
        if (!providerId) throw new Error("Invalid virtual conversation ID");

        const res = await startConversationApi(providerId);
        if (!res?.data?.id) throw new Error("Invalid conversation returned");

        realConversationId = res.data.id;

        set((state) => ({
          conversations: [...state.conversations, res.data],
          activeConversation: res.data,
          messages: [],
        }));

        s.emit("joinConversation", realConversationId);
      } catch (err) {
        console.error("Failed to create real conversation from virtual:", err);
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
