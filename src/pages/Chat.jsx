import { useEffect } from "react";
import ConversationList from "../components/chat/ConversationList";
import ChatBox from "../components/chat/ChatBox";
import useChatStore from "../store/chatStore";


export default function Chat() {
  const { fetchConversations, activeConversation } = useChatStore();

  useEffect(() => {
    fetchConversations();
  }, []);

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
