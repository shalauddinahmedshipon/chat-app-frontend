import { useNavigate } from "react-router-dom";
import useUserStore from "../store/userStore";
import useChatStore from "../store/chatStore";
import { useEffect, useMemo } from "react";

export default function ProviderCard({ provider }) {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const {
    conversations,
    loadingConversations,
    setActiveConversation,
    startConversation,
    fetchConversations,
  } = useChatStore();

  const existingConv = useMemo(() => {
    return conversations.find(
      (c) => c.providerId === provider.user.id || c.provider?.id === provider.user.id
    );
  }, [conversations, provider.user.id]);

  const handleMessage = async () => {
    if (!user) return;

    let conv = existingConv;

    if (!conv) {
      // No existing conversation, start a new one
      conv = await startConversation(provider.user.id);
    }

    // Set as active
    setActiveConversation(conv);

    // Navigate to chat page
    navigate(
      `/chat?conversationId=${conv.id}&providerId=${provider.user.id}&providerName=${provider.bussinessName}`
    );
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const isConversationsLoaded = !loadingConversations && conversations?.length >= 0;

  return (
    <div className="border rounded-lg shadow-md p-4 flex justify-between items-center">
      <div>
        <h3 className="font-bold text-lg">{provider.bussinessName}</h3>
        <p className="text-gray-600">{provider.email}</p>
        <p className="text-sm text-gray-500">{provider.phone}</p>
      </div>

      <button
        onClick={handleMessage}
        disabled={!isConversationsLoaded}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        Message
      </button>
    </div>
  );
}
