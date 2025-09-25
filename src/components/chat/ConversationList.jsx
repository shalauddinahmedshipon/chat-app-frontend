import React from "react";
import useChatStore from "../../store/chatStore";


export default function ConversationList() {
  const { conversations, activeConversation, setActiveConversation } = useChatStore();

  if (!conversations || conversations.length === 0) {
    return <p className="p-4 text-gray-500">No conversations yet</p>;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {conversations.map((conv) => {
        // Determine the "other user" in the conversation
        const otherUser = conv.userId === conv.user?.id ? conv.provider : conv.user;

        return (
          <div
            key={conv.id}
            className={`p-4 cursor-pointer border-b hover:bg-gray-100 ${
              activeConversation?.id === conv.id ? "bg-gray-200" : ""
            }`}
          onClick={() => setActiveConversation(conv)}
          >
            <p className="font-bold">{otherUser?.name || otherUser?.bussinessName}</p>
            <p className="text-sm text-gray-600">
              {conv.messages[0]?.content || "No messages yet"}
            </p>
            {conv.unreadCount > 0 && (
              <span className="text-xs text-red-500">{conv.unreadCount} unread</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
