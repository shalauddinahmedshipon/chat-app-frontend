// src/pages/Chat.jsx
import { useEffect } from "react";
import ConversationList from "../components/chat/ConversationList";
import ChatBox from "../components/chat/ChatBox";
import useChatStore from "../store/chatStore";
import useUserStore from "../store/userStore";

export default function Chat() {
  const { fetchConversations, activeConversation, initSocket } = useChatStore();
  const user = useUserStore((s) => s.user);
  const token = useUserStore((s) => s.token);

  useEffect(() => {
    // initialize socket with token and userId (user must be defined)
    if (token && user) {
      initSocket(token, user.id);
    }
    // fetch initial conversations list
    fetchConversations();
  }, [token, user]);

  return (
    <div className="flex h-screen">
      {/* Conversation list */}
      <div className="w-1/4 border-r">
        <h2 className="font-bold p-4 border-b">Conversations</h2>
        <ConversationList />
      </div>

      {/* Chat box */}
      <div className="flex-1">
        {activeConversation ? (
          <ChatBox conversation={activeConversation} />
        ) : (
          <p className="p-6 text-gray-500">Select a conversation to start chatting</p>
        )}
      </div>
    </div>
  );
}
