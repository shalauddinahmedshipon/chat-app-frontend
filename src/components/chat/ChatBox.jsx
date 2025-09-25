import { useEffect } from "react";
import useChatStore from "../../store/chatStore";
import MessageInput from "./MessageInput";


export default function ChatBox({ conversation }) {
  const { messages, fetchMessages } = useChatStore();

  useEffect(() => {
    if (conversation?.id) fetchMessages(conversation.id);
  }, [conversation]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
       {messages.map((msg) =>
  msg?.content ? (
    <div
      key={msg.id}
      className={`p-2 rounded max-w-xs ${
        (msg.sender?.id || msg.senderId) === conversation.userId ? "bg-blue-200 self-start" : "bg-green-200 self-end"
      }`}
    >
      {msg.content}
    </div>
  ) : null
)}


      </div>
      <div className="p-4 border-t">
        <MessageInput conversationId={conversation.id} />
      </div>
    </div>
  );
}
