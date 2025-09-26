import useChatStore from "../../store/chatStore";
import useUserStore from "../../store/userStore";

export default function ConversationList() {
  const { conversations, activeConversation, setActiveConversation } = useChatStore();
  const user = useUserStore((s) => s.user);

  if (!conversations || conversations.length === 0) {
    return <p className="p-4 text-gray-500">No conversations yet</p>;
  }

const getOtherUserName = (conv) => {
  if (conv?.userId === user?.id) {
    // Other user is provider
    return conv?.provider?.providerProfile?.bussinessName || "Chat";
  } else {
    // Other user is user
    return conv?.user?.name || "Chat"; // ✅ always exists now
  }
};

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {conversations.map((conv) => (
        <div
          key={conv.id}
          className={`p-4 cursor-pointer border-b hover:bg-gray-100 ${
            activeConversation?.id === conv.id ? "bg-gray-200" : ""
          }`}
          onClick={() => setActiveConversation(conv)}
        >
          <p className="font-bold">{getOtherUserName(conv)}</p>
          <p className="text-sm text-gray-600">
            {conv.messages?.[0]?.content || "No messages yet"}
          </p>
          {conv.unreadCount > 0 && (
            <span className="text-xs text-red-500">{conv.unreadCount} unread</span>
          )}
        </div>
      ))}
    </div>
  );
}
