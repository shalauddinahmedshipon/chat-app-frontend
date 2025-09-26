import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import ConversationList from "../components/chat/ConversationList";
import ChatBox from "../components/chat/ChatBox";
import useChatStore from "../store/chatStore";
import useUserStore from "../store/userStore";

export default function Chat() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const conversationId = query.get("conversationId");
  const providerId = query.get("providerId");
  const providerName = query.get("providerName");
console.log(providerId,providerName)
  const {
    fetchConversations, setActiveConversation, initSocket, activeConversation
  } = useChatStore();

  const user = useUserStore((s) => s.user);
  const token = useUserStore((s) => s.token);

  // Initialize socket + load conversations
  useEffect(() => {
    if (token && user) {
      initSocket(token, user.id);
    }
    fetchConversations();
  }, [token, user, initSocket, fetchConversations]);


// Handle query params: set active or virtual conversation
useEffect(() => {
  const state = useChatStore.getState();

  if (conversationId) {
    const existingConversation = state.conversations.find(
      (c) => c.id === conversationId
    );
    if (existingConversation) {
      setActiveConversation(existingConversation);
    } else {
      // No real conversation found, create virtual conversation
      if (providerId && providerName && user) {
        const virtualConv = {
          id: conversationId.startsWith("virtual_")
            ? conversationId
            : `virtual_${providerId}_${Date.now()}`,
          providerId,
          userId: user.id,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          provider: {
            id: providerId,
            providerProfile: { bussinessName: providerName },
          },
          messages: [],
          unreadCount: 0,
        };
        setActiveConversation(virtualConv, true);
      } else {
        setActiveConversation({ id: conversationId });
      }
    }
  } else if (providerId && providerName && user) {
    const existingConv = state.conversations.find(
      (c) => c.providerId === providerId || c.userId === providerId
    );

    if (existingConv) {
      setActiveConversation(existingConv);
    } else {
      // Create virtual conversation like ProviderCard
      const virtualId = `virtual_${providerId}_${Date.now()}`;
      const virtualConv = {
        id: virtualId,
        providerId,
        userId: user.id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        provider: {
          id: providerId,
          providerProfile: { bussinessName: providerName },
        },
        messages: [],
        unreadCount: 0,
      };
      setActiveConversation(virtualConv, true);
    }
  }
}, [conversationId, providerId, providerName, setActiveConversation, user]);

  return (
    <div className="flex h-screen">
      <div className="w-1/4 border-r">
       <Link to={"/providers"}>
       <button className="text-sm px-4 bg-gray-400 rounded-xl">All Provider</button>
    </Link>
        <h2 className="font-bold p-4 border-b">Conversations</h2>
        <ConversationList />
      </div>
      <div className="flex-1">
        {activeConversation ? (
          <ChatBox conversation={activeConversation} />
        ) : (
          <p className="p-6 text-gray-500">
            Select a conversation to start chatting
          </p>
        )}
      </div>
    </div>
  );
}
