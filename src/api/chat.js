import api from "./axios";

// Start conversation with provider
export const startConversationApi = async (providerId) => {
  const res = await api.post("/chat/start", { providerId });
  return res.data;
};

// Get all conversations
export const getConversationsApi = async (page = 1, limit = 10) => {
  const res = await api.get(`/chat/conversations?page=${page}&limit=${limit}`);
  return res.data;
};

// Get messages in a conversation
export const getMessagesApi = async (conversationId, page = 1, limit = 20) => {
  const res = await api.get(
    `/chat/${conversationId}/messages?page=${page}&limit=${limit}`
  );
  return res.data;
};

// Send a message (with optional file)
export const sendMessageApi = async (conversationId, content, file) => {
  const formData = new FormData();
  if (content) formData.append("content", content);
  if (file) formData.append("file", file);

  const res = await api.post(
    `/chat/conversations/${conversationId}/messages`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data;
};
